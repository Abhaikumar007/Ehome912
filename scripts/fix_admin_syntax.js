const fs = require('fs');
const filePath = 'C:/Users/madhu/code_test/private/js/admin.js';
let js = fs.readFileSync(filePath, 'utf8');

// Match "pin": "..." without a trailing comma before "subjects"
js = js.replace(/("pin":\s*"[^"]+")(?!\s*,)(\s*"subjects":)/g, '$1,$2');

fs.writeFileSync(filePath, js, 'utf8');
console.log('Successfully added missing commas after "pin" in admin.js');
