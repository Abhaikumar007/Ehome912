const fs = require('fs');

const adminJs = fs.readFileSync('c:/Users/madhu/code_test/private/js/admin.js', 'utf8');
const lines = adminJs.split('\n');

console.log('=== LINES 2680 - 2730 ===');
lines.slice(2679, 2730).forEach((l, i) => console.log((i + 2680) + ': ' + l));
