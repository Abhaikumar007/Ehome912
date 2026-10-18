const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PIN_MAPPING_FILE = path.resolve(__dirname, '../export/student_pins.json');
const pinMapping = JSON.parse(fs.readFileSync(PIN_MAPPING_FILE, 'utf8'));

// Build map: ROLL_NO -> PIN
const pinByRoll = new Map();
pinMapping.forEach((p) => {
  if (p.roll_no && p.new_pin) {
    pinByRoll.set(p.roll_no.toUpperCase().trim(), p.new_pin);
  }
});

async function restoreSupabasePins() {
  console.log('--- 1. Restoring unique 4-digit PINs in Supabase ---');
  let restored = 0;
  for (const item of pinMapping) {
    const { error } = await sb
      .from('students')
      .update({ pin: item.new_pin })
      .eq('roll_no', item.roll_no);

    if (error) {
      console.error(`Failed to update PIN for ${item.roll_no}:`, error.message);
    } else {
      restored++;
    }
  }
  console.log(`✅ Restored ${restored} student PINs in Supabase!`);

  // Verify
  const { data: checkData } = await sb.from('students').select('roll_no, pin');
  const count1234 = (checkData || []).filter((s) => s.pin === '1234').length;
  console.log(`Supabase verification: ${checkData?.length} students total, ${count1234} with '1234'`);
}

