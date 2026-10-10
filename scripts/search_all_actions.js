const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/madhu/code_test/private';
const files = ['master_hub.html', 'js/master_hub.js', 'js/admin.js'];

files.forEach(f => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
        if (l.includes('requestDeleteAnnouncement') || l.includes('requestClearAll') || l.includes('openEditAnnouncementModal')) {
            console.log(`${f}:${idx + 1}: ${l.trim().slice(0, 100)}`);
        }
    });
});
