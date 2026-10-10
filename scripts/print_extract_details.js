const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const lines = js.split('\n');

for (let i = 1275; i <= 1350; i++) {
    console.log(`${i}: ${lines[i - 1]}`);
}
