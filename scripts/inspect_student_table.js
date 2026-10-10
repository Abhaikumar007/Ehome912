const fs = require('fs');

const addStudentHtml = fs.readFileSync('c:/Users/madhu/code_test/private/add_student.html', 'utf8');
const lines = addStudentHtml.split('\n');

console.log('=== TABLE HEADERS IN ADD_STUDENT.HTML ===');
lines.slice(120, 160).forEach((l, i) => console.log((i + 121) + ': ' + l));
