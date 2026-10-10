const fs = require('fs');
const path = require('path');

const attendancePath = path.join(__dirname, '../app/(teacher)/attendance.tsx');
let att = fs.readFileSync(attendancePath, 'utf8');

const oldTitle = 'No students enrolled in {selectedSubject}';
const newTitle = "{activeSessionSyllabus !== 'Both' ? `No ${activeSessionSyllabus} students enrolled in ${selectedSubject || 'this subject'}` : `No students enrolled in ${selectedSubject || 'this subject'}`}";

const oldSub = 'Switch subject filter to "All Subjects" or select another class.';
const newSub = "{activeSessionSyllabus !== 'Both' ? `No students in ${currentClass.label} are enrolled under ${activeSessionSyllabus}. Switch session or select another class.` : 'Switch subject filter to \"All Subjects\" or select another class.'}";

if (att.includes(oldTitle)) {
  att = att.replace(oldTitle, newTitle);
  console.log('✓ Replaced empty state title');
}

if (att.includes(oldSub)) {
  att = att.replace(oldSub, newSub);
  console.log('✓ Replaced empty state sub');
}

fs.writeFileSync(attendancePath, att, 'utf8');
console.log('Done.');
