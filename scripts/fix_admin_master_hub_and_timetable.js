const fs = require('fs');

const adminJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
const masterHubPath = 'C:\\Users\\madhu\\code_test\\private\\js\\master_hub.js';
const sheetsClientPath = 'C:\\Users\\madhu\\code_test\\private\\js\\sheets-client.js';

let adminJs = fs.readFileSync(adminJsPath, 'utf8');
let masterHub = fs.readFileSync(masterHubPath, 'utf8');
let sheetsClient = fs.readFileSync(sheetsClientPath, 'utf8');

// ─── 1. DEDUPLICATE getStudents() IN admin.js ─────────────────────────────────────────
// Replace getStudents() implementation with rigorous multi-criteria deduplication
const oldGetStudentsStart = 'function getStudents() {';
const oldGetStudentsEnd = 'function saveStudents(students) {';

const idx1 = adminJs.indexOf(oldGetStudentsStart);
const idx2 = adminJs.indexOf(oldGetStudentsEnd);

if (idx1 !== -1 && idx2 !== -1) {
  const newGetStudents = `function getStudents() {
    let list = [];
    try {
        const stored = localStorage.getItem('students');
        if (stored) list = JSON.parse(stored);
    } catch (e) {}

    // Deduplicate and consolidate any duplicates by rollNo, name, or phone
    const masterMapByName = new Map();
    const masterMapByRoll = new Map();
    if (typeof MASTER_STUDENTS_ROSTER !== 'undefined' && Array.isArray(MASTER_STUDENTS_ROSTER)) {
        MASTER_STUDENTS_ROSTER.forEach(m => {
            if (m.name) masterMapByName.set(m.name.toLowerCase().trim(), m);
            if (m.rollNo) masterMapByRoll.set(m.rollNo.toUpperCase().trim(), m);
            if (m.id) masterMapByRoll.set(m.id.toUpperCase().trim(), m);
        });
    }

    const finalMap = new Map();
    let needsSave = false;

    // Process stored students and merge duplicates
    if (Array.isArray(list) && list.length > 0) {
        list.forEach(s => {
            const normName = (s.name || '').toLowerCase().trim();
            const roll = (s.rollNo || s.roll_no || s.id || '').toUpperCase().trim();
            const master = masterMapByRoll.get(roll) || masterMapByName.get(normName);

            // Canonical key: prefer official master rollNo, or normalized name + class
            const key = master ? (master.rollNo || master.id) : (normName ? normName + '_' + (s.class || '10') : roll);
            if (!key) return;

            if (!finalMap.has(key)) {
                finalMap.set(key, {
                    id: master ? (master.rollNo || master.id) : (s.id || roll),
                    rollNo: master ? master.rollNo : (s.rollNo || roll),
                    name: master ? master.name : (s.name || 'Student'),
                    class: String(master ? master.class : (s.class || '10')).replace('Class ', '').trim(),
                    school: master ? master.school : (s.school || 'EduHome Campus'),
                    phone: master ? master.phone : (s.phone || ''),
                    joiningDate: master ? master.joiningDate : (s.joiningDate || '2026-01-15'),
                    amount: master ? String(master.amount) : String(s.amount || 4000),
                    subjects: (master && master.subjects && master.subjects.length > 0)
                        ? master.subjects
                        : (Array.isArray(s.subjects) && s.subjects.length > 0 ? s.subjects : ['General Tuition'])
                });
            } else {
                needsSave = true; // Consolidating a duplicate
            }
        });
    }

    // Ensure all 50 students from master roster are populated
    if (typeof MASTER_STUDENTS_ROSTER !== 'undefined' && Array.isArray(MASTER_STUDENTS_ROSTER)) {
        MASTER_STUDENTS_ROSTER.forEach(m => {
            const k = (m.rollNo || m.id);
            if (!finalMap.has(k)) {
                finalMap.set(k, JSON.parse(JSON.stringify(m)));
                needsSave = true;
            }
        });
    }

    const deduplicated = Array.from(finalMap.values());
    if (needsSave || !list || list.length !== deduplicated.length) {
        try { localStorage.setItem('students', JSON.stringify(deduplicated)); } catch (e) {}
    }

    return deduplicated;
}
`;
  adminJs = adminJs.slice(0, idx1) + newGetStudents + '\n' + adminJs.slice(idx2);
  console.log('Updated getStudents() in admin.js with robust deduplication.');
}

