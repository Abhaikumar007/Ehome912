const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Import teacherRoster matching logic
function isStudentEnrolledInSubject(studentSubjectsStr, targetSubject) {
  if (!targetSubject || targetSubject === 'All' || targetSubject === 'All Subjects' || targetSubject === 'All Students') {
    return true;
  }
  const stu = (studentSubjectsStr || '').toLowerCase();
  const tgt = targetSubject.toLowerCase().trim();

  // 1. Computer Science (Do NOT use substring 'cs' because 'physics' ends in 'cs'!)
  if (tgt.includes('comp') || /\bcs\b/i.test(tgt)) {
    return stu.includes('computer') || /\bcs\b/i.test(stu);
  }
  if (tgt.includes('math')) return stu.includes('math');
  if (tgt.includes('phys')) return stu.includes('phys');
  if (tgt.includes('chem')) return stu.includes('chem');
  if (tgt.includes('bio')) return stu.includes('bio');

  return stu.includes(tgt);
}

function parseDateToIso(dateStr) {
  if (!dateStr) return null;
  let clean = String(dateStr).trim();
  clean = clean.replace(/^[a-zA-Z]+,\s*/, '');
  const isoM = clean.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (isoM) return `${isoM[1]}-${isoM[2].padStart(2, '0')}-${isoM[3].padStart(2, '0')}`;
  const dmyM = clean.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmyM) return `${dmyM[3]}-${dmyM[2].padStart(2, '0')}-${dmyM[1].padStart(2, '0')}`;
  const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  const dMonYM = clean.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (dMonYM && months[dMonYM[2].toLowerCase().substring(0, 3)]) {
    return `${dMonYM[3]}-${months[dMonYM[2].toLowerCase().substring(0, 3)]}-${dMonYM[1].padStart(2, '0')}`;
  }
  const monDYM = clean.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monDYM && months[monDYM[1].toLowerCase().substring(0, 3)]) {
    return `${monDYM[3]}-${months[monDYM[1].toLowerCase().substring(0, 3)]}-${monDYM[2].padStart(2, '0')}`;
  }
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return null;
}

