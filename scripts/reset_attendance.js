// Script to reset all student attendance records to 0 in Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function resetAllAttendance() {
  console.log('🔄 Fetching all students from Supabase...');
  const { data: students, error: sErr } = await sb.from('students').select('roll_no, name');
  if (sErr) {
    console.error('❌ Error fetching students:', sErr);
    process.exit(1);
  }

  console.log(`Resetting attendance to 0 for ${students.length} students...`);

  let count = 0;
  for (const s of students) {
    const { error } = await sb.from('attendance_records').upsert({
      roll_no: s.roll_no,
      overall: 0,
      attended: 0,
      total: 0,
      today_subjects: [],
      history: [],
      updated_at: new Date().toISOString()
    }, { onConflict: 'roll_no' });

    if (!error) {
      count++;
    } else {
      console.warn(`⚠️ Failed for ${s.roll_no} (${s.name}):`, error.message);
    }
  }

  // Also reset class session status to 'upcoming'
  try {
    await sb.from('classes').update({ status: 'upcoming' }).neq('status', 'upcoming');
  } catch (e) {}

  console.log(`✅ Done! Successfully reset attendance to 0 for ${count} / ${students.length} students.`);
}

resetAllAttendance();
