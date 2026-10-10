const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\madhu\\code_test\\private\\master_hub.html', 'utf8');

const regex = /<script[^>]*src=["']([^"']*)["']/g;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log(m[1]);
}
