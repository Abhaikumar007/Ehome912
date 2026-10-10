const fs = require('fs');
const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const lines = js.split('\n');

const terms = ['_extractExamDetailsFromItem', '_deleteExamSlotsFromClasses', '_purgeOrphanedTestPaperClasses', 'cleanApprovedTitle', 'window._allLoadedAnnouncements'];
terms.forEach(term => {
    console.log(`\n--- Matches for ${term} ---`);
    lines.forEach((l, idx) => {
        if (l.includes(term)) {
            console.log(`${idx + 1}: ${l.trim().slice(0, 100)}`);
        }
    });
});
