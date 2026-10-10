const fs = require('fs');

const adminPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
if (fs.existsSync(adminPath)) {
    const text = fs.readFileSync(adminPath, 'utf8');
    const hasBroadcast = text.includes('handlePublishAnnouncement') || text.includes('announcements');
    console.log('admin.js exists, hasBroadcast/announcements:', hasBroadcast);
} else {
    console.log('admin.js not found');
}