async function runTests() {
  console.log('=== TEST SUITE: SUBJECT FILTERING & ATTENDANCE SYNC ===\n');

  // Query classes on Oct 31, 2026 for Class 12
  const { data: c12Classes, error: c12Err } = await supabase
    .from('classes')
    .select('*')
    .or('class_grade.eq.Class 12,roll_no.eq.Class 12')
    .eq('class_date', '2026-10-31');

  if (c12Err) {
    console.error('Failed to fetch Class 12 classes:', c12Err);
    process.exit(1);
  }

  console.log(`Found ${c12Classes.length} sessions scheduled for Class 12 on 2026-10-31:`);
  c12Classes.forEach(c => console.log(`  - [${c.id}] ${c.subject} (${c.time})`));

  // TEST 1: Nandana (Physics, Maths)
  console.log('\n--- TEST 1: Subject Visibility for Nandana (EDU-2026-016: Physics, Maths) ---');
  const nandanaSubjects = 'Physics, Maths';
  const nandanaClasses = c12Classes.filter(c => isStudentEnrolledInSubject(nandanaSubjects, c.subject));
  const nandanaHasCS = nandanaClasses.some(c => c.subject.toLowerCase().includes('computer'));
  const nandanaHasMaths = nandanaClasses.some(c => c.subject.toLowerCase().includes('math'));
  const nandanaHasPhysics = nandanaClasses.some(c => c.subject.toLowerCase().includes('phys'));

  console.log('Visible to Nandana:', nandanaClasses.map(c => c.subject));
  console.log('Has Computer Science:', nandanaHasCS, '(Expected: FALSE)');
  console.log('Has Maths:', nandanaHasMaths, '(Expected: TRUE)');
  console.log('Has Physics:', nandanaHasPhysics, '(Expected: TRUE)');
  if (nandanaHasCS || !nandanaHasMaths || !nandanaHasPhysics) {
    console.error('FAIL: Test 1 failed!');
    process.exit(1);
  }
  console.log('PASS: Test 1 Passed!');

  // TEST 2: Sivani (Physics, Chemistry, Maths, Computer Science)
  console.log('\n--- TEST 2: Subject Visibility for Sivani (EDU-2026-015: Physics, Chemistry, Maths, CS) ---');
  const sivaniSubjects = 'Physics, Chemistry, Maths, Computer Science';
  const sivaniClasses = c12Classes.filter(c => isStudentEnrolledInSubject(sivaniSubjects, c.subject));
  const sivaniHasCS = sivaniClasses.some(c => c.subject.toLowerCase().includes('computer'));

  console.log('Visible to Sivani:', sivaniClasses.map(c => c.subject));
  console.log('Has Computer Science:', sivaniHasCS, '(Expected: TRUE)');
  if (!sivaniHasCS) {
    console.error('FAIL: Test 2 failed!');
    process.exit(1);
  }
  console.log('PASS: Test 2 Passed!');

  // TEST 3: Date Normalization
  console.log('\n--- TEST 3: Date Normalization & Matching ---');
  const dEnUs = parseDateToIso('Sat, Oct 31, 2026');
  const dEnIn = parseDateToIso('Sat, 31 Oct, 2026');
  const dIso = parseDateToIso('2026-10-31');
  console.log('Sat, Oct 31, 2026 ->', dEnUs);
  console.log('Sat, 31 Oct, 2026 ->', dEnIn);
  console.log('2026-10-31        ->', dIso);
  if (dEnUs !== '2026-10-31' || dEnIn !== '2026-10-31' || dIso !== '2026-10-31') {
    console.error('FAIL: Test 3 failed!');
    process.exit(1);
  }
  console.log('PASS: Test 3 Passed!');

  // TEST 4: Attendance Matching Logic
  console.log('\n--- TEST 4: Attendance Matching Logic for Student Portal ---');
  const testAttendanceRecord = {
    todaySubjects: [
      {
        id: '0d74d9d9-cc1c-4b44-a3d4-e96c62bc105c',
        classId: '0d74d9d9-cc1c-4b44-a3d4-e96c62bc105c',
        subject: 'Physics',
        time: '8:30 AM - 10:00 AM • Mr. Akshay Kumar M',
        sessionType: 'Regular Class',
        status: 'present',
        date: 'Sat, Oct 31, 2026',
        classDate: '2026-10-31'
      }
    ],
    history: [
      {
        date: 'Fri, Oct 23, 2026',
        classDate: '2026-10-23',
        time: '7:00 AM - 8:30 AM',
        subjects: 'Maths',
        status: 'full',
        classId: '5ab1b5ce-49d5-47a4-8bab-f96969e1d838'
      }
    ]
  };

  const targetDateIsoStr = '2026-10-31';

  // Matcher for Maths on Oct 31: Should NOT match Oct 23!
  const mathsClass = {
    id: '387cfac1-045b-4a68-a505-f1d04df47285',
    subject: 'Maths',
    time: '7:00 AM - 8:30 AM',
    class_date: '2026-10-31'
  };

  const allEntries = [
    ...testAttendanceRecord.todaySubjects,
    ...testAttendanceRecord.history.map(h => ({
      ...h,
      subject: h.subjects || h.subject,
      status: h.status === 'full' ? 'present' : h.status
    }))
  ];

  const dateMatchingCandidates = allEntries.filter(entry => {
    const entryDateIso = entry.classDate || parseDateToIso(entry.date);
    return entryDateIso === targetDateIsoStr;
  });

  console.log(`Candidates for ${targetDateIsoStr}:`, dateMatchingCandidates.length);
  const matchedMaths = dateMatchingCandidates.find(c => c.subject === 'Maths');
  console.log('Maths matched for Oct 31:', matchedMaths ? 'Present' : 'Upcoming (null)', '(Expected: Upcoming/null)');

  const matchedPhysics = dateMatchingCandidates.find(c => c.classId === '0d74d9d9-cc1c-4b44-a3d4-e96c62bc105c' || c.subject === 'Physics');
  console.log('Physics matched for Oct 31:', matchedPhysics ? matchedPhysics.status : 'null', '(Expected: present)');

  if (matchedMaths !== undefined || !matchedPhysics || matchedPhysics.status !== 'present') {
    console.error('FAIL: Test 4 failed!');
    process.exit(1);
  }
  console.log('PASS: Test 4 Passed!');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests();

