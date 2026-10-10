const fs = require('fs');

const masterHubJsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';

if (!fs.existsSync(masterHubJsPath)) {
  console.error('master_hub.js not found at:', masterHubJsPath);
  process.exit(1);
}

let code = fs.readFileSync(masterHubJsPath, 'utf8');

// Replace everything from start of file up to `function escapeHtml`
const escapeHtmlIdx = code.indexOf('function escapeHtml(str)');
if (escapeHtmlIdx === -1) {
  console.error('Could not find function escapeHtml in master_hub.js');
  process.exit(1);
}

const newCleanFn = `function cleanApprovedTitle(rawTitle) {
    if (!rawTitle) return 'Community Announcement';
    let t = String(rawTitle);

    // Extract class if formatted as [Class X] or [PENDING APPROVAL - Class X]
    let classTag = '';
    const classMatch = t.match(/\\[(Class\\s*\\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\\]/i)
                    || t.match(/\\[PENDING APPROVAL\\s*-\\s*(Class\\s*\\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\\]/i);
    if (classMatch) {
        classTag = classMatch[1];
    }

    // Strip all pending approval tags anywhere in the title
    t = t.replace(/\\[PENDING APPROVAL[^\\]]*\\]/gi, '')
         .replace(/\\[Test Alert\\]/gi, '')
         .replace(/\\[Exam Alert\\]/gi, '');

    // Strip class tag from title body so we can format cleanly
    if (classTag) {
        const escapedClass = classTag.replace(/[-[\\]{}()*+?.,\\\\^$|#\\s]/g, '\\\\$&');
        t = t.replace(new RegExp('\\\\[' + escapedClass + '\\\\]', 'gi'), '');
    }

    // Clean whitespace
    t = t.replace(/\\s{2,}/g, ' ').trim();
    if (!t) t = 'Test Paper';

    // Prefix class tag if present and not "All Classes"
    if (classTag && !classTag.toLowerCase().includes('all classes')) {
        return '[' + classTag + '] ' + t;
    }
    return t;
}

`;

code = newCleanFn + code.substring(escapeHtmlIdx);
console.log('✓ Successfully fixed cleanApprovedTitle at start of file');

fs.writeFileSync(masterHubJsPath, code, 'utf8');
