const fs = require('fs');
const content = fs.readFileSync('c:/Users/madhu/code_test/private/js/admin.js', 'utf8');
const lines = content.split('\n');

console.log('=== _syncStudentToCloud in admin.js ===');
lines.slice(1310, 1340).forEach((l, i) => console.log((i + 1311) + ': ' + l));

const sheets = fs.readFileSync('c:/Users/madhu/code_test/private/js/sheets-client.js', 'utf8');
const sheetsLines = sheets.split('\n');
console.log('=== sb_saveStudent in sheets-client.js ===');
sheetsLines.slice(387, 430).forEach((l, i) => console.log((i + 388) + ': ' + l));
