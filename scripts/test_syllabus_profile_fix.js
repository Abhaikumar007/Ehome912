const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Import helper logic from dataService & studentsRoster
function resolveStudentSyllabus(student) {
  if (student?.syllabus === 'CBSE' || student?.syllabus === 'State Syllabus' || student?.syllabus === 'Both') {
    return student.syllabus;
  }
  const batchLower = (student?.batch || '').toLowerCase();
  const schoolLower = (student?.school || '').toLowerCase();

  if (batchLower.includes('both') || schoolLower.includes('both')) return 'Both';
  if (batchLower.includes('cbse') && batchLower.includes('state')) return 'CBSE';
  if (batchLower.includes('cbse') || schoolLower.includes('cbse')) return 'CBSE';
  if (batchLower.includes('state') || schoolLower.includes('state')) return 'State Syllabus';

  return 'State Syllabus';
}

function formatStudentDisplayClassAndSyllabus(student) {
  if (!student) return 'Class 12';
  const rawClass = (student.class || student.class_name || 'Class 12').trim();
  const className = rawClass.startsWith('Class') ? rawClass : `Class ${rawClass}`;
  const syl = resolveStudentSyllabus(student);

  if (syl === 'Both') {
    return `${className} (Both - CBSE & State)`;
  } else if (syl === 'CBSE') {
    return `${className} (CBSE)`;
  } else {
    return `${className} (State Syllabus)`;
  }
}

function sanitizeStudentBatch(className, batch, syllabus) {
  const cleanClass = (className || 'Class 12').startsWith('Class') ? className : `Class ${className}`;
  const rawBatch = (batch || '').trim();

  const isCorrupted = /state/i.test(rawBatch) && /cbse/i.test(rawBatch);
  const isGeneric = !rawBatch ||
    rawBatch === cleanClass ||
    isCorrupted ||
    /^Class\s+\d+\s*\((State(\s+Syllabus)?|CBSE|Both)\)$/i.test(rawBatch);

  if (isGeneric) {
    if (syllabus === 'Both' || /both/i.test(rawBatch)) return `${cleanClass} (Both)`;
    if (syllabus === 'CBSE' || /cbse/i.test(rawBatch)) return `${cleanClass} (CBSE)`;
    return `${cleanClass} (State Syllabus)`;
  }

  return rawBatch;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('TEST SUITE: Student Syllabus Display & Sync Verification');
  console.log('====================================================\n');

  // Test 1: Nandana profile (CBSE only)
  console.log('--- Test 1: Nandana Profile Syllabus Display ---');
  const nandanaSample = { class: 'Class 12', batch: 'Class 12 (CBSE)', syllabus: 'CBSE' };
  const nandanaDisplay = formatStudentDisplayClassAndSyllabus(nandanaSample);
  assert(nandanaDisplay === 'Class 12 (CBSE)', `Expected "Class 12 (CBSE)", got "${nandanaDisplay}"`);
  assert(!nandanaDisplay.includes('State'), `Must not mention State Syllabus for CBSE student`);
  assert(!nandanaDisplay.includes('Class 12 • Class 12'), `Must not duplicate Class 12 label`);

  // Test 2: Amaljith profile (State Syllabus only)
  console.log('\n--- Test 2: Amaljith Profile Syllabus Display ---');
  const amalSample = { class: 'Class 10', batch: 'Class 10 (State Syllabus)', syllabus: 'State Syllabus' };
  const amalDisplay = formatStudentDisplayClassAndSyllabus(amalSample);
  assert(amalDisplay === 'Class 10 (State Syllabus)', `Expected "Class 10 (State Syllabus)", got "${amalDisplay}"`);
  assert(!amalDisplay.includes('CBSE'), `Must not mention CBSE for State student`);

  // Test 3: Student assigned to Both
  console.log('\n--- Test 3: Student Assigned to Both ---');
  const bothSample = { class: 'Class 11', batch: 'Class 11 (Both)', syllabus: 'Both' };
  const bothDisplay = formatStudentDisplayClassAndSyllabus(bothSample);
  assert(bothDisplay === 'Class 11 (Both - CBSE & State)', `Expected "Class 11 (Both - CBSE & State)", got "${bothDisplay}"`);
  assert(resolveStudentSyllabus(bothSample) === 'Both', `Resolved syllabus is "Both"`);

  // Test 4: Legacy Corrupted String Resilience
  console.log('\n--- Test 4: Resilience to Legacy Corrupted Strings ---');
  const corruptSample = { class: 'Class 12', batch: 'Class 12 (State Syllabus) (CBSE)' };
  const corruptResolved = resolveStudentSyllabus(corruptSample);
  const corruptDisplay = formatStudentDisplayClassAndSyllabus(corruptSample);
  assert(corruptResolved === 'CBSE', `Corrupted string resolved to CBSE`);
  assert(corruptDisplay === 'Class 12 (CBSE)', `Display formatted cleanly to "Class 12 (CBSE)"`);
  const sanitized = sanitizeStudentBatch('Class 12', corruptSample.batch, 'CBSE');
  assert(sanitized === 'Class 12 (CBSE)', `Sanitized batch string is "Class 12 (CBSE)"`);

  // Test 5: Live Supabase Data Verification for Nandana (EDU-2026-016)
  console.log('\n--- Test 5: Live Supabase Fetch for Nandana (EDU-2026-016) ---');
  const { data: nandanaDb, error } = await sb.from('students').select('*').eq('roll_no', 'EDU-2026-016').single();
  assert(!error && nandanaDb, `Supabase fetched EDU-2026-016 without error`);
  assert(nandanaDb.batch === 'Class 12 (CBSE)', `Supabase batch is "Class 12 (CBSE)", got "${nandanaDb.batch}"`);
  const liveSyl = resolveStudentSyllabus(nandanaDb);
  assert(liveSyl === 'CBSE', `Live record resolves to syllabus "CBSE"`);
  const liveDisplay = formatStudentDisplayClassAndSyllabus(nandanaDb);
  assert(liveDisplay === 'Class 12 (CBSE)', `Live display format is "Class 12 (CBSE)", got "${liveDisplay}"`);

  // Test 6: Verify all students in Supabase have valid batches
  console.log('\n--- Test 6: Verify Entire Supabase Roster Batches ---');
  const { data: allDb } = await sb.from('students').select('roll_no, name, class_name, batch');
  let corruptCount = 0;
  allDb.forEach(s => {
    if (/state/i.test(s.batch) && /cbse/i.test(s.batch)) corruptCount++;
  });
  assert(corruptCount === 0, `All ${allDb.length} students have clean batches (0 corrupt)`);

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests();

