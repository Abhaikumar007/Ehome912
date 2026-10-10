const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncHashes() {
  const { data, error } = await sb.from('students').select('roll_no, pin');
  if (error || !data) {
    console.error('Fetch error:', error);
    process.exit(1);
  }

  const filePath = path.join(__dirname, '..', 'lib', 'studentsRoster.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  let updatedCount = 0;
  for (const s of data) {
    const roll = s.roll_no;
    const pin = s.pin;
    const pattern = new RegExp(`rollNo:\\s*['"]${roll}['"],\\s*pin:\\s*['"][^'"]+['"]`, 'g');
    if (pattern.test(content)) {
      content = content.replace(pattern, `rollNo: '${roll}', pin: '${pin}'`);
      updatedCount++;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${updatedCount} students in studentsRoster.ts with salted hashes!`);
}

syncHashes();
