const fs = require('fs');
const filePath = 'c:/Users/madhu/eduhome/eduhome-app/lib/studentsRoster.ts';

const cbseRolls = new Set([
  'EDU-2026-007', // Niranjana
  'EDU-2026-016', // Nandana (Class 12 CBSE)
  'EDU-2026-017', // Karun (Class 12 CBSE)
  'EDU-2026-018', // Aadidev (Class 12 CBSE)
  'EDU-2026-022', // Karthik Nath (Class 9 CBSE)
  'EDU-2026-024', // Ganga (Class 10 CBSE)
  'EDU-2026-025', // Adithya Krishnan (Class 9 CBSE)
  'EDU-2026-026', // Alecia Mathew (Class 10 CBSE)
  'EDU-2026-027', // Krishnanandh (Class 9 CBSE)
  'EDU-2026-031', // Achyuth (Class 9 CBSE)
  'EDU-2026-032', // Hiba (Class 11 CBSE)
  'EDU-2026-033', // Gowtham (Class 9 CBSE)
  'EDU-2026-034', // Vyshnavi (Class 12 CBSE)
  'EDU-2026-035', // Gopika (Class 8 CBSE)
  'EDU-2026-036', // Cristine (Class 10 CBSE)
  'EDU-2026-048', // Sreehari (Class 10 CBSE)
]);

let content = fs.readFileSync(filePath, 'utf8');

// Update EduStudent interface to support 'Both'
content = content.replace(
  "syllabus?: 'State Syllabus' | 'CBSE';",
  "syllabus?: 'State Syllabus' | 'CBSE' | 'Both';"
);

// Update RAW_STUDENTS batch fields to explicitly contain (CBSE) or (State Syllabus)
const lines = content.split('\n');
const updatedLines = lines.map(line => {
  const matchRoll = line.match(/rollNo:\s*'(EDU-[^']+)'/);
  if (matchRoll) {
    const roll = matchRoll[1];
    const isCbse = cbseRolls.has(roll);
    const targetSyl = isCbse ? 'CBSE' : 'State Syllabus';
    
    // Check if line has class: 'Class X'
    const classMatch = line.match(/class:\s*'(Class \d+)'/);
    if (classMatch) {
      const cls = classMatch[1];
      const correctBatch = `${cls} (${targetSyl})`;
      // Replace batch: '...' with correctBatch
      return line.replace(/batch:\s*'[^']+'/, `batch: '${correctBatch}'`);
    }
  }
  return line;
});

content = updatedLines.join('\n');

// Update EDUSYNC_STUDENTS mapping
const oldMapping = `export const EDUSYNC_STUDENTS: EduStudent[] = RAW_STUDENTS.map((s, idx) => {
  const isCBSE = (s.school && /cbse/i.test(s.school)) || (s.batch && /cbse/i.test(s.batch));
  const syllabus: 'State Syllabus' | 'CBSE' = isCBSE ? 'CBSE' : 'State Syllabus';
  return {
    ...s,
    syllabus,
    recentScore: \`\${s.accuracy}%\`,
    avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
  };
});`;

const newMapping = `export const EDUSYNC_STUDENTS: EduStudent[] = RAW_STUDENTS.map((s, idx) => {
  const isBoth = (s.school && /both/i.test(s.school)) || (s.batch && /both/i.test(s.batch));
  const isCBSE = (s.school && /cbse/i.test(s.school)) || (s.batch && /cbse/i.test(s.batch));
  const syllabus: 'State Syllabus' | 'CBSE' | 'Both' = isBoth ? 'Both' : (isCBSE ? 'CBSE' : 'State Syllabus');
  return {
    ...s,
    syllabus,
    recentScore: \`\${s.accuracy}%\`,
    avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
  };
});`;

if (content.includes(oldMapping)) {
  content = content.replace(oldMapping, newMapping);
  console.log('Updated EDUSYNC_STUDENTS mapping');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated studentsRoster.ts successfully');

