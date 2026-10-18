const { createClient } = require('@supabase/supabase-js');
const url = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
const sb = createClient(url, key);

async function resetAllAttendance() {
  console.log('Fetching all students from Supabase...');
  const { data: students, error: stuErr } = await sb.from('students').select('roll_no');
  if (stuErr) {
    console.error('Error fetching students:', stuErr);
    return;
  }
  console.log(`Found ${students.length} students in Supabase.`);

  // 1. Fetch current attendance_records
  const { data: attRecords, error: attErr } = await sb.from('attendance_records').select('id, roll_no, overall, attended, total, history, today_subjects');
  if (attErr) {
    console.error('Error fetching attendance_records:', attErr);
    return;
  }
  console.log(`Found ${attRecords.length} attendance_records in Supabase.`);

  // 2. Reset all existing attendance_records to 0 with empty history and empty today_subjects
  console.log('Resetting all existing attendance_records to zero and empty history...');
  const updatePromises = attRecords.map(rec => {
    return sb.from('attendance_records').update({
      overall: 0,
      attended: 0,
      total: 0,
      history: [],
      today_subjects: [],
      updated_at: new Date().toISOString()
    }).eq('id', rec.id);
  });
  await Promise.all(updatePromises);
  console.log(`Successfully reset ${attRecords.length} attendance_records to 0.`);

  // 3. For any student without an attendance_record, ensure a default 0 record exists
  const existingRolls = new Set(attRecords.map(r => String(r.roll_no).toUpperCase().trim()));
  const missingStudents = students.filter(s => !existingRolls.has(String(s.roll_no).toUpperCase().trim()));
  if (missingStudents.length > 0) {
    console.log(`Creating default 0 attendance records for ${missingStudents.length} students...`);
    const newRecords = missingStudents.map(s => ({
      roll_no: s.roll_no,
      overall: 0,
      attended: 0,
      total: 0,
      history: [],
      today_subjects: [],
      updated_at: new Date().toISOString()
    }));
    await sb.from('attendance_records').insert(newRecords);
    console.log(`Created ${newRecords.length} default records.`);
  }

  // 4. Verify the reset
  const { data: verified, error: vErr } = await sb.from('attendance_records').select('roll_no, overall, attended, total, history, today_subjects');
  if (vErr) {
    console.error('Verification error:', vErr);
    return;
  }
  const nonZero = verified.filter(v => v.overall > 0 || v.attended > 0 || v.total > 0 || (v.history && v.history.length > 0) || (v.today_subjects && v.today_subjects.length > 0));
  console.log(`\n--- VERIFICATION RESULT ---`);
  console.log(`Total attendance records: ${verified.length}`);
  console.log(`Non-zero / has-history records: ${nonZero.length}`);
  if (nonZero.length === 0) {
    console.log('SUCCESS: All attendance records are 100% reset and defaulted to ZERO!');
  } else {
    console.warn('WARNING: Some records still have non-zero data:', nonZero);
  }
}

resetAllAttendance();
