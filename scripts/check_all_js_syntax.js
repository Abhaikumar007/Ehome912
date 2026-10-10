const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === '.git' || file === 'node_modules' || file.includes('.bak_')) return;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

const jsFiles = walk('C:/Users/madhu/code_test');
console.log(`Checking ${jsFiles.length} JS files...`);
let errors = 0;
jsFiles.forEach(f => {
    try {
        execSync(`node --check "${f}"`, { encoding: 'utf8' });
    } catch (e) {
        console.error(`SYNTAX ERROR in ${f}:\n`, e.stderr || e.message);
        errors++;
    }
});

if (errors === 0) {
    console.log('All other JS files passed syntax check!');
} else {
    console.log(`Found ${errors} syntax errors.`);
}
