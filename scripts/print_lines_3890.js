const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const lines = js.split('\n');

for (let i = 3890; i <= 4125; i++) {
    if (i <= lines.length) {
        console.log(`${i}: ${lines[i - 1]}`);
    }
}
