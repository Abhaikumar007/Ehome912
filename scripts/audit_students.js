const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: supaStudents, error } = await sb.from('students').select('*').order('roll_no');
  if (error) {
    console.error('Error fetching students:', error);
    return;
  }
  console.log(`Auditing ${supaStudents.length} students:`);
  const corrupted = [];
  supaStudents.forEach(s => {
    const hasCorruptBatch = /state/i.test(s.batch) && /cbse/i.test(s.batch);
    if (hasCorruptBatch) {
      corrupted.push(s);
      console.log(`[CORRUPT] ${s.roll_no} | ${s.name} | class: ${s.class_name} | batch: "${s.batch}"`);
    } else {
      console.log(`[OK]      ${s.roll_no} | ${s.name} | class: ${s.class_name} | batch: "${s.batch}"`);
    }
  });
  console.log(`\nTotal corrupted batch strings: ${corrupted.length}`);
}
run();

