const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectColumns() {
  const { data, error } = await sb.from('classes').select('*').limit(1);
  if (error) {
    console.error('Error fetching class:', error);
    return;
  }
  if (data && data[0]) {
    console.log('Columns in classes table:');
    console.log(Object.keys(data[0]));
    console.log('Sample row:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No rows in classes table.');
  }
}

inspectColumns();
