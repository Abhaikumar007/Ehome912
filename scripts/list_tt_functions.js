const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/live_timetable.js', 'utf8');
const lines = js.split('\n');

console.log('=== WINDOW EXPORTS IN live_timetable.js ===');
lines.forEach((l, idx) => {
    if (l.includes('window.') && l.includes('=')) {
        console.log(`${idx + 1}: ${l.trim().slice(0, 80)}`);
    }
});

console.log('\n=== BUTTON ONCLICKS IN live_timetable.js ===');
lines.forEach((l, idx) => {
    if (l.includes('onclick=')) {
        const m = l.match(/onclick="([^"]+)"/);
        if (m) {
            console.log(`${idx + 1}: ${m[1]}`);
        }
    }
});
