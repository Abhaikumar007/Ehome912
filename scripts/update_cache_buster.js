const fs = require('fs');
const p = 'C:/Users/madhu/code_test/private/master_hub.html';
if (fs.existsSync(p)) {
  let html = fs.readFileSync(p, 'utf8');
  html = html.replace(/js\/master_hub\.js\?v=[^"]+/, 'js/master_hub.js?v=20261004_test_approval_fix');
  fs.writeFileSync(p, html, 'utf8');
  console.log('✓ Updated cache-busting version in master_hub.html');
}
