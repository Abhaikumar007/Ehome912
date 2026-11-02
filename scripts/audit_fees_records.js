const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://xrxwluezguxpqfzedlfq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI');

async function auditFees() {
  const { data, error } = await sb.from('fees_records').select('*').order('roll_no');
  if (error) { console.error(error); return; }
  console.log(`Auditing ${data.length} fee records:`);
  data.forEach(r => {
    const pmts = Array.isArray(r.recent_payments) ? r.recent_payments : [];
    console.log(`${r.roll_no} | due: ${r.current_due} | date: ${r.due_date} | payments: ${pmts.length} | loyalty:`, JSON.stringify(r.loyalty_months));
  });
}
auditFees();
