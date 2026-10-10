const fs = require('fs');
const path = require('path');

const codeTestDir = 'C:/Users/madhu/code_test/private';
const htmlPath = path.join(codeTestDir, 'master_hub.html');
const jsPath = path.join(codeTestDir, 'js/master_hub.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

console.log('HTML size:', html.length, 'JS size:', js.length);

// Search for announcement list containers in HTML
const htmlMatches = [];
const lines = html.split('\n');
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('announcement') || line.toLowerCase().includes('alert') || line.toLowerCase().includes('clear all') || line.toLowerCase().includes('broadcast')) {
        if (line.includes('id=') || line.includes('onclick=') || line.includes('class=')) {
            htmlMatches.push(`${idx + 1}: ${line.trim()}`);
        }
    }
});

console.log('--- Relevant HTML Lines (sample of ' + htmlMatches.length + ') ---');
console.log(htmlMatches.slice(0, 30).join('\n'));

// Search for delete, clear, edit functions in JS
const jsFuncs = [];
const jsLines = js.split('\n');
jsLines.forEach((line, idx) => {
    if (line.includes('DeleteAnnouncement') || line.includes('deleteAnnouncement') || line.includes('clearAll') || line.includes('ClearAll') || line.includes('EditAnnouncement') || line.includes('editAnnouncement') || line.includes('loadActiveBroadcasts')) {
        jsFuncs.push(`${idx + 1}: ${line.trim()}`);
    }
});
console.log('--- Relevant JS Lines ---');
console.log(jsFuncs.join('\n'));
