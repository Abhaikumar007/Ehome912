const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCols() {
  const { data, error } = await supabase.from('classes').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log('Classes keys:', Object.keys(data[0] || {}));
  }

  const { data: sData, error: sErr } = await supabase.from('students').select('*').limit(1);
  if (sErr) {
    console.error(sErr);
  } else {
    console.log('Students keys:', Object.keys(sData[0] || {}));
  }
}

checkCols();
