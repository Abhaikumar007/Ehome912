const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const UPDATES = [
  { roll_no: 'EDU-2026-007', batch: 'Class 12 (CBSE)' },
  { roll_no: 'EDU-2026-016', batch: 'Class 12 (CBSE)' }, // Nandana
  { roll_no: 'EDU-2026-017', batch: 'Class 12 (CBSE)' }, // Karun
  { roll_no: 'EDU-2026-018', batch: 'Class 12 (CBSE)' }, // Aadidev
  { roll_no: 'EDU-2026-024', batch: 'Class 10 (CBSE)' }, // Ganga
  { roll_no: 'EDU-2026-026', batch: 'Class 10 (CBSE)' }, // Alecia Mathew
  { roll_no: 'EDU-2026-027', batch: 'Class 9 (CBSE)' },  // Krishnanandh
  { roll_no: 'EDU-2026-031', batch: 'Class 9 (CBSE)' },  // Achyuth
  { roll_no: 'EDU-2026-032', batch: 'Class 11 (CBSE)' }, // Hiba
  { roll_no: 'EDU-2026-034', batch: 'Class 12 (CBSE)' }, // Vyshnavi
  { roll_no: 'EDU-2026-036', batch: 'Class 10 (CBSE)' }, // Cristine
];

async function fixBatches() {
  console.log('Cleaning up corrupted batches in Supabase students table...');
  for (const item of UPDATES) {
    const { data, error } = await sb
      .from('students')
      .update({ batch: item.batch })
      .eq('roll_no', item.roll_no)
      .select();

    if (error) {
      console.error(`Failed to update ${item.roll_no}:`, error);
    } else {
      console.log(`Successfully updated ${item.roll_no} -> batch: "${item.batch}"`);
    }
  }

  // Verify
  console.log('\n--- VERIFYING CLEANUP ---');
  const { data: allStudents } = await sb.from('students').select('roll_no, name, class_name, batch').order('roll_no');
  let remainingCorrupt = 0;
  allStudents.forEach(s => {
    if (/state/i.test(s.batch) && /cbse/i.test(s.batch)) {
      console.log(`STILL CORRUPT: ${s.roll_no} | ${s.batch}`);
      remainingCorrupt++;
    }
  });
  console.log(`Remaining corrupt batches: ${remainingCorrupt}`);
}

fixBatches();

