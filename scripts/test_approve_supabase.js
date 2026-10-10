const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function cleanApprovedTitle(rawTitle) {
    if (!rawTitle) return 'Community Announcement';
    let t = String(rawTitle);

    let classTag = '';
    const classMatch = t.match(/\[(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i)
                    || t.match(/\[PENDING APPROVAL\s*-\s*(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i);
    if (classMatch) {
        classTag = classMatch[1];
    }

    t = t.replace(/\[PENDING APPROVAL[^\]]*\]/gi, '')
         .replace(/\[Test Alert\]/gi, '')
         .replace(/\[Exam Alert\]/gi, '');

    if (classTag) {
        const escapedClass = classTag.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        t = t.replace(new RegExp('\\[' + escapedClass + '\\]', 'gi'), '');
    }

    t = t.replace(/\s{2,}/g, ' ').trim();
    if (!t) t = 'Test Paper';

    if (classTag && !classTag.toLowerCase().includes('all classes')) {
        return '[' + classTag + '] ' + t;
    }
    return t;
}

async function testApprove() {
  const { data: item, error: fetchErr } = await sb.from('announcements').select('*').eq('id', 'b14c3bb1-edf3-4f3d-951e-1ad6eca87c40').maybeSingle();
  if (fetchErr) { console.error('Fetch err:', fetchErr); return; }
  if (!item) { console.log('Item not found'); return; }

  console.log('Item before approval:', item.title);
  const cleanTitle = cleanApprovedTitle(item.title);
  console.log('Clean Title:', cleanTitle);

  const desc = item.description || '';
  const isTestOrExam = true;

  let approvedTitle = cleanTitle;
  const classMatch = approvedTitle.match(/^\[(Class\s*[^ \]]+)\]\s*(.*)$/i);
  if (classMatch) {
      approvedTitle = '[' + classMatch[1] + '] [Test Alert] ' + classMatch[2];
  } else {
      approvedTitle = '[Test Alert] ' + approvedTitle;
  }
  console.log('Approved Title:', approvedTitle);

  // Parse exam date
  const examDateMatch = desc.match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r|]+)/i);
  const subMatch = (item.title || '').match(/\(([^)]+)\)/) || desc.match(/Subject:\s*([^\n\r|]+)/i);
  const authorMatch = desc.match(/(?:Submitted\s*by|Faculty|Teacher|By)\s*:\s*([^\n\r|]+)/i);

  const classTag = classMatch ? classMatch[1].trim() : 'Class 8';
  const subject = subMatch ? subMatch[1].trim() : 'Mathematics';
  const teacherName = authorMatch ? authorMatch[1].trim() : 'Ms. Devi';

  let examDateIso = '';
  if (examDateMatch) {
      const parsedD = new Date(examDateMatch[1].trim());
      if (!isNaN(parsedD.getTime())) {
          const y = parsedD.getFullYear();
          const m = String(parsedD.getMonth() + 1).padStart(2, '0');
          const d = String(parsedD.getDate()).padStart(2, '0');
          examDateIso = `${y}-${m}-${d}`;
      }
  }
  if (!examDateIso) {
      examDateIso = '2026-10-04';
  }
  console.log('Exam Date ISO:', examDateIso);

  // 1. Update announcement
  const { error: updErr } = await sb.from('announcements').update({
      title: approvedTitle,
      time_label: 'Just now',
      icon: 'calendar',
      icon_bg: '#EBF3FF',
      icon_color: '#1A56DB',
      important: true
  }).eq('id', item.id);
  if (updErr) console.error('Update ann error:', updErr);
  else console.log('✓ Successfully updated announcement row in Supabase');

  // 2. Sync to classes table
  await sb.from('classes').delete().eq('class_grade', classTag).eq('class_date', examDateIso).eq('subject', subject);
  const timeString = `11:30 AM - 12:00 PM • Test Paper • ${teacherName}`;
  const { error: clsErr } = await sb.from('classes').insert({
      roll_no: classTag,
      class_grade: classTag,
      subject: subject,
      class_date: examDateIso,
      time: timeString,
      status: 'upcoming:TP',
      published: true
  });
  if (clsErr) console.error('Classes sync error:', clsErr);
  else console.log('✓ Successfully inserted slot into classes timetable table in Supabase');
}

testApprove();
