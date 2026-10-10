const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/live_timetable.js', 'utf8');
const lines = js.split('\n');

for (let i = 1; i <= 70; i++) {
    console.log(`${i}: ${lines[i - 1]}`);
}
