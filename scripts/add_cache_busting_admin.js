const fs = require('fs');

['fees.html', 'master_hub.html'].forEach(file => {
  const p = 'C:/Users/madhu/code_test/private/' + file;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/src="js\/admin\.js[^"]*"/g, 'src="js/admin.js?v=20260921_fee"');
  fs.writeFileSync(p, c, 'utf8');
});
console.log('Cache-busting successfully added!');