// ─── 2. FIX BULK TIMETABLE ADD ENTRY IN admin.js ─────────────────────────────────────
// When admin adds an entry, replace existing slot for same class, date, and subject instead of duplicating
const oldAddEntryPattern = `        const entry = { date, startTime, endTime, class: studentClass, subject, location, board, sessionType };
        timetableEntries.push(entry);
        renderTimetable();`;

const newAddEntryPattern = `        const entry = { date, startTime, endTime, class: studentClass, subject, location, board, sessionType };
        
        // If entry already exists for same class, date, and subject, update it cleanly
        const existingIdx = timetableEntries.findIndex(e => 
            e.class === studentClass && 
            e.date === date && 
            (e.subject || '').toLowerCase().trim() === (subject || '').toLowerCase().trim()
        );
        if (existingIdx !== -1) {
            timetableEntries[existingIdx] = entry;
        } else {
            timetableEntries.push(entry);
        }
        renderTimetable();`;

if (adminJs.includes(oldAddEntryPattern)) {
  adminJs = adminJs.replace(oldAddEntryPattern, newAddEntryPattern);
  console.log('Updated addTimetableEntryBtn to update existing slots rather than duplicate.');
} else {
  console.log('oldAddEntryPattern not found verbatim in admin.js.');
}

// ─── 3. ENHANCE shareTimetableToApp IN admin.js ───────────────────────────────────────
// Cleanly delete previous entries and insert deduplicated class sessions
const oldShareTimetableStart = 'window.shareTimetableToApp = async function () {';
const oldShareTimetableEnd = '// --- ATTENDANCE PAGE ---';

const idxShare1 = adminJs.indexOf(oldShareTimetableStart);
const idxShare2 = adminJs.indexOf(oldShareTimetableEnd);

if (idxShare1 !== -1 && idxShare2 !== -1) {
  const newShareTimetable = `window.shareTimetableToApp = async function () {
        const rawEntries = (typeof timetableEntries !== 'undefined' && timetableEntries.length > 0) 
            ? timetableEntries 
            : (window.timetableEntries || []);

        if (!rawEntries || rawEntries.length === 0) {
            alert("Please add at least one timetable entry to share.");
            return;
        }

        const shareBtn = document.getElementById('shareAppBtn');
        if (shareBtn) {
            shareBtn.disabled = true;
            shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Sharing to App...';
        }

        try {
            const sb = _getSupabaseClient();
            if (!sb) {
                alert("Database connection not ready. Please check your network and try again.");
                if (shareBtn) {
                    shareBtn.disabled = false;
                    shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Share Timetable to Mobile App';
                }
                return;
            }

            function to12Hr(t) {
                if (!t) return '';
                const parts = t.split(':');
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1] || '0', 10);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                return h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
            }

            // Deduplicate entries so each class + subject + date has only 1 final slot
            const entriesMap = new Map();
            rawEntries.forEach(e => {
                const rawCls = String(e.class || '').trim();
                const gradeStr = rawCls.startsWith('Class') ? rawCls : 'Class ' + rawCls;
                const normSub = (e.subject || '').trim().toLowerCase();
                const key = gradeStr + '_' + normSub + '_' + e.date;
                entriesMap.set(key, e);
            });
            const deduplicatedEntries = Array.from(entriesMap.values());

            const rowsToInsert = [];
            const announcementsToInsert = [];

            for (const entry of deduplicatedEntries) {
                let timeStr = '';
                if (entry.startTime && entry.endTime) {
                    timeStr = to12Hr(entry.startTime) + ' - ' + to12Hr(entry.endTime);
                } else if (entry.startTime) {
                    timeStr = to12Hr(entry.startTime);
                } else {
                    timeStr = 'Scheduled';
                }

                const rawCls = String(entry.class || '').trim();
                const gradeStr = rawCls.startsWith('Class') ? rawCls : 'Class ' + rawCls;

                // 1. Delete previous entries for this grade, date, and subject from Supabase
                await sb.from('classes')
                    .delete()
                    .eq('class_grade', gradeStr)
                    .eq('class_date', entry.date)
                    .eq('subject', entry.subject);

                // Also delete if stored with roll_no = gradeStr
                await sb.from('classes')
                    .delete()
                    .eq('roll_no', gradeStr)
                    .eq('class_date', entry.date)
                    .eq('subject', entry.subject);

                // 2. Insert exactly 1 clean class session
                rowsToInsert.push({
                    roll_no: gradeStr,
                    class_grade: gradeStr,
                    subject: entry.subject,
                    time: timeStr,
                    status: 'upcoming',
                    published: true,
                    class_date: entry.date,
                });

                announcementsToInsert.push({
                    title: '🗓️ Timetable: ' + gradeStr + ' - ' + entry.subject,
                    description: 'Date: ' + formatDateFriendly(entry.date) + ' | Time: ' + timeStr + ' | Venue: ' + (entry.location || 'In Center') + ' (' + (entry.board || 'Both') + ' Board). Check your schedule tab.',
                    author: 'Center Admin',
                    tag: 'Timetable',
                    important: true,
                });
            }

            // 1. Insert clean sessions into Supabase
            const { error: classErr } = await sb.from('classes').insert(rowsToInsert);
            if (classErr) {
                console.error('Error inserting classes:', classErr);
                throw classErr;
            }

            // 2. Broadcast announcement so mobile alerts fire instantly
            if (announcementsToInsert.length > 0) {
                await sb.from('announcements').insert(announcementsToInsert);
            }

            alert('✅ Timetable Successfully Shared to Mobile App!\\n\\n' + rowsToInsert.length + ' class schedule session(s) published.\\nAll students in the class and faculty will see this schedule on their live dashboard.');
        } catch (e) {
            console.error('Failed to share timetable:', e);
            alert("Failed to share timetable to mobile app: " + (e.message || e));
        } finally {
            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Share Timetable to Mobile App';
            }
        }
    };
}
`;
  adminJs = adminJs.slice(0, idxShare1) + newShareTimetable + '\n\n' + adminJs.slice(idxShare2);
  console.log('Updated shareTimetableToApp in admin.js.');
}

