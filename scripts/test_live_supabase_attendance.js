const { createClient } = require('@supabase/supabase-js');
const assert = require('assert');

const url = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
const supabase = createClient(url, key);

const TEST_ROLL = 'EDU-TEST-ATT-001';

async function runLiveTest() {
  console.log('=== TESTING REAL SUPABASE ATTENDANCE PERSISTENCE & EDITING ===\n');

  try {
    // 1. Clean any previous test record
    await supabase.from('attendance_records').delete().eq('roll_no', TEST_ROLL);

    // 2. Initial Submission: Mark Absent
    console.log('1. Submitting initial attendance: Absent (0/1)...');
    const initialHistory = [{
      date: 'Fri, Oct 30, 2026',
      subjects: 'Mathematics',
      time: '7:00 AM - 8:30 AM',
      classId: 'test-class-live-1',
      sessionType: 'Regular Class',
      score: '0/1',
      status: 'absent',
      class: 'Class 12',
    }];

    const { error: insErr } = await supabase.from('attendance_records').upsert({
      roll_no: TEST_ROLL,
      overall: 0,
      attended: 0,
      total: 1,
      today_subjects: [{
        id: 'test-class-live-1',
        classId: 'test-class-live-1',
        subject: 'Mathematics',
        time: '7:00 AM - 8:30 AM',
        sessionType: 'Regular Class',
        status: 'absent',
        date: 'Fri, Oct 30, 2026',
      }],
      history: initialHistory,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'roll_no' });

    assert.ifError(insErr);

    // Fetch and check
    const { data: rec1 } = await supabase.from('attendance_records').select('*').eq('roll_no', TEST_ROLL).single();
    assert.strictEqual(rec1.attended, 0);
    assert.strictEqual(rec1.total, 1);
    assert.strictEqual(rec1.overall, 0);
    assert.strictEqual(rec1.history.length, 1);
    assert.strictEqual(rec1.history[0].status, 'absent');
    console.log('   ✓ Initial Absent record verified in Supabase!');

    // 3. Correction / Edit: Teacher changes student from Absent to Present
    console.log('2. Submitting correction: Present (1/1)...');
    const updatedHistoryEntry = {
      date: 'Fri, Oct 30, 2026',
      subjects: 'Mathematics',
      time: '7:00 AM - 8:30 AM',
      classId: 'test-class-live-1',
      sessionType: 'Regular Class',
      score: '1/1',
      status: 'full',
      class: 'Class 12',
    };

    // Filter old entry matching the session slot
    const prevHistory = (rec1.history || []).filter(h => h.classId !== 'test-class-live-1');
    const newHistory = [updatedHistoryEntry, ...prevHistory];
    const newAttended = newHistory.filter(h => h.status === 'full' || h.score === '1/1').length;
    const newTotal = newHistory.length;
    const newOverall = Math.round((newAttended / newTotal) * 100);

    const { error: updErr } = await supabase.from('attendance_records').upsert({
      roll_no: TEST_ROLL,
      overall: newOverall,
      attended: newAttended,
      total: newTotal,
      today_subjects: [{
        id: 'test-class-live-1',
        classId: 'test-class-live-1',
        subject: 'Mathematics',
        time: '7:00 AM - 8:30 AM',
        sessionType: 'Regular Class',
        status: 'present',
        date: 'Fri, Oct 30, 2026',
      }],
      history: newHistory,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'roll_no' });

    assert.ifError(updErr);

    // Fetch and check again
    const { data: rec2 } = await supabase.from('attendance_records').select('*').eq('roll_no', TEST_ROLL).single();
    assert.strictEqual(rec2.attended, 1, 'Attended must be 1');
    assert.strictEqual(rec2.total, 1, 'Total must remain 1 (no duplicate)');
    assert.strictEqual(rec2.overall, 100, 'Overall must be 100%');
    assert.strictEqual(rec2.history.length, 1, 'History length must be 1');
    assert.strictEqual(rec2.history[0].status, 'full');
    assert.strictEqual(rec2.history[0].score, '1/1');
    assert.strictEqual(rec2.today_subjects[0].status, 'present');
    console.log('   ✓ Corrected record verified in Supabase! Total remained 1, Attended updated to 1, Overall to 100%!');

    // 4. Cleanup
    await supabase.from('attendance_records').delete().eq('roll_no', TEST_ROLL);
    console.log('3. Test record cleaned up.');

    console.log('\n====================================================');
    console.log('LIVE SUPABASE ATTENDANCE TEST PASSED 100%!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('LIVE TEST ERROR:', err);
    // Cleanup on error
    await supabase.from('attendance_records').delete().eq('roll_no', TEST_ROLL);
    process.exit(1);
  }
}

runLiveTest();

