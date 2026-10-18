const fs = require('fs');

const sheetsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\sheets-client.js';
const adminPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';

let sheets = fs.readFileSync(sheetsPath, 'utf8');
let admin = fs.readFileSync(adminPath, 'utf8');

// 1. In sheets-client.js: don't put enrolled subjects list into today_subjects of attendance_records
const oldAttUpsert = `            // C. Attendance record with enrolled subjects
            const { error: attError } = await sb.from('attendance_records').upsert({
                roll_no: rollNo,
                overall: 0,
                attended: 0,
                total: 0,
                today_subjects: subjectsList,
                history: []
            }, { onConflict: 'roll_no' });`;

const newAttUpsert = `            // C. Blank attendance record (if not already existing)
            const { error: attError } = await sb.from('attendance_records').upsert({
                roll_no: rollNo,
                overall: 0,
                attended: 0,
                total: 0,
                today_subjects: [],
                history: []
            }, { onConflict: 'roll_no', ignoreDuplicates: true });`;

if (sheets.includes(oldAttUpsert)) {
    sheets = sheets.replace(oldAttUpsert, newAttUpsert);
    console.log('[sheets-client.js] Successfully fixed attendance_records upsert to default to [] and ignoreDuplicates.');
} else {
    console.warn('[sheets-client.js] WARNING: oldAttUpsert not found, attempting regex match...');
    const attRegex = /\/\/\s*C\.\s*Attendance record with enrolled subjects[\s\S]*?today_subjects:\s*subjectsList,[\s\S]*?history:\s*\[\]\s*\}\s*,\s*\{\s*onConflict:\s*'roll_no'\s*\}\);/;
    if (attRegex.test(sheets)) {
        sheets = sheets.replace(attRegex, `// C. Blank attendance record (if not already existing)\n            const { error: attError } = await sb.from('attendance_records').upsert({\n                roll_no: rollNo,\n                overall: 0,\n                attended: 0,\n                total: 0,\n                today_subjects: [],\n                history: []\n            }, { onConflict: 'roll_no', ignoreDuplicates: true });`);
        console.log('[sheets-client.js] Successfully fixed attendance_records upsert via regex.');
    } else {
        console.warn('[sheets-client.js] Could not find attendance upsert in sheets-client.js!');
    }
}

// 2. In admin.js: change export SQL default from 90, 45, 50 to 0, 0, 0
const oldExportAtt = `"INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history) " +\n                "VALUES ('" + s.roll_no + "', 90, 45, 50, '[]'::jsonb, '[]'::jsonb) "`;
const newExportAtt = `"INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history) " +\n                "VALUES ('" + s.roll_no + "', 0, 0, 0, '[]'::jsonb, '[]'::jsonb) "`;

if (admin.includes(oldExportAtt)) {
    admin = admin.replace(oldExportAtt, newExportAtt);
    console.log('[admin.js] Successfully updated exportSupabaseSQL attendance defaults to 0, 0, 0.');
} else {
    console.warn('[admin.js] oldExportAtt not found!');
}

fs.writeFileSync(sheetsPath, sheets, 'utf8');
fs.writeFileSync(adminPath, admin, 'utf8');
console.log('Done updating code_test files.');
