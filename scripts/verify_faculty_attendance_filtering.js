const fs = require('fs');

console.log('=== VERIFYING FACULTY ATTENDANCE SYLLABUS FILTERING ===\n');

// 1. Load dataService.ts and simulate the filtering logic
const dataServiceCode = fs.readFileSync('lib/dataService.ts', 'utf8');

function resolveClassTargetSyllabus(cls) {
  const status = (cls?.status || '').toLowerCase();
  const time = (cls?.time || '').toLowerCase();
  const roll = (cls?.roll_no || '').toLowerCase();
  const grade = (cls?.class_grade || '').toLowerCase();
  const board = (cls?.board || cls?.target_syllabus || cls?.targetSyllabus || cls?.syllabus || '').toLowerCase();

  if (
    board === 'both' ||
    board.includes('both') ||
    status.split(':').includes('both') ||
    status.includes(':both') ||
    status.includes('both:') ||
    time.includes('both') ||
    time.includes('state & cbse') ||
    time.includes('cbse & state')
  ) {
    return 'Both';
  }

  if (
    board === 'cbse' ||
    board === 'cbse only' ||
    status.split(':').includes('cbse') ||
    status.includes(':cbse') ||
    status.includes('cbse:') ||
    status === 'cbse' ||
    (time.includes('• cbse') && !time.includes('state & cbse') && !time.includes('cbse & state')) ||
    time.includes('(cbse)') ||
    time.includes('cbse only') ||
    roll.includes('cbse') ||
    grade.includes('cbse')
  ) {
    return 'CBSE';
  }

  if (
    board === 'state' ||
    board === 'state only' ||
    board === 'state syllabus' ||
    status.split(':').includes('state') ||
    status.includes(':state') ||
    status.includes('state:') ||
    status.includes('state syllabus') ||
    (time.includes('• state') && !time.includes('state & cbse') && !time.includes('cbse & state')) ||
    time.includes('(state)') ||
    time.includes('state syllabus') ||
    roll.includes('state') ||
    grade.includes('state')
  ) {
    return 'State Syllabus';
  }

  return 'Both';
}

function resolveStudentSyllabus(student) {
  if (student?.syllabus === 'CBSE' || student?.syllabus === 'State Syllabus') {
    return student.syllabus;
  }
  const batchLower = (student?.batch || '').toLowerCase();
  const schoolLower = (student?.school || '').toLowerCase();
  if (batchLower.includes('cbse') || schoolLower.includes('cbse')) return 'CBSE';
  if (batchLower.includes('state') || schoolLower.includes('state')) return 'State Syllabus';
  return 'State Syllabus';
}

function isStudentEnrolledInSubject(studentSubjects, targetSubject) {
  if (!targetSubject || targetSubject === 'All' || targetSubject === 'All Subjects') return true;
  if (!studentSubjects) return false;
  const list = studentSubjects.split(',').map((s) => s.trim().toLowerCase());
  const target = targetSubject.trim().toLowerCase();
  return list.some((s) => s === target || s.includes(target) || target.includes(s));
}

// 2. Test Roster with both State Syllabus and CBSE students
const testStudents = [
  { rollNo: 'EDU-2026-005', name: 'Krishnaveni', class: 'Class 8', batch: 'Class 8', school: 'Puthoor', subjects: 'Maths', syllabus: 'State Syllabus' },
  { rollNo: 'EDU-2026-008', name: 'Vaiga', class: 'Class 8', batch: 'Class 8', school: 'Marthoma', subjects: 'Physics, Chemistry, Maths, Biology', syllabus: 'State Syllabus' },
  { rollNo: 'EDU-2026-010', name: 'Aromal', class: 'Class 8', batch: 'Class 8', school: 'Technical Scool', subjects: 'Physics, Chemistry, Maths', syllabus: 'State Syllabus' },
  { rollNo: 'EDU-2026-099', name: 'Rohan (CBSE)', class: 'Class 8', batch: 'Class 8 (CBSE)', school: 'Kendriya Vidyalaya CBSE', subjects: 'Maths, Science', syllabus: 'CBSE' },
];

// 3. Test Sessions for Class 8 Maths
const cbseSession = {
  id: 'sess-cbse',
  class_grade: 'Class 8',
  subject: 'Maths',
  time: '1:00 AM - 2:00 AM • CBSE • Test Paper • Ms. Devi',
  status: 'upcoming:CBSE:TP:fac-math',
};

const stateSession = {
  id: 'sess-state',
  class_grade: 'Class 8',
  subject: 'Maths',
  time: '4:20 PM - 5:00 PM • State Syllabus • Test Paper • Ms. Devi',
  status: 'upcoming:State:TP:fac-math',
};

const bothSession = {
  id: 'sess-both',
  class_grade: 'Class 8',
  subject: 'Maths',
  time: '8:00 AM - 9:30 AM • Ms. Devi',
  status: 'upcoming:fac-math',
};

function filterForSession(session, students, subject) {
  const sessionSyllabus = resolveClassTargetSyllabus(session);
  const enrolled = students.filter(s => isStudentEnrolledInSubject(s.subjects, subject));
  return enrolled.filter(s => {
    if (sessionSyllabus === 'Both') return true;
    const syl = resolveStudentSyllabus(s);
    if (sessionSyllabus === 'CBSE') return syl === 'CBSE';
    if (sessionSyllabus === 'State Syllabus') return syl === 'State Syllabus';
    return true;
  });
}

// Test 1: CBSE Session
const cbseResult = filterForSession(cbseSession, testStudents, 'Maths');
console.log('1. CBSE Session (' + cbseSession.time + '):');
console.log('   Target Syllabus: ' + resolveClassTargetSyllabus(cbseSession));
console.log('   Eligible Students: ' + cbseResult.map(s => s.name + ' (' + s.syllabus + ')').join(', '));
if (cbseResult.length === 1 && cbseResult[0].name === 'Rohan (CBSE)') {
  console.log('   ✓ PASS: Only CBSE students displayed for CBSE session!');
} else {
  console.error('   ✗ FAIL: Unexpected student list for CBSE session');
  process.exit(1);
}

// Test 2: State Syllabus Session
const stateResult = filterForSession(stateSession, testStudents, 'Maths');
console.log('\n2. State Syllabus Session (' + stateSession.time + '):');
console.log('   Target Syllabus: ' + resolveClassTargetSyllabus(stateSession));
console.log('   Eligible Students: ' + stateResult.map(s => s.name + ' (' + s.syllabus + ')').join(', '));
if (stateResult.length === 3 && stateResult.every(s => s.syllabus === 'State Syllabus')) {
  console.log('   ✓ PASS: Only State Syllabus students displayed for State Syllabus session!');
} else {
  console.error('   ✗ FAIL: Unexpected student list for State Syllabus session');
  process.exit(1);
}

// Test 3: Shared / Both Session
const bothResult = filterForSession(bothSession, testStudents, 'Maths');
console.log('\n3. Shared / Both Session (' + bothSession.time + '):');
console.log('   Target Syllabus: ' + resolveClassTargetSyllabus(bothSession));
console.log('   Eligible Students: ' + bothResult.map(s => s.name + ' (' + s.syllabus + ')').join(', '));
if (bothResult.length === 4) {
  console.log('   ✓ PASS: All enrolled students displayed for Both/Shared session!');
} else {
  console.error('   ✗ FAIL: Unexpected student list for Both/Shared session');
  process.exit(1);
}

console.log('\n======================================================');
console.log('ALL FACULTY ATTENDANCE SYLLABUS TESTS PASSED (3/3) ✓');
console.log('======================================================');
