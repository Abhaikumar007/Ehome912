const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data: students, error } = await supabase.from('students').select('*').limit(15);
  if (error) {
    console.error('Error fetching students:', error);
    return;
  }
  console.log('Sample students count:', students.length);
  students.forEach(s => {
    console.log(`- ${s.roll_no} | ${s.name} | class: ${s.class_name} | batch: ${s.batch}`);
  });

  // Also check classes table
  const { data: classes, error: cErr } = await supabase.from('classes').select('*').limit(15);
  if (cErr) {
    console.error('Error fetching classes:', cErr);
    return;
  }
  console.log('Sample classes count:', classes.length);
  classes.forEach(c => {
    console.log(`- id: ${c.id} | roll: ${c.roll_no} | grade: ${c.class_grade} | subj: ${c.subject} | time: ${c.time} | status: ${c.status} | published: ${c.published}`);
  });
}

check();
