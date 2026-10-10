const fs = require('fs');

const ttPath = 'C:/Users/madhu/code_test/private/timetable.html';
let tt = fs.readFileSync(ttPath, 'utf8');
tt = tt.replace(/live_timetable\.js\?v=[^"]+/, 'live_timetable.js?v=20261004_v3');
tt = tt.replace(/admin\.js\?v=[^"]+/, 'admin.js?v=20261004_v3');
fs.writeFileSync(ttPath, tt, 'utf8');

const mhPath = 'C:/Users/madhu/code_test/private/master_hub.html';
let mh = fs.readFileSync(mhPath, 'utf8');
mh = mh.replace(/live_timetable\.js\?v=[^"]+/, 'live_timetable.js?v=20261004_v3');
fs.writeFileSync(mhPath, mh, 'utf8');

console.log('Successfully updated cache-busters to v20261004_v3!');
