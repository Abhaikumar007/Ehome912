const { execSync } = require('child_process');

try {
    const cwd = 'C:/Users/madhu/code_test';
    const show = execSync('git show 135c68e --stat', { cwd, encoding: 'utf8' });
    console.log('135c68e stat:\n' + show);
} catch (e) {
    console.error('Error:', e.message);
}
