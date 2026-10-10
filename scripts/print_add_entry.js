const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/admin.js', 'utf8');
const lines = js.split('\n');

for (let i = 2625; i <= 2665; i++) {
    console.log(`${i}: ${lines[i - 1]}`);
}
