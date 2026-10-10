const fs = require('fs');
const html = fs.readFileSync('C:/Users/madhu/code_test/private/master_hub.html', 'utf8');
const lines = html.split('\n');

for (let i = 1490; i <= 1520; i++) {
    if (i <= lines.length) {
        console.log(`${i}: ${lines[i - 1]}`);
    }
}
