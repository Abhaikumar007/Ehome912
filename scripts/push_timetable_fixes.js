const { execSync } = require('child_process');

try {
    const cwd = 'C:/Users/madhu/code_test';
    const status = execSync('git status --short', { cwd, encoding: 'utf8' });
    console.log('Git status:\n' + status);

    execSync('git add private/js/admin.js private/js/live_timetable.js private/timetable.html private/master_hub.html', { cwd, encoding: 'utf8' });
    const diff = execSync('git diff --cached --stat', { cwd, encoding: 'utf8' });
    console.log('Staged diff:\n' + diff);

    const commit = execSync('git commit -m "fix(timetable): fix admin.js syntax error, restore date setting and create session modal in Live Mobile App Timetable Manager"', { cwd, encoding: 'utf8' });
    console.log('Commit:\n' + commit);

    const push = execSync('git push origin main', { cwd, encoding: 'utf8' });
    console.log('Push:\n' + push);
} catch (e) {
    console.error('Git error:', e.stdout || e.message);
}
