const fs = require('fs');
const html = fs.readFileSync('C:/Users/madhu/code_test/private/master_hub.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('<script')) {
        console.log(`${idx + 1}: ${l.trim()}`);
    }
});
