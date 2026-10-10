const fs = require('fs');
const html = fs.readFileSync('C:/Users/madhu/code_test/private/master_hub.html', 'utf8');
const lines = html.split('\n');

for (let i = lines.length - 80; i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
