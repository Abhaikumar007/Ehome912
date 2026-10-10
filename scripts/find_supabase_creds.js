const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');

const mUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
const mKey = js.match(/sb_publishable_[a-zA-Z0-9_-]+|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/);
console.log('From JS URL:', mUrl ? mUrl[0] : null);
console.log('From JS Key:', mKey ? mKey[0].slice(0, 20) + '...' : null);

if (!mUrl) {
    // Check config.js or other files in code_test
    const files = fs.readdirSync('C:/Users/madhu/code_test/private/js');
    console.log('JS files:', files);
}
