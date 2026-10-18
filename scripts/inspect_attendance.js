const { createClient } = require('@supabase/supabase-js');
const url = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
const sb = createClient(url, key);

async function inspect() {
  const { data: att, error: errAtt } = await sb.from('attendance_records').select('*');
  console.log('--- ATTENDANCE RECORDS (count: ' + (att ? att.length : 0) + ') ---');
  if (att) {
    let nonZeroCount = 0;
    let historyCount = 0;
    att.forEach(a => {
      const hasHistory = a.history && a.history.length > 0;
      const isNonZero = a.overall > 0 || a.attended > 0 || a.total > 0;
      if (isNonZero) nonZeroCount++;
      if (hasHistory) historyCount++;
      if (isNonZero || hasHistory) {
        console.log(a.roll_no, 'overall:', a.overall, 'attended:', a.attended, 'total:', a.total, 'history len:', (a.history ? a.history.length : 0));
        if (hasHistory) {
          console.log('   SAMPLE HISTORY:', JSON.stringify(a.history.slice(0, 3)));
        }
      }
    });
    console.log(`Summary: Total records=${att.length}, nonZero=${nonZeroCount}, hasHistory=${historyCount}`);
  } else {
    console.log('errAtt:', errAtt);
  }

  const { data: cls, error: errCls } = await sb.from('classes').select('id, roll_no, class_grade, subject, time, status, class_date');
  console.log('\n--- CLASSES (count: ' + (cls ? cls.length : 0) + ') ---');
  if (cls) {
    cls.forEach(c => {
      console.log(c.id, c.roll_no, c.class_grade, c.subject, c.time, 'STATUS:', c.status, c.class_date);
    });
  } else {
    console.log('errCls:', errCls);
  }
}
inspect();
