const fs = require('fs');

console.log('--- PATCHING CODE_TEST FILES ---');

// 1. Patch add_student.html
const addStudentPath = 'c:/Users/madhu/code_test/private/add_student.html';
let addStudentHtml = fs.readFileSync(addStudentPath, 'utf8');

if (!addStudentHtml.includes('id="syllabusType"')) {
  const targetClassDiv = `                        <div class="form-group">
                            <label>Class</label>
                            <select class="form-control" id="class" required>
                                <option value="">Select Class</option>
                                <option value="6">Class 6</option>
                                <option value="7">Class 7</option>
                                <option value="8">Class 8</option>
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                                <option value="11">Class 11</option>
                                <option value="12">Class 12</option>
                            </select>
                        </div>`;

  const replacementSyllabusDiv = `                        <div class="form-group">
                            <label>Class</label>
                            <select class="form-control" id="class" required>
                                <option value="">Select Class</option>
                                <option value="6">Class 6</option>
                                <option value="7">Class 7</option>
                                <option value="8">Class 8</option>
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                                <option value="11">Class 11</option>
                                <option value="12">Class 12</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Syllabus Type <span class="text-danger">*</span></label>
                            <select class="form-control" id="syllabusType" required>
                                <option value="">Select Syllabus Type</option>
                                <option value="State Syllabus">State Syllabus</option>
                                <option value="CBSE">CBSE</option>
                            </select>
                        </div>`;

  if (addStudentHtml.includes(targetClassDiv)) {
    addStudentHtml = addStudentHtml.replace(targetClassDiv, replacementSyllabusDiv);
    fs.writeFileSync(addStudentPath, addStudentHtml, 'utf8');
    console.log('✓ Patched add_student.html successfully');
  } else {
    console.warn('Could not find exact targetClassDiv in add_student.html, checking regex...');
    addStudentHtml = addStudentHtml.replace(/(<select class="form-control" id="class" required>[\s\S]*?<\/select>\s*<\/div>)/, `$1\n\n                        <div class="form-group">\n                            <label>Syllabus Type <span class="text-danger">*</span></label>\n                            <select class="form-control" id="syllabusType" required>\n                                <option value="">Select Syllabus Type</option>\n                                <option value="State Syllabus">State Syllabus</option>\n                                <option value="CBSE">CBSE</option>\n                            </select>\n                        </div>`);
    fs.writeFileSync(addStudentPath, addStudentHtml, 'utf8');
    console.log('✓ Patched add_student.html with regex fallback');
  }
} else {
  console.log('add_student.html already contains syllabusType');
}

// 2. Patch timetable.html
const timetablePath = 'c:/Users/madhu/code_test/private/timetable.html';
let timetableHtml = fs.readFileSync(timetablePath, 'utf8');
timetableHtml = timetableHtml.replace(
  /<label>Board <small class="text-muted">\(Classes 6–10\)<\/small><\/label>\s*<select class="form-control" id="timetableBoard">[\s\S]*?<\/select>/,
  `<label>Target Syllabus <span class="text-danger">*</span></label>
                            <select class="form-control" id="timetableBoard">
                                <option value="Both">Both (State & CBSE)</option>
                                <option value="State Syllabus">State Syllabus</option>
                                <option value="CBSE">CBSE</option>
                            </select>`
);
fs.writeFileSync(timetablePath, timetableHtml, 'utf8');
console.log('✓ Patched timetable.html Target Syllabus options');

// 3. Patch admin.js
const adminJsPath = 'c:/Users/madhu/code_test/private/js/admin.js';
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

