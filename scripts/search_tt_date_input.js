const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/admin.js', 'utf8');
const lines = js.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('timetableDate')) {
        console.log(`${idx + 1}: ${l.trim()}`);
    }
});
