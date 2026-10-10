const fs = require('fs');
const html = fs.readFileSync('C:/Users/madhu/code_test/private/master_hub.html', 'utf8');
const lines = html.split('\n');

for (let i = 1168; i <= 1235; i++) {
    console.log(`${i}: ${lines[i - 1]}`);
}