// A. Handle syllabus in addStudentForm submit
if (!adminJs.includes('const syllabusType = document.getElementById(\'syllabusType\')')) {
  adminJs = adminJs.replace(
    /const studentClass = document\.getElementById\('class'\)\.value;\s*const school = document\.getElementById\('school'\)\.value;/g,
    `const studentClass = document.getElementById('class').value;
        const syllabusType = document.getElementById('syllabusType') ? document.getElementById('syllabusType').value : 'State Syllabus';
        const school = document.getElementById('school').value;`
  );

  // Validate syllabus
  adminJs = adminJs.replace(
    /if \(id\) \{\s*\/\/ EDIT MODE/,
    `if (!syllabusType) {
            alert('Please select a Syllabus Type (State Syllabus or CBSE).');
            return;
        }

        if (id) {
            // EDIT MODE`
  );

  // Edit mode object
  adminJs = adminJs.replace(
    /students\[index\] = \{\s*\.\.\.students\[index\],\s*name,\s*class: studentClass,\s*school,/g,
    `const classGradeStr = studentClass.startsWith('Class') ? studentClass : 'Class ' + studentClass;
                students[index] = {
                    ...students[index],
                    name,
                    class: studentClass,
                    syllabus: syllabusType,
                    batch: \`\${classGradeStr} (\${syllabusType})\`,
                    school,`
  );

  // Add mode object
  adminJs = adminJs.replace(
    /const newStudent = \{\s*id: Date\.now\(\)\.toString\(\),\s*name,\s*class: studentClass,\s*school,/g,
    `const classGradeStr = studentClass.startsWith('Class') ? studentClass : 'Class ' + studentClass;
            const newStudent = {
                id: Date.now().toString(),
                name,
                class: studentClass,
                syllabus: syllabusType,
                batch: \`\${classGradeStr} (\${syllabusType})\`,
                school,`
  );

  // Reset form syllabus
  adminJs = adminJs.replace(
    /document\.getElementById\('studentId'\)\.value = '';/g,
    `document.getElementById('studentId').value = '';
        if (document.getElementById('syllabusType')) document.getElementById('syllabusType').value = '';`
  );

  console.log('✓ Patched admin.js addStudentForm handler');
}

// B. Populate syllabus in editStudent
if (!adminJs.includes('// Populate syllabusType')) {
  adminJs = adminJs.replace(
    /document\.getElementById\('school'\)\.value = student\.school;/g,
    `// Populate syllabusType
        const sylSelect = document.getElementById('syllabusType');
        if (sylSelect) {
            let syl = student.syllabus;
            if (!syl && student.batch) {
                if (/cbse/i.test(student.batch)) syl = 'CBSE';
                else if (/state/i.test(student.batch)) syl = 'State Syllabus';
            }
            if (!syl && student.school && /cbse/i.test(student.school)) {
                syl = 'CBSE';
            }
            sylSelect.value = syl || 'State Syllabus';
        }
        document.getElementById('school').value = student.school;`
  );
  console.log('✓ Patched admin.js editStudent populator');
}

// C. Show syllabus badge in renderStudentManagementList
if (!adminJs.includes('const sylBadge =')) {
  adminJs = adminJs.replace(
    /<td>Class \$\{s\.class\}<\/td>/g,
    `<td>
                    Class \${s.class}
                    \${(() => {
                        const sSyl = s.syllabus || (s.batch && /cbse/i.test(s.batch) ? 'CBSE' : (s.school && /cbse/i.test(s.school) ? 'CBSE' : 'State Syllabus'));
                        return sSyl === 'CBSE'
                            ? '<br><span class="badge" style="font-size:0.7rem; background-color:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; margin-top:3px; padding:2px 6px;">CBSE</span>'
                            : '<br><span class="badge" style="font-size:0.7rem; background-color:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; margin-top:3px; padding:2px 6px;">State Syllabus</span>';
                    })()}
                </td>`
  );
  console.log('✓ Patched admin.js renderStudentManagementList table row');
}

// D. Update board select in Timetable builder (don't hide for 11/12, support State Syllabus / CBSE / Both)
adminJs = adminJs.replace(
  /function updateBoardVisibility\(\) \{\s*const cls = classSelect\.value;\s*const isHigher = \(cls === '11' \|\| cls === '12'\);\s*if \(isHigher\) \{\s*boardGroup\.classList\.add\('hidden-smooth'\);\s*boardSelect\.value = 'Both'; \/\/ default for 11\/12\s*\} else \{\s*boardGroup\.classList\.remove\('hidden-smooth'\);\s*\}\s*\}/,
  `function updateBoardVisibility() {
        if (boardGroup) boardGroup.classList.remove('hidden-smooth');
    }`
);

// E. In addTimetableEntryBtn, embed syllabus into finalTime and statusStr
if (!adminJs.includes('const boardTag =')) {
  adminJs = adminJs.replace(
    /const statusStr = 'upcoming' \+ \(statusTag \? ':' \+ statusTag : ''\) \+ \(facultyId \? ':' \+ facultyId : ''\);/,
    `const boardTag = (board === 'CBSE') ? 'CBSE' : (board === 'State Syllabus' || board === 'State') ? 'State' : 'Both';
                const statusStr = 'upcoming' + (boardTag !== 'Both' ? ':' + boardTag : '') + (statusTag ? ':' + statusTag : '') + (facultyId ? ':' + facultyId : '');`
  );

  adminJs = adminJs.replace(
    /const timeParts = \[timeStr\];\s*if \(sessionTag && sessionTag !== 'Regular' && sessionTag !== 'Regular Class'\) \{\s*timeParts\.push\(sessionTag\);\s*\}/,
    `const timeParts = [timeStr];
                if (board === 'CBSE') {
                    timeParts.push('CBSE');
                } else if (board === 'State Syllabus' || board === 'State') {
                    timeParts.push('State Syllabus');
                }
                if (sessionTag && sessionTag !== 'Regular' && sessionTag !== 'Regular Class') {
                    timeParts.push(sessionTag);
                }`
  );
  console.log('✓ Patched admin.js timetable builder Supabase sync with syllabus');
}

fs.writeFileSync(adminJsPath, adminJs, 'utf8');
console.log('✓ Wrote updated admin.js');

// 4. Patch sheets-client.js
const sheetsPath = 'c:/Users/madhu/code_test/private/js/sheets-client.js';
let sheetsClient = fs.readFileSync(sheetsPath, 'utf8');

if (!sheetsClient.includes('// Syllabus-aware batch formatting')) {
  sheetsClient = sheetsClient.replace(
    /batch: student\.batch \|\| className,/g,
    `// Syllabus-aware batch formatting
                batch: (() => {
                    const syl = student.syllabus || (student.school === 'CBSE' || (student.batch && /cbse/i.test(student.batch)) ? 'CBSE' : 'State Syllabus');
                    let b = student.batch || '';
                    if (!b || b === className) return \`\${className} (\${syl})\`;
                    if (!b.includes(syl)) return \`\${b} (\${syl})\`;
                    return b;
                })(),`
  );
  fs.writeFileSync(sheetsPath, sheetsClient, 'utf8');
  console.log('✓ Patched sheets-client.js sb_saveStudent');
}

// 5. Patch live_timetable.js
const liveTtPath = 'c:/Users/madhu/code_test/private/js/live_timetable.js';
let liveTt = fs.readFileSync(liveTtPath, 'utf8');

// A. Inject Target Syllabus dropdown into editLiveClassModal
if (!liveTt.includes('id="editClassSyllabus"')) {
  liveTt = liveTt.replace(
    /<div class="form-group mb-3">\s*<label class="font-weight-bold text-dark small mb-1">Grade \/ Class<\/label>\s*<select class="form-control" id="editClassGrade"[\s\S]*?<\/select>\s*<\/div>/,
    `<div class="form-group mb-3">
                            <label class="font-weight-bold text-dark small mb-1">Grade / Class</label>
                            <select class="form-control" id="editClassGrade" onchange="window.handleEditSubjectOrGradeChange()" required>
                                <option value="Class 6">Class 6</option>
                                <option value="Class 7">Class 7</option>
                                <option value="Class 8">Class 8</option>
                                <option value="Class 9">Class 9</option>
                                <option value="Class 10">Class 10</option>
                                <option value="Class 11">Class 11</option>
                                <option value="Class 12">Class 12</option>
                            </select>
                        </div>
                        <div class="form-group mb-3">
                            <label class="font-weight-bold text-dark small mb-1">Target Syllabus</label>
                            <select class="form-control" id="editClassSyllabus">
                                <option value="Both">Both (State & CBSE)</option>
                                <option value="State Syllabus">State Syllabus</option>
                                <option value="CBSE">CBSE</option>
                            </select>
                        </div>`
  );
  console.log('✓ Injected Target Syllabus in live_timetable.js edit modal');
}

// B. Populate editClassSyllabus in openEditClassModal
if (!liveTt.includes('// Populate editClassSyllabus')) {
  liveTt = liveTt.replace(
    /document\.getElementById\('editClassDate'\)\.value = item\.class_date \|\| '';/,
    `document.getElementById('editClassDate').value = item.class_date || '';
        // Populate editClassSyllabus
        const normSylStatus = (item.status || '').toLowerCase();
        const normSylTime = (item.time || '').toLowerCase();
        let detectedSyl = 'Both';
        if (normSylStatus.includes(':cbse') || normSylStatus.includes('cbse:') || normSylTime.includes('• cbse') || normSylTime.includes('(cbse)')) {
            detectedSyl = 'CBSE';
        } else if (normSylStatus.includes(':state') || normSylStatus.includes('state:') || normSylTime.includes('• state') || normSylTime.includes('(state)')) {
            detectedSyl = 'State Syllabus';
        }
        const sylInput = document.getElementById('editClassSyllabus');
        if (sylInput) sylInput.value = detectedSyl;`
  );
  console.log('✓ Populated editClassSyllabus in openEditClassModal');
}

// C. In saveLiveClassEdit, embed syllabus into finalTime and finalStatus
if (!liveTt.includes('const targetSyl =')) {
  liveTt = liveTt.replace(
    /const sessTypeEl = document\.getElementById\('editClassSessionType'\);/g,
    `const targetSyl = document.getElementById('editClassSyllabus') ? document.getElementById('editClassSyllabus').value : 'Both';
            const sessTypeEl = document.getElementById('editClassSessionType');`
  );

  liveTt = liveTt.replace(
    /const timeParts = \[timeStr\];\s*if \(sessionTag && sessionTag !== 'Regular' && sessionTag !== 'Regular Class'\) \{\s*timeParts\.push\(sessionTag\);\s*\}/,
    `const timeParts = [timeStr];
            if (targetSyl === 'CBSE') {
                timeParts.push('CBSE');
            } else if (targetSyl === 'State Syllabus') {
                timeParts.push('State Syllabus');
            }
            if (sessionTag && sessionTag !== 'Regular' && sessionTag !== 'Regular Class') {
                timeParts.push(sessionTag);
            }`
  );

  liveTt = liveTt.replace(
    /const finalStatus = \(statusTag\)\s*\? `\$\{status\}:\$\{statusTag\}\$\{facultyId \? ':' \+ facultyId : ''\}`\s*: \(facultyId \? `\$\{status\}:\$\{facultyId\}` : \(facultyName \? `\$\{status\}:fac` : status\)\);/,
    `const sylTag = targetSyl === 'CBSE' ? 'CBSE' : targetSyl === 'State Syllabus' ? 'State' : '';
            const finalStatus = [
                status,
                sylTag,
                statusTag,
                facultyId || (facultyName ? 'fac' : '')
            ].filter(Boolean).join(':');`
  );
  console.log('✓ Patched live_timetable.js saveLiveClassEdit with syllabus');
}

// D. Show syllabus badge on live timetable cards
if (!liveTt.includes('cardSylBadge')) {
  liveTt = liveTt.replace(
    /<div class="d-flex align-items-center mb-1 flex-wrap">/g,
    `<div class="d-flex align-items-center mb-1 flex-wrap">
                    \${(() => {
                        const cSt = (item.status || '').toLowerCase();
                        const cTm = (item.time || '').toLowerCase();
                        let cSyl = 'Both';
                        if (cSt.includes(':cbse') || cSt.includes('cbse:') || cTm.includes('• cbse') || cTm.includes('(cbse)')) {
                            cSyl = 'CBSE';
                        } else if (cSt.includes(':state') || cSt.includes('state:') || cTm.includes('• state') || cTm.includes('(state)')) {
                            cSyl = 'State Syllabus';
                        }
                        if (cSyl === 'CBSE') {
                            return '<span class="badge mr-2 mb-1" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-size:0.75rem; padding:3px 8px; border-radius:4px;"><i class="fas fa-book mr-1"></i>CBSE</span>';
                        } else if (cSyl === 'State Syllabus') {
                            return '<span class="badge mr-2 mb-1" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-size:0.75rem; padding:3px 8px; border-radius:4px;"><i class="fas fa-graduation-cap mr-1"></i>State Syllabus</span>';
                        }
                        return '<span class="badge mr-2 mb-1" style="background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; font-size:0.75rem; padding:3px 8px; border-radius:4px;"><i class="fas fa-layer-group mr-1"></i>State & CBSE</span>';
                    })()}`
  );
  console.log('✓ Patched live_timetable.js card badges');
}

fs.writeFileSync(liveTtPath, liveTt, 'utf8');
console.log('✓ Wrote updated live_timetable.js');
console.log('=== ALL CODE_TEST FILES PATCHED SUCCESSFULLY ===');
