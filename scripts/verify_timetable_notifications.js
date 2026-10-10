// Extract the exact functions from lib/dataService.ts
function isTargetedToClass(item, studentClass) {
  if (!item) return false;
  if (!studentClass || studentClass === 'All' || studentClass === 'All Classes') return true;

  const studentMatch = studentClass.match(/\b(?:class|grade)?\s*(\d{1,2})\b/i);
  const studentGrade = studentMatch ? studentMatch[1] : null;

  const itemClassDirect = item.classTag || item.class_grade || item.class_tag || item.target;
  if (itemClassDirect) {
    const directTrim = itemClassDirect.trim();
    if (/^all\b/i.test(directTrim) || /all\s+classes/i.test(directTrim) || /all\s+students/i.test(directTrim)) return true;
    const directMatch = directTrim.match(/\b(?:class|grade)?\s*(\d{1,2})\b/i);
    if (directMatch && studentGrade) return directMatch[1] === studentGrade;
  }

  const title = item.title || '';
  const desc = item.desc || item.description || item.shortDesc || '';
  const fullText = `${title} ${desc}`;

  if (/\[\s*all\s*(?:classes|students)?\s*\]/i.test(title) || /\b(?:all\s+classes|all\s+students)\b/i.test(title)) return true;

  const classMatches = [...fullText.matchAll(/\b(?:class|grade)\s*(\d{1,2})\b/gi)];
  if (classMatches.length === 0) return true;

  const targetedGrades = classMatches.map((m) => m[1]);
  if (studentGrade) return targetedGrades.includes(studentGrade);
  return classMatches.some((m) => studentClass.toLowerCase().includes(m[0].toLowerCase()));
}

function isTargetedToSyllabus(item, studentSyllabus) {
  if (!item) return false;
  if (!studentSyllabus || studentSyllabus === 'Both') return true;

  const title = (item.title || '').toLowerCase();
  const desc = (item.desc || item.description || item.shortDesc || '').toLowerCase();
  const rawTag = (item.target_syllabus || item.targetSyllabus || item.syllabus_tag || item.board || item.syllabus || '').toLowerCase();
  const fullText = `${title} ${desc} ${rawTag}`;

  if (
    rawTag === 'both' ||
    rawTag.includes('both') ||
    fullText.includes('(both board') ||
    fullText.includes('[both board') ||
    fullText.includes('both board') ||
    fullText.includes('both syllabus') ||
    fullText.includes('state & cbse') ||
    fullText.includes('cbse & state')
  ) {
    return true;
  }

  const isCbse =
    rawTag === 'cbse' ||
    rawTag === 'cbse only' ||
    fullText.includes('[cbse') ||
    fullText.includes('(cbse') ||
    fullText.includes('cbse board') ||
    fullText.includes('cbse syllabus');

  const isState =
    rawTag === 'state' ||
    rawTag === 'state only' ||
    rawTag.includes('state syllabus') ||
    fullText.includes('[state') ||
    fullText.includes('(state') ||
    fullText.includes('state board') ||
    fullText.includes('state syllabus');

  if (isCbse && !isState) return studentSyllabus === 'CBSE';
  if (isState && !isCbse) return studentSyllabus === 'State Syllabus';
  return true;
}

function isTargetedToStudent(item, studentClass, studentSyllabus) {
  return isTargetedToClass(item, studentClass) && isTargetedToSyllabus(item, studentSyllabus);
}

console.log('====================================================');
console.log('TIMETABLE NOTIFICATION & SYLLABUS TARGETING VERIFICATION');
console.log('====================================================');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Timetable item for CBSE
const cbseTimetable = {
  title: '🗓️ Timetable Published: Class 10 (CBSE)',
  description: 'New schedule published for Mathematics, Physics (CBSE Board).',
  tag: 'Timetable',
  target_syllabus: 'CBSE'
};

// 2. Timetable item for State Syllabus
const stateTimetable = {
  title: '🗓️ Timetable Published: Class 10 (State Syllabus)',
  description: 'New schedule published for Mathematics, Physics (State Syllabus Board).',
  tag: 'Timetable',
  target_syllabus: 'State Syllabus'
};

// 3. Timetable item for Both
const bothTimetable = {
  title: '🗓️ Timetable Published: Class 10',
  description: 'New schedule published for Chemistry (Both Boards).',
  tag: 'Timetable',
  target_syllabus: 'Both'
};

// Student 1: Class 10, CBSE
const studentCbse = { class: 'Class 10', syllabus: 'CBSE' };

// Student 2: Class 10, State Syllabus
const studentState = { class: 'Class 10', syllabus: 'State Syllabus' };

// Student 3: Class 11, State Syllabus
const studentClass11 = { class: 'Class 11', syllabus: 'State Syllabus' };

console.log('\n--- 1. CBSE Student Checks ---');
assert(isTargetedToStudent(cbseTimetable, studentCbse.class, studentCbse.syllabus), 'CBSE student receives Class 10 CBSE timetable');
assert(!isTargetedToStudent(stateTimetable, studentCbse.class, studentCbse.syllabus), 'CBSE student does NOT receive Class 10 State Syllabus timetable');
assert(isTargetedToStudent(bothTimetable, studentCbse.class, studentCbse.syllabus), 'CBSE student receives Class 10 Both timetable');

console.log('\n--- 2. State Syllabus Student Checks ---');
assert(!isTargetedToStudent(cbseTimetable, studentState.class, studentState.syllabus), 'State Syllabus student does NOT receive Class 10 CBSE timetable');
assert(isTargetedToStudent(stateTimetable, studentState.class, studentState.syllabus), 'State Syllabus student receives Class 10 State Syllabus timetable');
assert(isTargetedToStudent(bothTimetable, studentState.class, studentState.syllabus), 'State Syllabus student receives Class 10 Both timetable');

console.log('\n--- 3. Class Grade Isolation ---');
assert(!isTargetedToStudent(cbseTimetable, studentClass11.class, studentClass11.syllabus), 'Class 11 student does NOT receive Class 10 timetable');
assert(!isTargetedToStudent(stateTimetable, studentClass11.class, studentClass11.syllabus), 'Class 11 student does NOT receive Class 10 State timetable');

console.log('\n====================================================');
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
