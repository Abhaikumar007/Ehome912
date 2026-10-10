const fs = require('fs');
const html = fs.readFileSync('C:/Users/madhu/code_test/private/master_hub.html', 'utf8');

const modalHtml = html.slice(html.indexOf('id="editAnnouncementModal"'), html.indexOf('id="rejectAnnouncementConfirmModal"'));
const lines = modalHtml.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('required')) {
        console.log(`Line ${idx + 1}: ${l.trim()}`);
    }
});
