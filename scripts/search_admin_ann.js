const fs = require('fs');
const p = 'C:/Users/madhu/code_test/private/js/admin.js';
const content = fs.readFileSync(p, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
    if (l.includes("from('announcements')") || l.includes('from("announcements")')) {
        console.log(`admin.js:${idx + 1}: ${l.trim().slice(0, 100)}`);
    }
});
