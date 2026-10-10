const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/live_timetable.js', 'utf8');
const lines = js.split('\n');

console.log('Total lines in live_timetable.js:', lines.length);

// Search for functions, date picker, active filters
lines.forEach((l, idx) => {
    if (l.includes('DatePicker') || l.includes('DateFilter') || l.includes('_active') || l.includes('setDate') || l.includes('changeDate') || l.includes('initLiveAppTimetable') || l.includes('class_date') || l.includes('renderLiveTimetable')) {
        if (l.trim().startsWith('function') || l.trim().startsWith('window.') || l.includes('addEventListener') || l.includes('onclick') || l.includes('const') || l.includes('let ')) {
            console.log(`${idx + 1}: ${l.trim().slice(0, 100)}`);
        }
    }
});
