const fs = require('fs');

const ttHtml = fs.readFileSync('C:/Users/madhu/code_test/private/timetable.html', 'utf8');
const liveTtJs = fs.readFileSync('C:/Users/madhu/code_test/private/js/live_timetable.js', 'utf8');
const mhHtml = fs.readFileSync('C:/Users/madhu/code_test/private/master_hub.html', 'utf8');

console.log('--- timetable.html matches ---');
ttHtml.split('\n').forEach((l, idx) => {
    if (l.toLowerCase().includes('mobile') || l.toLowerCase().includes('date') || l.toLowerCase().includes('app')) {
        console.log(`${idx+1}: ${l.trim().slice(0, 100)}`);
    }
});

console.log('--- live_timetable.js matches for mobile / date ---');
liveTtJs.split('\n').forEach((l, idx) => {
    if (l.toLowerCase().includes('mobile') || l.toLowerCase().includes('set date') || l.toLowerCase().includes('date') && l.toLowerCase().includes('picker') || l.toLowerCase().includes('change') && l.toLowerCase().includes('date')) {
        console.log(`${idx+1}: ${l.trim().slice(0, 100)}`);
    }
});