fs.writeFileSync(adminJsPath, adminJs, 'utf8');

// ─── 4. UPDATE master_hub.js ──────────────────────────────────────────────────────────
// Ensure refreshMasterData uses getStudents() and deduplicates down to 50
const oldRefreshStart = 'async function refreshMasterData() {';
const oldRefreshEnd = 'function renderMasterGrid(list) {';

const mIdx1 = masterHub.indexOf(oldRefreshStart);
const mIdx2 = masterHub.indexOf(oldRefreshEnd);

if (mIdx1 !== -1 && mIdx2 !== -1) {
  const newRefresh = `async function refreshMasterData() {
    const tbody = document.getElementById('masterGridTbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading student records from storage...</td></tr>';
    }

    // Always fetch deduplicated list
    let students = [];
    if (typeof getStudents === 'function') {
        students = getStudents();
    } else {
        students = JSON.parse(localStorage.getItem('students')) || [];
    }

    // Extra deduplication safeguard to guarantee no duplicate rows
    const uniqueMap = new Map();
    students.forEach(s => {
        const roll = (s.rollNo || s.roll_no || s.id || '').toUpperCase().trim();
        const normName = (s.name || '').toLowerCase().trim();
        const key = roll ? roll : (normName + '_' + (s.class || '10'));
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, s);
        }
    });

    const uniqueStudents = Array.from(uniqueMap.values());
    currentStudents = JSON.parse(JSON.stringify(uniqueStudents));
    originalStudents = JSON.parse(JSON.stringify(uniqueStudents));

    // Save cleaned list so localStorage is permanently de-duplicated
    try { localStorage.setItem('students', JSON.stringify(uniqueStudents)); } catch (e) {}

    renderMasterGrid(currentStudents);
    updateFeeSummary();
}
`;
  masterHub = masterHub.slice(0, mIdx1) + newRefresh + '\n' + masterHub.slice(mIdx2);
  console.log('Updated refreshMasterData() in master_hub.js.');
}

fs.writeFileSync(masterHubPath, masterHub, 'utf8');

// ─── 5. REMOVE ROGUE CLASSES INSERT FROM sheets-client.js ──────────────────────────────
// Remove the classes table insert from saveAttendance in sheets-client.js
const rogueInsert = `                // Insert into classes table (session record)
                await sb.from('classes').insert({
                    roll_no: rollNo,
                    class_grade: attData.className || 'Class 10',
                    subject: attData.subject || 'General',
                    time: r.lateMinutes ? ('Late ' + r.lateMinutes) : 'On Time',
                    status: isPresent ? 'present' : 'absent',
                    class_date: attData.date || new Date().toISOString().split('T')[0],
                    published: true
                });`;

if (sheetsClient.includes(rogueInsert)) {
  sheetsClient = sheetsClient.replace(rogueInsert, `                // (Attendance is tracked in attendance_records, keeping classes table strictly for timetables)`);
  console.log('Removed rogue classes insert from saveAttendance in sheets-client.js.');
} else {
  console.log('rogueInsert pattern not matched verbatim in sheets-client.js.');
}

fs.writeFileSync(sheetsClientPath, sheetsClient, 'utf8');

console.log('All updates complete.');
