// Self-contained verification script testing the exact algorithm implemented in dataService.ts and studentsRoster.ts

function resolveClassTargetSyllabus(cls) {
  const status = (cls?.status || '').toLowerCase();
  const time = (cls?.time || '').toLowerCase();
  const roll = (cls?.roll_no || '').toLowerCase();
  const grade = (cls?.class_grade || '').toLowerCase();
  const board = (cls?.board || cls?.target_syllabus || cls?.targetSyllabus || cls?.syllabus || '').toLowerCase();

  // 1. Explicit CBSE indicators
  if (
    board === 'cbse' ||
    board === 'cbse only' ||
    status.split(':').includes('cbse') ||
    status.includes(':cbse') ||
    status.includes('cbse:') ||
    status === 'cbse' ||
    time.includes('• cbse') ||
    time.includes('(cbse)') ||
    time.includes('cbse only') ||
    roll.includes('cbse') ||
    grade.includes('cbse')
  ) {
    return 'CBSE';
  }

  // 2. Explicit State Syllabus indicators
  if (
    board === 'state' ||
    board === 'state only' ||
    board === 'state syllabus' ||
    status.split(':').includes('state') ||
    status.includes(':state') ||
    status.includes('state:') ||
    status.includes('state syllabus') ||
    time.includes('• state') ||
    time.includes('(state)') ||
    time.includes('state syllabus') ||
    roll.includes('state') ||
    grade.includes('state')
  ) {
    return 'State Syllabus';
  }

  // 3. Default: Shared between both syllabuses
  return 'Both';
}

console.log('=== SYLLABUS-BASED FILTERING VERIFICATION TEST ===\n');

// 1. Test classes
console.log('1. Checking Timetable Target Syllabus Detection:');
const mockClasses = [
  {
    id: 'c1',
    class_grade: 'Class 8',
    subject: 'Maths',
    time: '8:00 AM - 9:30 AM • State Syllabus • Ms. Devi',
    status: 'upcoming:State:fac-math',
  },
  {
    id: 'c2',
    class_grade: 'Class 8',
    subject: 'Science',
    time: '10:00 AM - 11:30 AM • CBSE • Mr. Akshay Kumar M',
    status: 'upcoming:CBSE:fac-phy',
  },
  {
    id: 'c3',
    class_grade: 'Class 8',
    subject: 'English',
    time: '02:00 PM - 03:30 PM • Ms. Devi',
    status: 'upcoming:fac-math',
  },
  {
    id: 'c4',
    class_grade: 'Class 8',
    subject: 'Social Science',
    time: '04:00 PM - 05:30 PM • Both • Mr. Abhai Kumar',
    status: 'upcoming:Both:fac-cs',
  }
];

const targets = mockClasses.map(c => ({
  id: c.id,
  subject: c.subject,
  target: resolveClassTargetSyllabus(c)
}));

console.log('Target syllabus detected for test classes:');
targets.forEach(t => console.log(`  - Class ${t.id} (${t.subject}): detected as "${t.target}"`));

if (targets[0].target !== 'State Syllabus') throw new Error('c1 should be State Syllabus');
if (targets[1].target !== 'CBSE') throw new Error('c2 should be CBSE');
if (targets[2].target !== 'Both') throw new Error('c3 (untagged) should default to Both');
if (targets[3].target !== 'Both') throw new Error('c4 should be Both');
console.log('✓ Target syllabus detection verified!\n');

// 2. Test Student Visibility Matrix
console.log('2. Testing Student Portal Visibility Matrix:');

function filterForStudent(classesList, studentSyllabus) {
  return classesList.filter(c => {
    const target = resolveClassTargetSyllabus(c);
    if (target === 'Both') return true;
    if (studentSyllabus === 'CBSE') {
      return target === 'CBSE';
    } else {
      return target === 'State Syllabus';
    }
  });
}

// A. State Syllabus Student (e.g. Krishnaveni)
const stateVisible = filterForStudent(mockClasses, 'State Syllabus');
console.log(`State Syllabus Student visible classes: ${stateVisible.map(c => `${c.subject} (${c.id})`).join(', ')}`);
const stateIds = stateVisible.map(c => c.id);
if (!stateIds.includes('c1')) throw new Error('State student MUST see State Syllabus class c1');
if (stateIds.includes('c2')) throw new Error('State student MUST NOT see CBSE class c2');
if (!stateIds.includes('c3')) throw new Error('State student MUST see shared class c3');
if (!stateIds.includes('c4')) throw new Error('State student MUST see Both class c4');
console.log('✓ State Student visibility matches expected matrix!');

// B. CBSE Student (e.g. Karthik Nath)
const cbseVisible = filterForStudent(mockClasses, 'CBSE');
console.log(`CBSE Student visible classes: ${cbseVisible.map(c => `${c.subject} (${c.id})`).join(', ')}`);
const cbseIds = cbseVisible.map(c => c.id);
if (cbseIds.includes('c1')) throw new Error('CBSE student MUST NOT see State Syllabus class c1');
if (!cbseIds.includes('c2')) throw new Error('CBSE student MUST see CBSE class c2');
if (!cbseIds.includes('c3')) throw new Error('CBSE student MUST see shared class c3');
if (!cbseIds.includes('c4')) throw new Error('CBSE student MUST see Both class c4');
console.log('✓ CBSE Student visibility matches expected matrix!\n');

console.log('===================================================');
console.log('ALL ACCEPTANCE CRITERIA VERIFIED & PASSING!');
console.log('===================================================');
