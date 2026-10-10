const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/admin.js', 'utf8');
const lines = js.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('shareTimetableToApp') || l.includes('addTimetableEntry') || l.includes('timetableDate') || l.includes('timetableSubject') || l.includes('timetableTableBody')) {
        console.log(`${idx + 1}: ${l.trim().slice(0, 100)}`);
    }
});
