const fs = require('fs');

// 1. Update add_student.html to include "Both"
const addStudentPath = 'c:/Users/madhu/code_test/private/add_student.html';
if (fs.existsSync(addStudentPath)) {
  let content = fs.readFileSync(addStudentPath, 'utf8');
  if (!content.includes('value="Both"')) {
    content = content.replace(
      '<option value="CBSE">CBSE</option>',
      '<option value="CBSE">CBSE</option>\r\n                                <option value="Both">Both (CBSE & State)</option>'
    );
    fs.writeFileSync(addStudentPath, content, 'utf8');
    console.log('Updated add_student.html with Both option');
  } else {
    console.log('add_student.html already has Both option');
  }
}

// 2. Update admin.js to handle Both syllabus cleanly and safely
const adminJsPath = 'c:/Users/madhu/code_test/private/js/admin.js';
if (fs.existsSync(adminJsPath)) {
  let adminContent = fs.readFileSync(adminJsPath, 'utf8');

  // Fix batch generation when saving student
  // Old: batch: `${classGradeStr} (${syllabusType})`,
  // Update to handle Both and strip existing duplicate syllabus tags
  adminContent = adminContent.replace(
    /batch:\s*`\$\{classGradeStr\}\s*\(\$\{syllabusType\}\)`/g,
    'batch: syllabusType === "Both" ? `${classGradeStr} (Both)` : `${classGradeStr} (${syllabusType})`'
  );

  // Fix sSyl calculation in student list renderer
  const oldBadgePattern = `const sSyl = s.syllabus || (s.batch && /cbse/i.test(s.batch) ? 'CBSE' : (s.school && /cbse/i.test(s.school) ? 'CBSE' : 'State Syllabus'));`;
  if (adminContent.includes(oldBadgePattern)) {
    const newBadgeCode = `let sSyl = s.syllabus;
                        if (!sSyl && s.batch) {
                            if (/both/i.test(s.batch)) sSyl = 'Both';
                            else if (/cbse/i.test(s.batch) && !/state/i.test(s.batch)) sSyl = 'CBSE';
                            else if (/cbse/i.test(s.batch)) sSyl = 'CBSE';
                            else sSyl = 'State Syllabus';
                        }
                        if (!sSyl && s.school && /cbse/i.test(s.school)) sSyl = 'CBSE';
                        sSyl = sSyl || 'State Syllabus';`;
    adminContent = adminContent.replace(oldBadgePattern, newBadgeCode);
    console.log('Updated badge resolution in admin.js');
  }

  fs.writeFileSync(adminJsPath, adminContent, 'utf8');
  console.log('Updated admin.js successfully');
}

