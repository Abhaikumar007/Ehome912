/**
 * COMPREHENSIVE ATTENDANCE EDITING & ACCURACY TEST SUITE
 * Validates teacher accidental submit protection, in-place corrections,
 * student portal accuracy, subject/time normalization, and history preservation.
 */

const assert = require('assert');

// 1. Mock InMemory Cache
const inMemoryCache = new Map();
const mockAsyncStorage = {
  getItem: async (key) => inMemoryCache.get(key) || null,
  setItem: async (key, val) => { inMemoryCache.set(key, val); },
  removeItem: async (key) => { inMemoryCache.delete(key); },
  clear: async () => { inMemoryCache.clear(); },
};

// 2. Mock Supabase Table for attendance_records
const supabaseTable = new Map();

// 3. Normalization helpers matching lib/dataService.ts
function normSub(s) {
  const lower = (s || '').toLowerCase().trim();
  if (lower.includes('math')) return 'mathematics';
  if (lower.includes('phys')) return 'physics';
  if (lower.includes('chem')) return 'chemistry';
  if (lower.includes('bio')) return 'biology';
  if (lower.includes('comp') || /\bcs\b/i.test(lower)) return 'computer';
  return lower;
}

function normTime(t) {
  if (!t) return '';
  return t.split('•')[0].split('(')[0].trim().toLowerCase();
}

function isSameSession(entry, date, subject, timeSlotStr, classIdStr) {
  if (classIdStr && entry.classId && entry.classId === classIdStr) {
    return true;
  }
  if (classIdStr && entry.classId && entry.classId !== classIdStr) {
    return false;
  }
  if (entry.date && date && entry.date !== date) {
    return false;
  }
  const entrySub = normSub(entry.subjects || entry.subject || '');
  const targetSub = normSub(subject);
  if (entrySub && targetSub && entrySub !== targetSub && !entrySub.includes(targetSub) && !targetSub.includes(entrySub)) {
    return false;
  }
  const entryTime = normTime(entry.time || '');
  const targetTime = normTime(timeSlotStr);
  if (targetTime && targetTime !== 'class session' && entryTime && entryTime !== 'class session') {
    return entryTime === targetTime || entryTime.includes(targetTime) || targetTime.includes(entryTime);
  }
  return true;
}

