const fs = require('fs');
const content = fs.readFileSync('C:/Users/madhu/code_test/private/timetable.html', 'utf8');
console.log('timetable.html length:', content.length);
console.log(content);
