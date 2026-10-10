const fs = require('fs');

const adminPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');
console.log(lines.slice(4510, 4600).join('\n'));
