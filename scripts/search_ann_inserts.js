const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const lines = js.split('\n');

lines.forEach((l, idx) => {
    if (l.includes("from('announcements').insert") || l.includes('from("announcements").insert')) {
        console.log(`${idx + 1}: ${l.trim()}`);
    }
});
