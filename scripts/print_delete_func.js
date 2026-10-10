const fs = require('fs');
const jsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';
const js = fs.readFileSync(jsPath, 'utf8');
const lines = js.split('\n');

for (let i = 1520; i <= 1665; i++) {
    console.log(`${i}: ${lines[i - 1]}`);
}
