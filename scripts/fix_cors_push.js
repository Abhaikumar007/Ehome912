const fs = require('fs');

const p1 = 'C:\\Users\\madhu\\code_test\\private\\js\\master_hub.js';
const p2 = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace fetch headers with mode: 'no-cors' and text/plain to bypass browser CORS preflight check
  const oldRegex = /fetch\('https:\/\/exp\.host\/--\/api\/v2\/push\/send',\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*['"]Accept['"]:\s*['"]application\/json['"],\s*['"]Content-Type['"]:\s*['"]application\/json['"],?\s*\},/g;

  const newFetchHeader = `fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain',
                },`;

  if (oldRegex.test(content)) {
    content = content.replace(oldRegex, newFetchHeader);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✓ Successfully patched CORS in:', filePath);
  } else {
    console.log('No regex match in:', filePath);
  }
}

if (fs.existsSync(p1)) patchFile(p1);
if (fs.existsSync(p2)) patchFile(p2);
