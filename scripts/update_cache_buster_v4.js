const fs = require('fs');
const p = 'C:\\Users\\madhu\\code_test\\private\\master_hub.html';
let c = fs.readFileSync(p, 'utf8');
const now = Date.now();
c = c.replace(/master_hub\.js\?v=[^"']*/g, 'master_hub.js?v=' + now);
c = c.replace(/admin\.js\?v=[^"']*/g, 'admin.js?v=' + now);
fs.writeFileSync(p, c, 'utf8');
console.log('✓ Updated master_hub.html cache busters to:', now);
