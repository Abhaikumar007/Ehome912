const { execSync } = require('child_process');

try {
    const cwd = 'C:/Users/madhu/code_test';
    const log = execSync('git log -n 5 --oneline private/js/live_timetable.js', { cwd, encoding: 'utf8' });
    console.log('Recent commits touching live_timetable.js:\n' + log);

    const diff = execSync('git diff HEAD~5 HEAD private/js/live_timetable.js', { cwd, encoding: 'utf8' });
    console.log('Diff in last 5 commits (first 100 lines):\n' + diff.split('\n').slice(0, 100).join('\n'));
} catch (e) {
    console.error('Error:', e.message);
}
