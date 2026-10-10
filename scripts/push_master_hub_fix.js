const { execSync } = require('child_process');
const cwd = 'C:/Users/madhu/code_test';
execSync('git add private/js/admin.js private/js/master_hub.js private/master_hub.html', { cwd });
const commit = execSync('git commit -m "fix: resolve global variable collision and guarantee immediate Master Hub table loading"', { cwd, encoding: 'utf8' });
console.log(commit);
const push = execSync('git push', { cwd, encoding: 'utf8' });
console.log(push);
