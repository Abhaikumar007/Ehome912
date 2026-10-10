const { execSync } = require('child_process');

try {
    const cwd = 'C:/Users/madhu/code_test';
    const diff = execSync('git diff HEAD~5 HEAD private/js/live_timetable.js', { cwd, encoding: 'utf8' });
    console.log('Full diff length:', diff.length);
    console.log(diff);
} catch (e) {
    console.error('Error:', e.message);
}