function patchSheetsClient() {
  console.log('--- 2. Patching C:/Users/madhu/code_test/private/js/sheets-client.js ---');
  const filePath = 'C:/Users/madhu/code_test/private/js/sheets-client.js';
  if (!fs.existsSync(filePath)) {
    console.warn('File not found:', filePath);
    return;
  }
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix 1: sb_loadFromCloud - include pin: r.pin in loadedStudents
  const targetLoadSnippet = "joiningDate: r.joining_date || (local ? local.joiningDate : '2026-01-15'),\n                        amount: (local && local.amount) ? String(local.amount) : '',\n                        subjects: (local && Array.isArray(local.subjects) && local.subjects.length > 0) ? local.subjects : []";
  const replacementLoadSnippet = "joiningDate: r.joining_date || (local ? local.joiningDate : '2026-01-15'),\n                        amount: (local && local.amount) ? String(local.amount) : '',\n                        subjects: (local && Array.isArray(local.subjects) && local.subjects.length > 0) ? local.subjects : [],\n                        pin: r.pin || (local ? local.pin : '')";

  if (code.includes(targetLoadSnippet)) {
    code = code.replace(targetLoadSnippet, replacementLoadSnippet);
    console.log('✓ Added pin preservation to sb_loadFromCloud in sheets-client.js');
  }

  // Fix 2: sb_saveStudent - do NOT overwrite pin with 1234!
  const targetUpsertStart = '// A. Upsert into students table\n            const { error: stuError } = await sb.from(\'students\').upsert({';
  const targetUpsertEnd = '}, { onConflict: \'roll_no\' });';

  const upsertIdx = code.indexOf(targetUpsertStart);
  if (upsertIdx !== -1) {
    const endIdx = code.indexOf(targetUpsertEnd, upsertIdx);
    if (endIdx !== -1) {
      const fullOldBlock = code.slice(upsertIdx, endIdx + targetUpsertEnd.length);
      const safeUpsertBlock = `// A. Update or Insert student WITHOUT clobbering existing PIN
            const stuPayload = {
                name: name,
                class_name: className,
                batch: (() => {
                    const syl = student.syllabus || (student.school === 'CBSE' || (student.batch && /cbse/i.test(student.batch)) ? 'CBSE' : 'State Syllabus');
                    let b = student.batch || '';
                    if (!b || b === className) return \`\${className} (\${syl})\`;
                    if (!b.includes(syl)) return \`\${b} (\${syl})\`;
                    return b;
                })(),
                avatar: avatar,
                phone: phone,
                streak: student.streak || 0,
                accuracy: student.accuracy || 0,
                tests_completed: student.tests_completed || 0,
                top_percent: student.top_percent || 0
            };

            // Check if student exists in Supabase
            const { data: existingStu } = await sb.from('students').select('id, pin').eq('roll_no', rollNo).maybeSingle();
            let stuError = null;
            if (existingStu) {
                // UPDATE: Only update PIN if explicitly provided and valid 4-digits; NEVER overwrite with default 1234
                if (student.pin && /^\\d{4}$/.test(String(student.pin).trim()) && String(student.pin).trim() !== '1234') {
                    stuPayload.pin = String(student.pin).trim();
                } else if (!existingStu.pin) {
                    stuPayload.pin = String(Math.floor(1000 + Math.random() * 9000));
                }
                const res = await sb.from('students').update(stuPayload).eq('roll_no', rollNo);
                stuError = res.error;
            } else {
                // INSERT: New student - use provided pin or generate random 4-digit PIN
                stuPayload.roll_no = rollNo;
                stuPayload.pin = (student.pin && /^\\d{4}$/.test(String(student.pin).trim()) && String(student.pin).trim() !== '1234')
                    ? String(student.pin).trim()
                    : String(Math.floor(1000 + Math.random() * 9000));
                const res = await sb.from('students').insert(stuPayload);
                stuError = res.error;
            }`;

      code = code.replace(fullOldBlock, safeUpsertBlock);
      console.log('✓ Replaced destructive student upsert with PIN-preserving update/insert in sb_saveStudent');
    }
  }

  // Fix 3: sb_migrateFromLocalStorage - prefetch existing students to preserve pins
  const targetBulkPush = `    if (sb) {\n        try {\n            const studentPayloads = students.map(s => {`;
  const safeBulkPush = `    if (sb) {\n        try {\n            // Pre-fetch existing students to strictly preserve their assigned PINs\n            const { data: existingStuList } = await sb.from('students').select('roll_no, pin');\n            const existingPinMap = new Map();\n            (existingStuList || []).forEach(e => { if (e.roll_no && e.pin) existingPinMap.set(String(e.roll_no).toUpperCase().trim(), e.pin); });\n\n            const studentPayloads = students.map(s => {`;

  if (code.includes(targetBulkPush)) {
    code = code.replace(targetBulkPush, safeBulkPush);
  }

  // Also replace `pin: s.pin || '1234',` in bulk upsert
  const targetPinLine = "pin: s.pin || '1234',";
  const safePinLine = "pin: (s.pin && s.pin !== '1234') ? s.pin : (existingPinMap.get(String(rollNo).toUpperCase().trim()) || s.pin || String(Math.floor(1000 + Math.random() * 9000))),";
  if (code.includes(targetPinLine)) {
    code = code.replace(targetPinLine, safePinLine);
    console.log('✓ Replaced pin in sb_migrateFromLocalStorage with existing PIN preservation');
  }

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('✅ sheets-client.js successfully patched!');
}

