const fs = require('fs');
const jsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';
const js = fs.readFileSync(jsPath, 'utf8');
const lines = js.split('\n');

function printRange(start, end) {
    for (let i = start; i <= end && i <= lines.length; i++) {
        console.log(`${i}: ${lines[i - 1]}`);
    }
}

console.log('=== LINES 1515 - 1730 ===');
printRange(1515, 1730);

console.log('=== LINES 3445 - 3550 ===');
printRange(3445, 3550);
