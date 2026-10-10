const { execSync } = require('child_process');

try {
    const cwd = 'C:/Users/madhu/code_test';
    const status = execSync('git status --short', { cwd, encoding: 'utf8' });
    console.log('Git status:\n' + status);

    execSync('git add private/master_hub.html private/js/master_hub.js', { cwd, encoding: 'utf8' });
    const diff = execSync('git diff --cached --stat', { cwd, encoding: 'utf8' });
    console.log('Staged diff:\n' + diff);

    const commit = execSync('git commit -m "fix(master-hub): resolve active announcement delete, clear-all, and edit modals"', { cwd, encoding: 'utf8' });
    console.log('Commit:\n' + commit);

    const push = execSync('git push origin main', { cwd, encoding: 'utf8' });
    console.log('Push:\n' + push);
} catch (e) {
    console.error('Git error:', e.stdout || e.message);
}
