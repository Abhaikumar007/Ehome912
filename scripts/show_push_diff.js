const { execSync } = require('child_process');

try {
    const cwd = 'C:/Users/madhu/code_test';
    const diff = execSync('git diff ffbb9c8~1 ffbb9c8 private/js/admin.js', { cwd, encoding: 'utf8' });
    console.log(diff);
} catch (e) {
    console.error('Error:', e.message);
}
