const { execSync } = require('child_process');
const cwd = 'C:/Users/madhu/code_test';
try {
  execSync('git add private/js/admin.js private/js/live_timetable.js private/js/master_hub.js', { cwd });
  const commit = execSync('git commit -m "feat: target timetable push notifications by student class and syllabus"', { cwd, encoding: 'utf8' });
  console.log(commit);
  const push = execSync('git push', { cwd, encoding: 'utf8' });
  console.log(push);
} catch (e) {
  console.log(e.message);
}
