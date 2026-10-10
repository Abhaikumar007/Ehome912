const fs = require('fs');
const path = require('path');

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory() && ent.name !== 'node_modules' && ent.name !== '.git') {
            scanDir(full);
        } else if (ent.isFile() && (ent.name.endsWith('.js') || ent.name.endsWith('.ts') || ent.name.endsWith('.tsx') || ent.name.endsWith('.html'))) {
            const content = fs.readFileSync(full, 'utf8');
            if (content.includes('fees_records')) {
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                    if (line.includes('fees_records') || line.includes('current_due') || line.includes('status')) {
                        if (line.includes('fees_records') || line.includes('select(') || line.includes('status')) {
                            // Check context around fees_records
                            const context = lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 4)).join(' ');
                            if (context.includes('fees_records') && context.includes('status')) {
                                console.log(`[FOUND STATUS IN FEES_RECORDS] ${full}:${idx + 1}: ${line.trim()}`);
                            }
                        }
                    }
                });
            }
        }
    }
}

console.log('Scanning C:/Users/madhu/code_test...');
scanDir('C:/Users/madhu/code_test');

console.log('Scanning eduhome-app...');
scanDir('c:/Users/madhu/eduhome/eduhome-app/lib');
scanDir('c:/Users/madhu/eduhome/eduhome-app/app');
console.log('Scan complete.');
