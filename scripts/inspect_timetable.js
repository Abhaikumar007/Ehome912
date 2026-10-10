const fs = require('fs');

const timetableHtml = fs.readFileSync('c:/Users/madhu/code_test/private/timetable.html', 'utf8');
const linesHtml = timetableHtml.split('\n');
console.log('=== TIMETABLE.HTML BOARD / SYLLABUS ===');
linesHtml.forEach((l, i) => {
  if (l.toLowerCase().includes('board') || l.toLowerCase().includes('syllabus') || l.toLowerCase().includes('cbse') || l.toLowerCase().includes('state')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});

const liveTt = fs.readFileSync('c:/Users/madhu/code_test/private/js/live_timetable.js', 'utf8');
const linesLive = liveTt.split('\n');
console.log('=== LIVE_TIMETABLE.JS BOARD / SYLLABUS / MODAL ===');
linesLive.forEach((l, i) => {
  if (l.toLowerCase().includes('board') || l.toLowerCase().includes('syllabus') || l.toLowerCase().includes('modal') || l.toLowerCase().includes('editclass') || l.toLowerCase().includes('saveclass')) {
    console.log((i + 1) + ': ' + l.trim().substring(0, 110));
  }
});
