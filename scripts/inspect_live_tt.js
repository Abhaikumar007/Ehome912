const fs = require('fs');

const liveTt = fs.readFileSync('c:/Users/madhu/code_test/private/js/live_timetable.js', 'utf8');
const lines = liveTt.split('\n');

console.log('=== LINES 670 - 750 (Edit Modal Form) ===');
lines.slice(669, 750).forEach((l, i) => console.log((i + 670) + ': ' + l));

console.log('=== LINES 850 - 900 (Open Edit Modal) ===');
lines.slice(849, 900).forEach((l, i) => console.log((i + 850) + ': ' + l));

console.log('=== LINES 950 - 1030 (Save Live Class Edit) ===');
lines.slice(949, 1030).forEach((l, i) => console.log((i + 950) + ': ' + l));
