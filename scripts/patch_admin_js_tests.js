const fs = require('fs');
const p = 'C:/Users/madhu/code_test/private/js/admin.js';

if (fs.existsSync(p)) {
  let code = fs.readFileSync(p, 'utf8');

  // When approving pending test in admin.js, also sync to Supabase 'classes' table as a Test Paper
  const oldApprovePattern = `        await sb.from('pending_tests').update({ status: 'approved', approved_at: new Date().toISOString(), time_str: timeStr, venue_str: venueStr }).eq('id', rowId);
        // Publish as academic alert to student dashboard
        await sb.from('announcements').insert({
            title: '📝 Test Scheduled: ' + classTag + ' ' + subject,
            description: 'A test has been scheduled for ' + classTag + '. Date: TBD, Time: ' + timeStr + ', Venue: ' + venueStr + '. Check with your faculty for syllabus.',
            author: 'Center Admin',
            tag: 'Test Alert',
            important: true,
        });`;

  const newApproveLogic = `        await sb.from('pending_tests').update({ status: 'approved', approved_at: new Date().toISOString(), time_str: timeStr, venue_str: venueStr }).eq('id', rowId);
        
        // 1. Fetch test details for clean sync
        const { data: ptData } = await sb.from('pending_tests').select('*').eq('id', rowId).maybeSingle();
        const examDate = (ptData && ptData.date_str) || new Date().toISOString().split('T')[0];
        const teacherName = (ptData && ptData.faculty_name) || 'Faculty Member';
        const marks = (ptData && ptData.max_marks) || 100;
        const syl = Array.isArray(ptData?.syllabus) ? ptData.syllabus.join(', ') : (ptData?.syllabus || 'Full Syllabus');

        // 2. Publish as academic alert to student dashboard
        await sb.from('announcements').insert({
            title: '[' + classTag + '] ' + (ptData?.title || 'Test Paper') + ' (' + subject + ')',
            description: 'Exam Date: ' + examDate + '\\nMax Marks: ' + marks + '\\nVenue: ' + venueStr + '\\nSyllabus: ' + syl + '\\nSubmitted by: ' + teacherName,
            time_label: 'Exam: ' + examDate,
            author: teacherName,
            icon: 'calendar',
            icon_bg: '#EFF6FF',
            icon_color: '#1A56DB',
            tag: 'Test Alert',
            important: true,
        });

        // 3. Sync to classes table as Test Paper slot so it appears in student & faculty timetables
        await sb.from('classes').delete().eq('class_grade', classTag).eq('class_date', examDate).eq('subject', subject);
        await sb.from('classes').insert({
            roll_no: classTag,
            class_grade: classTag,
            subject: subject,
            class_date: examDate,
            time: (timeStr && timeStr !== 'TBD' ? timeStr : '11:30 AM - 12:00 PM') + ' • Test Paper • ' + teacherName,
            status: 'upcoming:TP',
            published: true,
        });`;

  if (code.includes(oldApprovePattern)) {
    code = code.replace(oldApprovePattern, newApproveLogic);
    fs.writeFileSync(p, code, 'utf8');
    console.log('✓ Successfully patched approvePendingTest in admin.js to sync to timetable');
  } else {
    console.log('approvePendingTest pattern already updated or not matched verbatim in admin.js');
  }
}
