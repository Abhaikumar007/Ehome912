const fs = require('fs');
const html = fs.readFileSync('C:/Users/madhu/code_test/private/master_hub.html', 'utf8');

const modalIdx = html.indexOf('id="editAnnouncementModal"');
// Look backwards from modalIdx to find parent closing or opening tags
const before = html.slice(modalIdx - 500, modalIdx);
console.log('Context before editAnnouncementModal:\n', before);
