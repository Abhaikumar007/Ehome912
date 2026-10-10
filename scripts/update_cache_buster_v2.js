const fs = require('fs');

let addStudent = fs.readFileSync('c:/Users/madhu/code_test/private/add_student.html', 'utf8');
addStudent = addStudent.replace('src="js/admin.js"', 'src="js/admin.js?v=20261004_v2"');
addStudent = addStudent.replace('src="js/sheets-client.js"', 'src="js/sheets-client.js?v=20261004_v2"');
fs.writeFileSync('c:/Users/madhu/code_test/private/add_student.html', addStudent, 'utf8');

let tt = fs.readFileSync('c:/Users/madhu/code_test/private/timetable.html', 'utf8');
tt = tt.replace(/js\/admin\.js\?v=[^"]+/g, 'js/admin.js?v=20261004_v2');
tt = tt.replace(/js\/live_timetable\.js\?v=[^"]+/g, 'js/live_timetable.js?v=20261004_v2');
fs.writeFileSync('c:/Users/madhu/code_test/private/timetable.html', tt, 'utf8');

console.log('✓ Cache busters updated in add_student.html and timetable.html');
