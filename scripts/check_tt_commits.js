const { execSync } = require('child_process');

try {
    const cwd = 'C:/Users/madhu/code_test';
    const log = execSync('git log -n 15 --oneline -- private/timetable.html private/js/live_timetable.js', { cwd, encoding: 'utf8' });
    console.log('Commits touching timetable files:\n' + log);
} catch (e) {
    console.error('Error:', e.message);
}
