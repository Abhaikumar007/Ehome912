const fs = require('fs');

const timetableHtml = fs.readFileSync('c:/Users/madhu/code_test/private/timetable.html', 'utf8');
const linesHtml = timetableHtml.split('\n');

linesHtml.slice(187, 300).forEach((l, i) => {
  console.log((i + 188) + ': ' + l);
});
