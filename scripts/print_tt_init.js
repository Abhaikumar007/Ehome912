const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/admin.js', 'utf8');
const lines = js.split('\n');

for (let i = 2340; i <= 2420; i++) {
    console.log(`${i}: ${lines[i - 1]}`);
}
