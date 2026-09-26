const fs = require('fs');
const path = require('path');

const appDir = 'c:\\Users\\madhu\\eduhome\\eduhome-app';

console.log('=== 1. Updating lib/teacherRoster.ts to set Mr. Abhai Kumar as primary Faculty/Admin ===');
const teacherRosterPath = path.join(appDir, 'lib', 'teacherRoster.ts');
let rosterCode = fs.readFileSync(teacherRosterPath, 'utf8');

if (!rosterCode.includes('FAC-2024-042')) {
    const abhaiProfile = `  {
    id: 'FAC-2024-042',
    name: 'Mr. Abhai Kumar',
    subject: 'Academic Head & Physics',
    department: 'Senior Science & Administration',
    qualification: 'M.Sc. Physics, B.Ed.',
    email: 'abhai.kumar@eduhome.ac.in',
    phone: '+91 91234 56780',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    allowedGrades: ['*'],
    gradeDescription: 'All Grades (Academic Head / Super Admin)',
  },\n`;

    rosterCode = rosterCode.replace('export const TEACHER_ROSTER: TeacherProfile[] = [\n', 'export const TEACHER_ROSTER: TeacherProfile[] = [\n' + abhaiProfile);
    fs.writeFileSync(teacherRosterPath, rosterCode, 'utf8');
    console.log('✓ Added Mr. Abhai Kumar (FAC-2024-042) to TEACHER_ROSTER');
}

console.log('=== 2. Replacing all hardcoded Madhusudanan occurrences across eduhome-app ===');

const filesToReplace = [
    'lib/dataService.ts',
    'constants/mockData.ts',
    'app/(teacher)/index.tsx',
    'app/(teacher)/tests.tsx',
    'app/(teacher)/attendance.tsx',
    'app/(student)/profile.tsx',
    'app/(student)/index.tsx',
    'app/(student)/fees.tsx',
    'app/(student)/attendance.tsx',
];

filesToReplace.forEach(relPath => {
    const fullPath = path.join(appDir, relPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let count = 0;
        content = content.replace(/Mr\.\s*R\s*Madhusudanan/gi, () => {
            count++;
            return 'Mr. Abhai Kumar';
        });
        content = content.replace(/Madhusudanan/gi, () => {
            count++;
            return 'Abhai Kumar';
        });
        if (count > 0) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✓ Replaced ${count} occurrences in ${relPath}`);
        }
    }
});

console.log('=== Step 1 & 2 completed ===');
