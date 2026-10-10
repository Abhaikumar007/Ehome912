const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\madhu\\code_test\\private\\master_hub.html', 'utf8');

const idx = html.indexOf('id="tab-fees"');
console.log(html.slice(idx + 4000, idx + 6500));
