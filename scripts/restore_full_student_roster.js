const fs = require('fs');
const path = require('path');

const processedStudents = require('./processed_students.json');

// Format master roster of 50 students
const masterRoster = processedStudents.map(s => {
  const rawClass = String(s.class_name || '').replace('Class ', '').trim();
  let subs = [];
  if (Array.isArray(s.subjects)) {
    subs = s.subjects;
  } else if (typeof s.subjects === 'string' && s.subjects.trim()) {
    subs = s.subjects.split(',').map(x => x.trim());
  } else {
    subs = ['Physics', 'Chemistry', 'Maths'];
  }

  return {
    id: s.roll_no,
    rollNo: s.roll_no,
    name: s.name,
    class: rawClass,
    school: s.school || 'EduHome Campus',
    phone: s.phone || '',
    joiningDate: s.joining_date_iso || '2026-01-15',
    amount: String(s.monthly_fee || 4000),
    subjects: subs
  };
});

console.log(`Prepared ${masterRoster.length} master students.`);

// 1. Update admin.js
const adminJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

const masterRosterJson = JSON.stringify(masterRoster, null, 4);

const masterRosterDef = `// Master Roster of all 50 students with full subjects, fees, schools, and joining dates
const MASTER_STUDENTS_ROSTER = ${masterRosterJson};

// Helper to get students from LocalStorage with automatic master roster fallback & hydration
function getStudents() {
    let list = [];
    try {
        const stored = localStorage.getItem('students');
        if (stored) list = JSON.parse(stored);
    } catch (e) {}

    // If completely empty, seed directly from master roster
    if (!Array.isArray(list) || list.length === 0) {
        list = JSON.parse(JSON.stringify(MASTER_STUDENTS_ROSTER));
        try { localStorage.setItem('students', JSON.stringify(list)); } catch (e) {}
        return list;
    }

    // Hydrate any missing subjects/amounts from master roster
    const masterMap = new Map(MASTER_STUDENTS_ROSTER.map(m => [m.id || m.rollNo, m]));
    let needsSave = false;

    const merged = list.map(s => {
        const key = s.id || s.rollNo;
        const master = masterMap.get(key);
        if (!master) {
            if (!s.subjects || !Array.isArray(s.subjects) || s.subjects.length === 0) {
                s.subjects = ['General Tuition'];
            }
            return s;
        }

        const copy = { ...s };
        if (!copy.subjects || !Array.isArray(copy.subjects) || copy.subjects.length === 0) {
            copy.subjects = master.subjects;
            needsSave = true;
        }
        if (!copy.amount || copy.amount === '-' || copy.amount === '') {
            copy.amount = master.amount;
            needsSave = true;
        }
        if (!copy.joiningDate) {
            copy.joiningDate = master.joiningDate;
            needsSave = true;
        }
        if (!copy.school || copy.school === 'EduHome Campus') {
            copy.school = master.school;
            needsSave = true;
        }
        return copy;
    });

    // Ensure any students from master that are missing are also added
    const existingIds = new Set(merged.map(s => s.id || s.rollNo));
    MASTER_STUDENTS_ROSTER.forEach(m => {
        const k = m.id || m.rollNo;
        if (!existingIds.has(k)) {
            merged.push(JSON.parse(JSON.stringify(m)));
            needsSave = true;
        }
    });

    if (needsSave) {
        try { localStorage.setItem('students', JSON.stringify(merged)); } catch (e) {}
    }

    return merged;
}`;

// Replace original getStudents block if not yet replaced
const oldGetStudentsStart = '// Helper to get students from LocalStorage';
const oldGetStudentsEnd = 'function saveStudents(students) {';

if (adminJs.includes(oldGetStudentsStart)) {
  const idxStart = adminJs.indexOf(oldGetStudentsStart);
  const idxEnd = adminJs.indexOf(oldGetStudentsEnd);
  if (idxStart !== -1 && idxEnd !== -1) {
    adminJs = adminJs.slice(0, idxStart) + masterRosterDef + '\n\n' + adminJs.slice(idxEnd);
    console.log('Injected MASTER_STUDENTS_ROSTER into admin.js');
  }
}

// FIX THE MISSING BRACE for if (document.getElementById('timetableTableBody')) {
// Check around shareTimetableToApp closing
const brokenClosing = `            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Share Timetable to Mobile App';
            }
        }
    };

// --- ATTENDANCE PAGE ---`;

const fixedClosing = `            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Share Timetable to Mobile App';
            }
        }
    };
}

// --- ATTENDANCE PAGE ---`;

if (adminJs.includes(brokenClosing)) {
  adminJs = adminJs.replace(brokenClosing, fixedClosing);
  console.log('Fixed missing closing brace for timetable block in admin.js');
}

// Ensure renderStudentManagementList handles subjects safely
adminJs = adminJs.replace(
  '<td>${s.subjects.join(\', \')}</td>',
  '<td>${Array.isArray(s.subjects) && s.subjects.length > 0 ? s.subjects.join(\', \') : (typeof s.subjects === \'string\' ? s.subjects : \'General\')}</td>'
);

// Ensure loadFeeTable handles student.subjects safely
adminJs = adminJs.replace(
  'student.subjects.forEach(sub => {',
  '(Array.isArray(student.subjects) && student.subjects.length > 0 ? student.subjects : [\'General\']).forEach(sub => {'
);

fs.writeFileSync(adminJsPath, adminJs, 'utf8');
console.log('Saved admin.js');

// 2. Update sheets-client.js
const sheetsClientPath = 'C:\\Users\\madhu\\code_test\\private\\js\\sheets-client.js';
let sheetsJs = fs.readFileSync(sheetsClientPath, 'utf8');

const oldMapBlock = `                loadedStudents = stuRows.map(r => ({
                    id: String(r.roll_no || r.id),
                    rollNo: String(r.roll_no),
                    name: r.name,
                    class: String(r.class_name || '').replace('Class ', ''),
                    school: r.school || 'EduHome Campus',
                    phone: r.phone || '',
                    joiningDate: r.joining_date || '',
                    amount: '',
                    subjects: []
                }));`;

const newMapBlock = `                const localStudents = (typeof getStudents === 'function') ? getStudents() : (JSON.parse(localStorage.getItem('students')) || []);
                const localMap = new Map((localStudents || []).map(l => [l.id || l.rollNo, l]));

                loadedStudents = stuRows.map(r => {
                    const roll = String(r.roll_no || r.id);
                    const local = localMap.get(roll);
                    return {
                        id: roll,
                        rollNo: roll,
                        name: r.name || (local ? local.name : 'Student'),
                        class: String(r.class_name || (local ? local.class : '10')).replace('Class ', ''),
                        school: r.school || (local ? local.school : 'EduHome Campus'),
                        phone: r.phone || (local ? local.phone : ''),
                        joiningDate: r.joining_date || (local ? local.joiningDate : '2026-01-15'),
                        amount: (local && local.amount) ? String(local.amount) : '4000',
                        subjects: (local && Array.isArray(local.subjects) && local.subjects.length > 0) ? local.subjects : ['General Tuition']
                    };
                });`;

if (sheetsJs.includes(oldMapBlock)) {
  sheetsJs = sheetsJs.replace(oldMapBlock, newMapBlock);
  console.log('Updated sb_loadFromCloud in sheets-client.js');
}

fs.writeFileSync(sheetsClientPath, sheetsJs, 'utf8');
console.log('Saved sheets-client.js');
