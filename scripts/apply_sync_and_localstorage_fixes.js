const fs = require('fs');

const adminPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
const sheetsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\sheets-client.js';

let adminContent = fs.readFileSync(adminPath, 'utf8');
let sheetsContent = fs.readFileSync(sheetsPath, 'utf8');

// 1. In admin.js: add immediate renderStudentManagementList right after saveStudents(students);
const targetAdmin = 'saveStudents(students);';
const idxAdmin = adminContent.indexOf('saveStudents(students);\n');
if (idxAdmin !== -1 && !adminContent.includes('saveStudents(students);\n        if (typeof renderStudentManagementList')) {
    adminContent = adminContent.replace('saveStudents(students);\n', 'saveStudents(students);\n        if (typeof renderStudentManagementList === \'function\') renderStudentManagementList();\n');
    fs.writeFileSync(adminPath, adminContent, 'utf8');
    console.log('[admin.js] Successfully added immediate renderStudentManagementList() after saveStudents(students)!');
} else if (adminContent.includes('if (typeof renderStudentManagementList === \'function\') renderStudentManagementList();')) {
    console.log('[admin.js] renderStudentManagementList() already present after saveStudents(students).');
} else {
    // Replace by searching line 1611
    adminContent = adminContent.replace('saveStudents(students);', 'saveStudents(students);\n        if (typeof renderStudentManagementList === \'function\') renderStudentManagementList();');
    fs.writeFileSync(adminPath, adminContent, 'utf8');
    console.log('[admin.js] Successfully added immediate renderStudentManagementList() after saveStudents(students) fallback!');
}

// 2. In sheets-client.js: add lockstep localStorage update after Supabase upsert
const targetSheetsMarker = 'if (stuError) {\n                console.warn(\'[DualSync] Supabase students error:\', stuError.message);\n            } else {';
const oldSheetsBlock = `            if (stuError) {
                console.warn('[DualSync] Supabase students error:', stuError.message);
            } else {
                console.log('[DualSync] Student upserted in Supabase `;

const sheetsSplit = sheetsContent.split(/console\.log\('\[DualSync\] Student upserted in Supabase[^']*', rollNo\);/);
if (sheetsSplit.length === 2) {
    const lockstepCode = `console.log('[DualSync] Student upserted in Supabase:', rollNo);
                // Keep local storage in 100% lockstep with saved student
                try {
                    const storedList = JSON.parse(localStorage.getItem('students') || '[]');
                    const normRollNo = String(rollNo).toUpperCase().trim();
                    const idx = storedList.findIndex(s => {
                        const sRoll = String(s.rollNo || s.roll_no || s.id || '').toUpperCase().trim();
                        return sRoll === normRollNo;
                    });
                    const updatedObj = {
                        ...(idx >= 0 ? storedList[idx] : {}),
                        id: rollNo,
                        rollNo: rollNo,
                        name: stuPayload.name,
                        class: rawClass.replace('Class ', '').trim(),
                        syllabus: student.syllabus || (student.school === 'CBSE' || /cbse/i.test(stuPayload.batch) ? 'CBSE' : 'State Syllabus'),
                        batch: stuPayload.batch,
                        school: stuPayload.school,
                        phone: stuPayload.phone,
                        pin: stuPayload.pin || (existingStu && existingStu.pin) || (student.pin || ''),
                        joiningDate: stuPayload.joining_date,
                        amount: String(student.amount != null ? student.amount : (idx >= 0 ? storedList[idx].amount : '')),
                        subjects: subjectsList
                    };
                    if (idx >= 0) {
                        storedList[idx] = updatedObj;
                    } else {
                        storedList.push(updatedObj);
                    }
                    localStorage.setItem('students', JSON.stringify(storedList));
                } catch (lsErr) {
                    console.warn('[sb_saveStudent] LocalStorage update warning:', lsErr);
                }`;
    sheetsContent = sheetsSplit[0] + lockstepCode + sheetsSplit[1];
    fs.writeFileSync(sheetsPath, sheetsContent, 'utf8');
    console.log('[sheets-client.js] Successfully inserted local storage lockstep code in sb_saveStudent!');
} else {
    console.warn('[sheets-client.js] WARNING: Could not find split point in sheets-client.js!');
}

console.log('Script execution completed.');
