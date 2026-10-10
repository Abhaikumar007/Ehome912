const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === '.git' || file === 'node_modules') return;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            results.push({ path: path.relative('C:/Users/madhu/code_test', fullPath), size: stat.size });
        }
    });
    return results;
}

const allFiles = walk('C:/Users/madhu/code_test');
console.log(`Total files: ${allFiles.length}`);
allFiles.forEach(f => {
    if (f.path.endsWith('.html') || f.path.includes('timetable') || f.path.includes('mobile') || f.path.includes('student') || f.path.includes('teacher') || f.path.endsWith('.js')) {
        console.log(` - ${f.path} (${f.size} bytes)`);
    }
});
