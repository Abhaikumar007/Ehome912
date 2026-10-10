const fs = require('fs');
const configContent = fs.readFileSync('c:/Users/madhu/code_test/private/js/config.js', 'utf8');
console.log(configContent.slice(0, 500));