function patchAdminHtml() {
  console.log('--- 3. Patching C:/Users/madhu/code_test/private/add_student.html ---');
  const filePath = 'C:/Users/madhu/code_test/private/add_student.html';
  if (!fs.existsSync(filePath)) {
    console.warn('File not found:', filePath);
    return;
  }
  let html = fs.readFileSync(filePath, 'utf8');

  // Add PIN input field if not already present
  if (!html.includes('id="pin"')) {
    const targetPhoneGroup = `<div class="form-group">\n                            <label>Phone Number</label>\n                            <input type="tel" class="form-control" id="phone" required>\n                        </div>`;
    const newPinGroup = `<div class="form-group">\n                            <label>Phone Number</label>\n                            <input type="tel" class="form-control" id="phone" required>\n                        </div>\n\n                        <div class="form-group">\n                            <label>Student Login PIN (4 Digits) <small class="text-muted">(Auto-assigned if left blank)</small></label>\n                            <input type="text" class="form-control font-weight-bold" id="pin" maxlength="4" placeholder="e.g. 5015" pattern="[0-9]{4}">\n                            <small class="form-text text-muted">Used by student to log into the EduHome mobile app.</small>\n                        </div>`;

    if (html.includes(targetPhoneGroup)) {
      html = html.replace(targetPhoneGroup, newPinGroup);
      console.log('✓ Added Student PIN input field to add_student.html');
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✅ add_student.html successfully patched!');
}

function patchAdminJs() {
  console.log('--- 4. Patching C:/Users/madhu/code_test/private/js/admin.js ---');
  const filePath = 'C:/Users/madhu/code_test/private/js/admin.js';
  if (!fs.existsSync(filePath)) {
    console.warn('File not found:', filePath);
    return;
  }
  let js = fs.readFileSync(filePath, 'utf8');

  // Update MASTER_STUDENTS_ROSTER to include pins from pinByRoll
  pinByRoll.forEach((pin, roll) => {
    // Look for "rollNo": "roll"
    const regex = new RegExp(`("rollNo":\\s*"${roll}"[\\s\\S]*?"amount":\\s*"\\d+"),?`);
    if (regex.test(js) && !js.includes(`"rollNo": "${roll}",\n        "pin": "${pin}"`)) {
      js = js.replace(regex, `$1,\n        "pin": "${pin}"`);
    }
  });
  console.log('✓ Synchronized PINs into MASTER_STUDENTS_ROSTER');

  // Form submit handler: preserve or update PIN
  const targetEditAssign = `students[index] = {\n                    ...students[index],\n                    id: resolvedRoll,\n                    rollNo: resolvedRoll,\n                    name,\n                    class: studentClass,\n                    syllabus: syllabusType,\n                    batch: \`\${classGradeStr} (\${syllabusType})\`,\n                    school,\n                    phone,\n                    joiningDate: finalJoiningDate,\n                    amount: String(amount != null ? amount : ''),\n                    subjects\n                };`;

  const safeEditAssign = `const inputPin = document.getElementById('pin') ? document.getElementById('pin').value.trim() : '';\n                const assignedPin = (inputPin && /^\\d{4}$/.test(inputPin)) ? inputPin : (students[index].pin || '');\n                students[index] = {\n                    ...students[index],\n                    id: resolvedRoll,\n                    rollNo: resolvedRoll,\n                    name,\n                    class: studentClass,\n                    syllabus: syllabusType,\n                    batch: \`\${classGradeStr} (\${syllabusType})\`,\n                    school,\n                    phone,\n                    pin: assignedPin,\n                    joiningDate: finalJoiningDate,\n                    amount: String(amount != null ? amount : ''),\n                    subjects\n                };`;

  if (js.includes(targetEditAssign)) {
    js = js.replace(targetEditAssign, safeEditAssign);
    console.log('✓ Preserved pin during student edit in admin.js');
  }

  // Form add new student: preserve or generate PIN
  const targetAddAssign = `const newStudent = {\n                id: generatedRoll,\n                rollNo: generatedRoll,\n                name,\n                class: studentClass,\n                syllabus: syllabusType,\n                batch: \`\${classGradeStr} (\${syllabusType})\`,\n                school,\n                phone,\n                joiningDate: finalJoiningDate,\n                amount: String(amount != null ? amount : ''),\n                subjects\n            };`;

  const safeAddAssign = `const inputPinAdd = document.getElementById('pin') ? document.getElementById('pin').value.trim() : '';\n            const newPin = (inputPinAdd && /^\\d{4}$/.test(inputPinAdd)) ? inputPinAdd : String(Math.floor(1000 + Math.random() * 9000));\n            const newStudent = {\n                id: generatedRoll,\n                rollNo: generatedRoll,\n                name,\n                class: studentClass,\n                syllabus: syllabusType,\n                batch: \`\${classGradeStr} (\${syllabusType})\`,\n                school,\n                phone,\n                pin: newPin,\n                joiningDate: finalJoiningDate,\n                amount: String(amount != null ? amount : ''),\n                subjects\n            };`;

  if (js.includes(targetAddAssign)) {
    js = js.replace(targetAddAssign, safeAddAssign);
    console.log('✓ Added random PIN generation for new students in admin.js');
  }

  // Form reset: clear pin input
  const targetReset = `document.getElementById('studentId').value = '';`;
  const safeReset = `document.getElementById('studentId').value = '';\n        if (document.getElementById('pin')) document.getElementById('pin').value = '';`;
  if (js.includes(targetReset) && !js.includes("document.getElementById('pin').value = ''")) {
    js = js.replace(targetReset, safeReset);
  }

  // editStudent function: populate pin input
  const targetEditPopulate = `document.getElementById('phone').value = student.phone;`;
  const safeEditPopulate = `document.getElementById('phone').value = student.phone;\n        if (document.getElementById('pin')) document.getElementById('pin').value = student.pin || '';`;
  if (js.includes(targetEditPopulate) && !js.includes("document.getElementById('pin').value = student.pin")) {
    js = js.replace(targetEditPopulate, safeEditPopulate);
    console.log('✓ Populated pin in editStudent function in admin.js');
  }

  // renderStudentManagementList: display PIN badge
  const targetBadge = `${"${s.rollNo ? `<br><small class=\"badge badge-light border text-muted\" style=\"font-size:0.7rem;\">${s.rollNo}</small>` : ''}"}`;
  const safeBadge = `${"${s.rollNo ? `<br><small class=\"badge badge-light border text-muted\" style=\"font-size:0.7rem;\">${s.rollNo}</small>` : ''}\n                    ${s.pin ? `<span class=\"badge badge-warning text-dark ml-1 font-weight-bold\" style=\"font-size:0.7rem; letter-spacing:0.5px;\"><i class=\"fas fa-key fa-xs mr-1\"></i>PIN: ${s.pin}</span>` : ''}"}`;

  if (js.includes(targetBadge) && !js.includes('PIN: ${s.pin}')) {
    js = js.replace(targetBadge, safeBadge);
    console.log('✓ Added PIN badge display to student management table in admin.js');
  }

  // exportSupabaseSQL helper: use existing PIN or random, never default to 1234
  const targetSqlPin = "pin: s.pin && String(s.pin).length === 4 ? String(s.pin) : '1234',";
  const safeSqlPin = "pin: s.pin && String(s.pin).length === 4 ? String(s.pin) : String(Math.floor(1000 + Math.random() * 9000)),";
  if (js.includes(targetSqlPin)) {
    js = js.replace(targetSqlPin, safeSqlPin);
  }

  fs.writeFileSync(filePath, js, 'utf8');
  console.log('✅ admin.js successfully patched!');
}

function patchMasterHub() {
  console.log('--- 5. Patching master_hub.js & generator script ---');
  const targetJsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';
  const generatorScript = path.resolve(__dirname, 'create_master_hub_js.js');

  [targetJsPath, generatorScript].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      let code = fs.readFileSync(filePath, 'utf8');

      // Replace default pin in addNewGridRow
      code = code.replace(/pin:\s*['"]1234['"]/g, "pin: String(Math.floor(1000 + Math.random() * 9000))");

      fs.writeFileSync(filePath, code, 'utf8');
      console.log(`✓ Patched default 1234 in ${path.basename(filePath)}`);
    }
  });
  console.log('✅ master_hub files successfully patched!');
}

async function main() {
  await restoreSupabasePins();
  patchSheetsClient();
  patchAdminHtml();
  patchAdminJs();
  patchMasterHub();
  console.log('\n🎉 ALL UPDATES COMPLETED SUCCESSFULLY!');
}

main().catch(console.error);
