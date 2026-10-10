const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listAllStudents() {
  const { data: students, error } = await supabase.from('students').select('*').order('roll_no');
  if (error) {
    console.error(error);
    return;
  }
  console.log('Total students in Supabase:', students.length);
  students.forEach(s => {
    console.log(`${s.roll_no} | ${s.name} | ${s.class_name} | batch: "${s.batch}"`);
  });
}

listAllStudents();
