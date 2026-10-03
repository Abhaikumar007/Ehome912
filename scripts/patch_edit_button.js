const fs = require('fs');
const p = 'C:/Users/madhu/code_test/private/js/master_hub.js';

if (fs.existsSync(p)) {
  let code = fs.readFileSync(p, 'utf8');

  const oldButtonSnippet = `                            + '<div class="broadcast-actions-area">'
                            + '<button type="button" class="btn btn-sm btn-success px-3 py-2 font-weight-bold shadow-sm" onclick="window.requestApproveAnnouncement(\\'' + a.id + '\\', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-check-circle mr-1"></i> Approve & Publish'
                            + '</button>'`;

  const newButtonSnippet = `                            + '<div class="broadcast-actions-area" style="gap: 8px; flex-wrap: wrap;">'
                            + '<button type="button" class="btn btn-sm btn-primary px-3 py-2 font-weight-bold shadow-sm" onclick="window.openEditApprovalModal(\\'' + a.id + '\\', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-edit mr-1"></i> Edit & Approve'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-success px-3 py-2 font-weight-bold shadow-sm" onclick="window.requestApproveAnnouncement(\\'' + a.id + '\\', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-check-circle mr-1"></i> Quick Approve'
                            + '</button>'`;

  if (code.includes(oldButtonSnippet)) {
    code = code.replace(oldButtonSnippet, newButtonSnippet);
    fs.writeFileSync(p, code, 'utf8');
    console.log('✓ Successfully patched master_hub.js with Edit & Approve button');
  } else {
    console.log('Old button snippet not found, checking if already patched...');
    if (code.includes('window.openEditApprovalModal')) {
      console.log('✓ Already has openEditApprovalModal in master_hub.js');
    } else {
      console.warn('Could not find injection point');
    }
  }
} else {
  console.log('master_hub.js not found');
}
