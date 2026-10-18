const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/madhu/code_test/private';
const V = '20261018_v2';

// 1. add_student.html
const addStuPath = path.join(dir, 'add_student.html');
let addStu = fs.readFileSync(addStuPath, 'utf8');
addStu = addStu.replace(
  /<script src="js\/\.js\?v=\d+"><\/script>\s*<script src="js\/\.js\?v=\d+"><\/script>/,
  `<script src="js/sheets-client.js?v=${V}"></script>\n    <script src="js/admin.js?v=${V}"></script>`
);
fs.writeFileSync(addStuPath, addStu, 'utf8');
console.log('Restored add_student.html');

// 2. attendance.html
const attPath = path.join(dir, 'attendance.html');
let att = fs.readFileSync(attPath, 'utf8');
att = att.replace(
  /<script src="js\/\.js\?v=\d+"><\/script>\s*<script src="js\/\.js\?v=\d+"><\/script>/,
  `<script src="js/sheets-client.js?v=${V}"></script>\n    <script src="js/admin.js?v=${V}"></script>`
);
fs.writeFileSync(attPath, att, 'utf8');
console.log('Restored attendance.html');

// 3. fees.html
const feesPath = path.join(dir, 'fees.html');
let fees = fs.readFileSync(feesPath, 'utf8');
fees = fees.replace(
  /<script src="js\/\.js\?v=\d+"><\/script>\s*<script src="js\/\.js\?v=\d+"><\/script>/,
  `<script src="js/sheets-client.js?v=${V}"></script>\n    <script src="js/admin.js?v=${V}"></script>`
);
fs.writeFileSync(feesPath, fees, 'utf8');
console.log('Restored fees.html');

// 4. master_hub.html
const mhPath = path.join(dir, 'master_hub.html');
let mh = fs.readFileSync(mhPath, 'utf8');
mh = mh.replace(
  /<script src="js\/\.js\?v=\d+"><\/script>\s*<script src="js\/\.js\?v=\d+"><\/script>\s*<script src="js\/\.js\?v=\d+"><\/script>\s*<script src="js\/\.js\?v=\d+"><\/script>/,
  `<script src="js/sheets-client.js?v=${V}"></script>\n    <script src="js/admin.js?v=${V}"></script>\n    <script src="js/master_hub.js?v=${V}"></script>\n    <script src="js/live_timetable.js?v=${V}"></script>`
);
fs.writeFileSync(mhPath, mh, 'utf8');
console.log('Restored master_hub.html');

// 5. timetable.html
const ttPath = path.join(dir, 'timetable.html');
let tt = fs.readFileSync(ttPath, 'utf8');
tt = tt.replace(
  /<script src="js\/\.js\?v=\d+"><\/script>\s*<script src="js\/\.js\?v=\d+"><\/script>\s*<script src="js\/\.js\?v=\d+"><\/script>/,
  `<script src="js/sheets-client.js?v=${V}"></script>\n    <script src="js/admin.js?v=${V}"></script>\n    <script src="js/live_timetable.js?v=${V}"></script>`
);
fs.writeFileSync(ttPath, tt, 'utf8');
console.log('Restored timetable.html');