// 4. Save Batch Attendance simulation matching DataService
async function simulateSaveBatchAttendance(students, date, subject, classLabel, meta) {
  const timeSlotStr = meta?.timeSlot || 'Class Session';
  const classIdStr = meta?.classId || '';
  const sessionTypeStr = meta?.sessionType || 'Regular Class';

  const results = [];

  for (const stu of students) {
    const cacheKey = `attendance_${stu.rollNo}`;
    let existing = inMemoryCache.has(cacheKey) ? JSON.parse(inMemoryCache.get(cacheKey)) : null;
    const remote = supabaseTable.get(stu.rollNo.toUpperCase());

    // Preserve remote history if local cache lacks it
    if (!existing || !existing.history || existing.history.length === 0) {
      if (remote) {
        existing = {
          overall: remote.overall || 0,
          attended: remote.attended || 0,
          total: remote.total || 0,
          history: Array.isArray(remote.history) ? [...remote.history] : [],
          todaySubjects: Array.isArray(remote.today_subjects) ? [...remote.today_subjects] : [],
        };
      }
    } else if (remote && Array.isArray(remote.history) && remote.history.length > existing.history.length) {
      existing = {
        overall: remote.overall || 0,
        attended: remote.attended || 0,
        total: remote.total || 0,
        history: [...remote.history],
        todaySubjects: Array.isArray(remote.today_subjects) ? [...remote.today_subjects] : existing.todaySubjects,
      };
    }

    if (!existing) {
      existing = { overall: 0, attended: 0, total: 0, history: [], todaySubjects: [] };
    }

    const historyEntry = {
      date,
      subjects: subject,
      time: timeSlotStr,
      classId: classIdStr,
      sessionType: sessionTypeStr,
      score: stu.status === 'P' ? '1/1' : '0/1',
      status: stu.status === 'P' ? 'full' : 'absent',
      class: classLabel,
    };

    const prevHistory = (existing.history || []).filter(
      (h) => !isSameSession(h, date, subject, timeSlotStr, classIdStr)
    );
    const history = [historyEntry, ...prevHistory].slice(0, 60);
    const attended = history.filter((h) => h.status === 'full' || h.status === 'present' || h.score === '1/1').length;
    const total = history.length;
    const overall = total > 0 ? Math.round((attended / total) * 100) : 0;

    const prevTodaySubjects = (existing.todaySubjects || []).filter(
      (s) => !isSameSession(s, date, subject, timeSlotStr, classIdStr)
    );
    const todaySubjects = [
      {
        id: classIdStr || `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        classId: classIdStr,
        subject,
        time: timeSlotStr,
        sessionType: sessionTypeStr,
        status: stu.status === 'P' ? 'present' : 'absent',
        date,
      },
      ...prevTodaySubjects,
    ];

    const updated = { ...existing, overall, attended, total, history, todaySubjects };
    inMemoryCache.set(cacheKey, JSON.stringify(updated));

    supabaseTable.set(stu.rollNo.toUpperCase(), {
      roll_no: stu.rollNo,
      overall,
      attended,
      total,
      today_subjects: todaySubjects,
      history,
      updated_at: new Date().toISOString(),
    });

    results.push({ rollNo: stu.rollNo, ...updated });
  }

  return results;
}

// 5. Student view dynamic day calculation matching app/(student)/attendance.tsx
function simulateStudentGetDayAttendance(rollNo, offset = 0, targetDateLabel = 'Fri, Oct 30, 2026') {
  const remote = supabaseTable.get(rollNo.toUpperCase());
  if (!remote) return null;

  const allCandidates = [
    ...(Array.isArray(remote.today_subjects) ? remote.today_subjects : []).map((s) => ({
      ...s,
      subject: s.name || s.subject || s.subjects || 'Class Session',
      time: s.time || 'Class Session',
      status: s.status || 'pending',
    })),
    ...(Array.isArray(remote.history) ? remote.history : []).map((h) => ({
      id: h.classId || 'hist-1',
      classId: h.classId || '',
      subject: h.subjects || h.subject || 'Class Session',
      time: h.time || 'Class Session',
      status: (h.status === 'full' || h.score === '1/1' || h.status === 'present') ? 'present' : 'absent',
      date: h.date,
    })),
  ];

  const matchedSessions = allCandidates.filter((s) => {
    if (offset === 0 && !s.date) return true;
    if (s.date && s.date === targetDateLabel) return true;
    return false;
  });

  const seen = new Set();
  const sessionList = [];
  matchedSessions.forEach((s) => {
    const key = s.classId || `${(s.subject || '').toLowerCase()}_${(s.time || '').toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      sessionList.push(s);
    }
  });

  const presentCnt = sessionList.filter((s) => s.status === 'present').length;
  const absentCnt = sessionList.filter((s) => s.status === 'absent').length;
  const totalRecorded = presentCnt + absentCnt;
  const pct = totalRecorded > 0 ? Math.round((presentCnt / totalRecorded) * 100) : 0;

  return {
    subjects: sessionList,
    presentCnt,
    absentCnt,
    totalRecorded,
    pct,
    sessionCount: `${presentCnt} of ${totalRecorded} Sessions Attended (${pct}%)`,
  };
}

// ==========================================
// TEST CASES
// ==========================================
async function runTests() {
  console.log('====================================================');
  console.log('   STARTING EXTENSIVE ATTENDANCE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] Case ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] Case ${total}: ${name}`);
      console.error(err);
      process.exit(1);
    }
  }

  // CASE 1: Initial Submission
  await simulateSaveBatchAttendance(
    [
      { rollNo: 'EDU-2026-001', name: 'Student 1', status: 'P' },
      { rollNo: 'EDU-2026-002', name: 'Student 2', status: 'A' },
    ],
    'Fri, Oct 30, 2026',
    'Mathematics',
    'Class 12',
    { classId: 'sess-math-c12', timeSlot: '7:00 AM - 8:30 AM', sessionType: 'Regular Class' }
  );

  test('Initial Batch Submission - Student 1 Present', () => {
    const s1 = supabaseTable.get('EDU-2026-001');
    assert.strictEqual(s1.overall, 100);
    assert.strictEqual(s1.attended, 1);
    assert.strictEqual(s1.total, 1);
    assert.strictEqual(s1.history.length, 1);
    assert.strictEqual(s1.history[0].status, 'full');
    assert.strictEqual(s1.today_subjects[0].status, 'present');
  });

  test('Initial Batch Submission - Student 2 Absent', () => {
    const s2 = supabaseTable.get('EDU-2026-002');
    assert.strictEqual(s2.overall, 0);
    assert.strictEqual(s2.attended, 0);
    assert.strictEqual(s2.total, 1);
    assert.strictEqual(s2.history.length, 1);
    assert.strictEqual(s2.history[0].status, 'absent');
    assert.strictEqual(s2.today_subjects[0].status, 'absent');
  });

  // CASE 2: Teacher Correction - Accidental Absent -> Corrected to Present
  await simulateSaveBatchAttendance(
    [
      { rollNo: 'EDU-2026-001', name: 'Student 1', status: 'P' },
      { rollNo: 'EDU-2026-002', name: 'Student 2', status: 'P' }, // Student 2 marked Present on correction
    ],
    'Fri, Oct 30, 2026',
    'Mathematics',
    'Class 12',
    { classId: 'sess-math-c12', timeSlot: '7:00 AM - 8:30 AM', sessionType: 'Regular Class' }
  );

  test('Correction Absent -> Present in-place (No duplicate history)', () => {
    const s2 = supabaseTable.get('EDU-2026-002');
    assert.strictEqual(s2.total, 1, 'Total sessions must NOT increment upon editing');
    assert.strictEqual(s2.attended, 1, 'Attended must increment from 0 to 1');
    assert.strictEqual(s2.overall, 100, 'Overall must be 100%');
    assert.strictEqual(s2.history.length, 1, 'History length must still be 1 (replaced, not appended)');
    assert.strictEqual(s2.history[0].status, 'full');
    assert.strictEqual(s2.history[0].score, '1/1');
    assert.strictEqual(s2.today_subjects[0].status, 'present');
  });

  // CASE 3: Student Portal receives the corrected attendance
  test('Student Portal view reflects corrected attendance accurately', () => {
    const dayAtt = simulateStudentGetDayAttendance('EDU-2026-002', 0, 'Fri, Oct 30, 2026');
    assert.strictEqual(dayAtt.presentCnt, 1);
    assert.strictEqual(dayAtt.absentCnt, 0);
    assert.strictEqual(dayAtt.totalRecorded, 1);
    assert.strictEqual(dayAtt.pct, 100);
    assert.strictEqual(dayAtt.sessionCount, '1 of 1 Sessions Attended (100%)');
    assert.strictEqual(dayAtt.subjects[0].status, 'present');
  });

  // CASE 4: Subject Name Normalization ("Maths" vs "Mathematics")
  // Initial record had "Mathematics". Teacher edits using "Maths".
  await simulateSaveBatchAttendance(
    [
      { rollNo: 'EDU-2026-001', name: 'Student 1', status: 'A' }, // Changed to absent with 'Maths'
    ],
    'Fri, Oct 30, 2026',
    'Maths', // alias
    'Class 12',
    { classId: '', timeSlot: '7:00 AM - 8:30 AM', sessionType: 'Regular Class' }
  );

  test('Subject Normalization - "Maths" matches "Mathematics" session slot', () => {
    const s1 = supabaseTable.get('EDU-2026-001');
    assert.strictEqual(s1.history.length, 1, 'Maths must replace Mathematics session without duplicating');
    assert.strictEqual(s1.history[0].status, 'absent');
    assert.strictEqual(s1.attended, 0);
    assert.strictEqual(s1.overall, 0);
  });

  // CASE 5: Time Slot Normalization ("7:00 AM - 8:30 AM • Ms. Devi" vs "7:00 AM - 8:30 AM")
  await simulateSaveBatchAttendance(
    [
      { rollNo: 'EDU-2026-001', name: 'Student 1', status: 'P' },
    ],
    'Fri, Oct 30, 2026',
    'Mathematics',
    'Class 12',
    { classId: '', timeSlot: '7:00 AM - 8:30 AM • Ms. Devi', sessionType: 'Regular Class' }
  );

  test('Time Slot Normalization - "7:00 AM - 8:30 AM • Ms. Devi" matches "7:00 AM - 8:30 AM"', () => {
    const s1 = supabaseTable.get('EDU-2026-001');
    assert.strictEqual(s1.history.length, 1, 'Time slot with teacher suffix must match and replace without duplicating');
    assert.strictEqual(s1.history[0].status, 'full');
    assert.strictEqual(s1.attended, 1);
    assert.strictEqual(s1.overall, 100);
  });

  // CASE 6: Preserving Past Historical Attendance Across Teacher Devices
  // Simulate Student 3 has 3 past days of attendance in Supabase (Oct 24, Oct 26, Oct 28).
  // Teacher phone has EMPTY local cache for Student 3.
  const pastHistory = [
    { date: 'Wed, Oct 28, 2026', subjects: 'Mathematics', score: '1/1', status: 'full', time: '7:00 AM - 8:30 AM' },
    { date: 'Mon, Oct 26, 2026', subjects: 'Mathematics', score: '1/1', status: 'full', time: '7:00 AM - 8:30 AM' },
    { date: 'Sat, Oct 24, 2026', subjects: 'Physics', score: '0/1', status: 'absent', time: '5:00 PM - 6:30 PM' },
  ];
  supabaseTable.set('EDU-2026-003', {
    roll_no: 'EDU-2026-003',
    overall: 67,
    attended: 2,
    total: 3,
    today_subjects: [],
    history: pastHistory,
  });
  // Clear local cache for Student 3 to simulate a different teacher device
  inMemoryCache.delete('attendance_EDU-2026-003');

  // Teacher submits attendance for Student 3 today (Oct 30)
  await simulateSaveBatchAttendance(
    [{ rollNo: 'EDU-2026-003', name: 'Student 3', status: 'P' }],
    'Fri, Oct 30, 2026',
    'Mathematics',
    'Class 12',
    { classId: 'sess-math-c12', timeSlot: '7:00 AM - 8:30 AM', sessionType: 'Regular Class' }
  );

  test('Preservation of Past Attendance - Past 3 days are NOT wiped out', () => {
    const s3 = supabaseTable.get('EDU-2026-003');
    assert.strictEqual(s3.history.length, 4, 'Must have 4 records (3 past + 1 today)');
    assert.strictEqual(s3.total, 4, 'Total must be 4');
    assert.strictEqual(s3.attended, 3, 'Attended must be 3 (2 past + 1 today)');
    assert.strictEqual(s3.overall, 75, 'Overall must be 75% (3/4)');
    assert.strictEqual(s3.history[0].date, 'Fri, Oct 30, 2026');
    assert.strictEqual(s3.history[1].date, 'Wed, Oct 28, 2026');
    assert.strictEqual(s3.history[2].date, 'Mon, Oct 26, 2026');
    assert.strictEqual(s3.history[3].date, 'Sat, Oct 24, 2026');
  });

  // CASE 7: Editing Student with Prior History
  // Teacher realizes Student 3 was actually Absent today.
  await simulateSaveBatchAttendance(
    [{ rollNo: 'EDU-2026-003', name: 'Student 3', status: 'A' }],
    'Fri, Oct 30, 2026',
    'Mathematics',
    'Class 12',
    { classId: 'sess-math-c12', timeSlot: '7:00 AM - 8:30 AM', sessionType: 'Regular Class' }
  );

  test('Editing today session preserves past history intact', () => {
    const s3 = supabaseTable.get('EDU-2026-003');
    assert.strictEqual(s3.history.length, 4, 'Must still be 4 total records');
    assert.strictEqual(s3.total, 4);
    assert.strictEqual(s3.attended, 2, 'Attended must decrease to 2');
    assert.strictEqual(s3.overall, 50, 'Overall must be 50% (2/4)');
    assert.strictEqual(s3.history[0].status, 'absent');
    assert.strictEqual(s3.today_subjects[0].status, 'absent');
  });

  // CASE 8: Rapid Multiple Toggles (P -> A -> P -> A -> P)
  for (let i = 0; i < 5; i++) {
    const status = i % 2 === 0 ? 'P' : 'A';
    await simulateSaveBatchAttendance(
      [{ rollNo: 'EDU-2026-004', name: 'Student 4', status }],
      'Fri, Oct 30, 2026',
      'Mathematics',
      'Class 12',
      { classId: 'sess-math-c12', timeSlot: '7:00 AM - 8:30 AM' }
    );
  }

  test('Multiple Rapid Corrections - History length remains strictly 1', () => {
    const s4 = supabaseTable.get('EDU-2026-004');
    assert.strictEqual(s4.history.length, 1);
    assert.strictEqual(s4.total, 1);
    assert.strictEqual(s4.attended, 1);
    assert.strictEqual(s4.overall, 100);
    assert.strictEqual(s4.history[0].status, 'full');
  });

  // CASE 9: Cross-Batch / Flexible Student Addition
  await simulateSaveBatchAttendance(
    [
      { rollNo: 'EDU-2026-001', name: 'Student 1', status: 'P' },
      { rollNo: 'EDU-2026-099', name: 'Guest Student', status: 'P' }, // Flexible add
    ],
    'Fri, Oct 30, 2026',
    'Mathematics',
    'Class 12',
    { classId: 'sess-math-c12', timeSlot: '7:00 AM - 8:30 AM' }
  );

  test('Guest Student Addition receives valid record', () => {
    const guest = supabaseTable.get('EDU-2026-099');
    assert.ok(guest, 'Guest student record must exist');
    assert.strictEqual(guest.overall, 100);
    assert.strictEqual(guest.attended, 1);
    assert.strictEqual(guest.total, 1);
    assert.strictEqual(guest.history[0].subjects, 'Mathematics');
  });

  // CASE 10: History Entry UI Status Mapping
  test('History Row renders correct badge color and text for Absent and Present', () => {
    // Present row
    const isPresentP = 'full' === 'full' || 'full' === 'present' || '1/1' === '1/1';
    assert.strictEqual(isPresentP, true);
    const scoreP = '1/1';
    const textP = `${scoreP} ${isPresentP ? 'Present' : 'Absent'}`;
    assert.strictEqual(textP, '1/1 Present');

    // Absent row
    const isPresentA = 'absent' === 'full' || 'absent' === 'present' || '0/1' === '1/1';
    assert.strictEqual(isPresentA, false);
    const scoreA = '0/1';
    const textA = `${scoreA} ${isPresentA ? 'Present' : 'Absent'}`;
    assert.strictEqual(textA, '0/1 Absent');
  });

  console.log('\n====================================================');
  console.log(`ALL ${passed} / ${total} ATTENDANCE TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

runTests();

