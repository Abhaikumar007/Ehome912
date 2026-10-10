const fs = require('fs');

const adminPath = 'C:/Users/madhu/code_test/private/js/admin.js';
let content = fs.readFileSync(adminPath, 'utf8');

// Fix syntax error at line 3198
const brokenLine = "alert('✅ Timetable Successfully Shared to Mobile App!' + ttPushSummary + '\\n\\n'\\n\\n' + rowsToInsert.length + ' class schedule session(s) published.\\nAll students in the class and faculty will see this schedule on their live dashboard.');";
const fixedLine = "alert('✅ Timetable Successfully Shared to Mobile App!' + ttPushSummary + '\\n\\n' + rowsToInsert.length + ' class schedule session(s) published.\\nAll students in the class and faculty will see this schedule on their live dashboard.');";

if (content.includes(brokenLine)) {
    content = content.replace(brokenLine, fixedLine);
    fs.writeFileSync(adminPath, content, 'utf8');
    console.log('Successfully fixed syntax error in admin.js!');
} else {
    // Regex replace in case of minor quote variations
    content = content.replace(/alert\('✅ Timetable Successfully Shared to Mobile App!' \+ ttPushSummary \+ '\\n\\n'\\n\\n'/g, "alert('✅ Timetable Successfully Shared to Mobile App!' + ttPushSummary + '\\n\\n'");
    fs.writeFileSync(adminPath, content, 'utf8');
    console.log('Applied regex fix to admin.js');
}
