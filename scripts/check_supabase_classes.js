const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data: classes, error: errC } = await sb.from('classes').select('*');
  console.log('--- CLASSES IN SUPABASE ---', classes ? classes.length : 0, errC);
  if (classes) console.log(JSON.stringify(classes, null, 2));

  const { data: ann, error: errA } = await sb.from('announcements').select('*');
  console.log('--- ANNOUNCEMENTS IN SUPABASE ---', ann ? ann.length : 0, errA);
  if (ann) console.log(JSON.stringify(ann, null, 2));
}

main();
