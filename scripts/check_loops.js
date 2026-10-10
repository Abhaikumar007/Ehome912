const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');

// Check for while loops, setInterval, infinite recursion, prompt, etc.
const lines = js.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('while (') || line.includes('while(') || line.includes('do {') || line.includes('setInterval')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
