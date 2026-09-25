const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanSupabaseClasses() {
  console.log('--- Cleaning Supabase classes table ---');
  const { data: currentClasses, error: fetchErr } = await sb.from('classes').select('*');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  console.log(`Found ${currentClasses.length} total rows in classes table.`);

  // Find duplicates: group by normalized subject, date, and class_grade
  const seen = new Map();
  const duplicateIds = [];

  for (const c of currentClasses) {
    const normGrade = (c.class_grade || c.roll_no || '').replace(/[^0-9]/g, '');
    const normSubject = (c.subject || '').trim().toLowerCase();
    const normDate = (c.class_date || '').trim();
    const key = `${normGrade}_${normSubject}_${normDate}`;

    if (seen.has(key)) {
      duplicateIds.push(c.id);
    } else {
      seen.set(key, c);
    }
  }

  console.log(`Duplicates to remove: ${duplicateIds.length}`);
  for (const id of duplicateIds) {
    await sb.from('classes').delete().eq('id', id);
    console.log(`Deleted duplicate class id: ${id}`);
  }

  // Ensure any remaining rows have normalized roll_no and time
  const { data: updatedClasses } = await sb.from('classes').select('*');
  console.log('Cleaned classes in Supabase:', updatedClasses);
}

async function updateAdminJs() {
  const adminJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
  if (!fs.existsSync(adminJsPath)) {
    console.error(`admin.js not found at ${adminJsPath}`);
    return;
  }

  let code = fs.readFileSync(adminJsPath, 'utf8');

  // Replace shareTimetableToApp with clean, single-entry-per-class implementation
  const newFunctionCode = `    // --- SHARE TIMETABLE TO MOBILE APP (STUDENT & FACULTY SYNC) ---
    window.shareTimetableToApp = async function () {
        const entries = (typeof timetableEntries !== 'undefined' && timetableEntries.length > 0) 
            ? timetableEntries 
            : (window.timetableEntries || []);

        if (!entries || entries.length === 0) {
            alert("Please add at least one timetable entry to share.");
            return;
        }

        const shareBtn = document.getElementById('shareAppBtn');
        if (shareBtn) {
            shareBtn.disabled = true;
            shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Sharing to App...';
        }

        try {
            const sb = _getSupabaseClient();
            if (!sb) {
                alert("Database connection not ready. Please check your network and try again.");
                if (shareBtn) {
                    shareBtn.disabled = false;
                    shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Share Timetable to Mobile App';
                }
                return;
            }

            function to12Hr(t) {
                if (!t) return '';
                const parts = t.split(':');
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1] || '0', 10);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                return h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
            }

            const rowsToInsert = [];
            const announcementsToInsert = [];

            for (const entry of entries) {
                let timeStr = '';
                if (entry.startTime && entry.endTime) {
                    timeStr = to12Hr(entry.startTime) + ' - ' + to12Hr(entry.endTime);
                } else if (entry.startTime) {
                    timeStr = to12Hr(entry.startTime);
                } else {
                    timeStr = 'Scheduled';
                }

                const rawCls = String(entry.class || '').trim();
                const gradeStr = rawCls.startsWith('Class') ? rawCls : 'Class ' + rawCls;

                // 1. Cleanly delete any existing entries for this class, date and subject
                // (Clears both class-level entries and legacy per-student rows)
                await sb.from('classes')
                    .delete()
                    .eq('class_grade', gradeStr)
                    .eq('class_date', entry.date)
                    .eq('subject', entry.subject);

                // Also delete if stored with roll_no = gradeStr
                await sb.from('classes')
                    .delete()
                    .eq('roll_no', gradeStr)
                    .eq('class_date', entry.date)
                    .eq('subject', entry.subject);

                // 2. Insert EXACTLY ONE row per class session (not per-student duplicates!)
                rowsToInsert.push({
                    roll_no: gradeStr,
                    class_grade: gradeStr,
                    subject: entry.subject,
                    time: timeStr,
                    status: 'upcoming',
                    published: true,
                    class_date: entry.date,
                });

                announcementsToInsert.push({
                    title: '🗓️ Timetable: ' + gradeStr + ' - ' + entry.subject,
                    description: 'Date: ' + formatDateFriendly(entry.date) + ' | Time: ' + timeStr + ' | Venue: ' + (entry.location || 'In Center') + ' (' + (entry.board || 'Both') + ' Board). Check your schedule tab.',
                    author: 'Center Admin',
                    tag: 'Timetable',
                    important: true,
                });
            }

            // 1. Insert into Supabase classes table
            const { error: classErr } = await sb.from('classes').insert(rowsToInsert);
            if (classErr) {
                console.error('Error inserting classes:', classErr);
                throw classErr;
            }

            // 2. Broadcast announcement so mobile alerts fire instantly
            if (announcementsToInsert.length > 0) {
                await sb.from('announcements').insert(announcementsToInsert);
            }

            alert('✅ Timetable Successfully Shared to Mobile App!\\n\\n' + rowsToInsert.length + ' class schedule session(s) published.\\nAll students in the class and faculty will see this schedule on their live dashboard.');
        } catch (e) {
            console.error('Failed to share timetable:', e);
            alert("Failed to share timetable to mobile app: " + (e.message || e));
        } finally {
            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Share Timetable to Mobile App';
            }
        }
    };`;

  // Locate the window.shareTimetableToApp block and replace it
  const startIdx = code.indexOf('window.shareTimetableToApp = async function () {');
  if (startIdx === -1) {
    console.error('Could not find window.shareTimetableToApp in admin.js');
    return;
  }

  // Find where it ends: look for the closing of that function
  // It is followed by "// --- ATTENDANCE PAGE ---" or "if (document.getElementById('attendanceClassSelect'))"
  const endMarker = "// --- ATTENDANCE PAGE ---";
  const endIdx = code.indexOf(endMarker, startIdx);
  if (endIdx === -1) {
    console.error('Could not find end marker for shareTimetableToApp');
    return;
  }

  const before = code.slice(0, startIdx);
  const after = code.slice(endIdx);

  const updatedCode = before + newFunctionCode + '\n\n' + after;
  fs.writeFileSync(adminJsPath, updatedCode, 'utf8');
  console.log('Successfully updated C:\\Users\\madhu\\code_test\\private\\js\\admin.js');
}

async function run() {
  await cleanSupabaseClasses();
  await updateAdminJs();
}

run();
