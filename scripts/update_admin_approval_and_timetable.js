const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const adminDir = 'C:/Users/madhu/code_test/private';
const masterHubJsPath = path.join(adminDir, 'js/master_hub.js');
const liveTimetableJsPath = path.join(adminDir, 'js/live_timetable.js');
const adminJsPath = path.join(adminDir, 'js/admin.js');

async function main() {
  console.log('=== Updating Admin Hub & Timetable for Exam Approval & Advance Notice ===');

  // 1. Update master_hub.js to add "Edit & Approve" button and modal
  if (fs.existsSync(masterHubJsPath)) {
    let code = fs.readFileSync(masterHubJsPath, 'utf8');

    // Replace the actions area in pending approval cards to include "Edit & Approve"
    const oldActionArea = `<div class="broadcast-actions-area">'
                            + '<button type="button" class="btn btn-sm btn-success px-3 py-2 font-weight-bold shadow-sm" onclick="window.requestApproveAnnouncement('\\'' + a.id + '\\'', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-check-circle mr-1"></i> Approve & Publish'
                            + '</button>'`;

    const newActionArea = `<div class="broadcast-actions-area" style="gap: 8px; flex-wrap: wrap;">'
                            + '<button type="button" class="btn btn-sm btn-primary px-3 py-2 font-weight-bold shadow-sm" onclick="window.openEditApprovalModal('\\'' + a.id + '\\'', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-edit mr-1"></i> Edit & Approve'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-success px-3 py-2 font-weight-bold shadow-sm" onclick="window.requestApproveAnnouncement('\\'' + a.id + '\\'', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-check-circle mr-1"></i> Quick Approve'
                            + '</button>'`;

    if (code.includes(oldActionArea)) {
      code = code.replace(oldActionArea, newActionArea);
      console.log('✓ Added Edit & Approve button to pending approval cards in master_hub.js');
    } else {
      console.log('Action area pattern already updated or not matched verbatim.');
    }

    // Append openEditApprovalModal and submitEditedApproval functions if not present
    if (!code.includes('window.openEditApprovalModal =')) {
      const editModalLogic = `
// ─── EDIT & APPROVE EXAM / ANNOUNCEMENT MODAL ─────────────────────────
window.openEditApprovalModal = async function(id, btn, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const sb = _getMasterHubSupabase();
    if (!sb) { alert('Supabase client not ready.'); return; }

    const { data: item, error } = await sb.from('announcements').select('*').eq('id', id).maybeSingle();
    if (error || !item) { alert('Failed to fetch details for approval: ' + (error?.message || 'Item not found')); return; }

    // Ensure modal container exists in DOM
    let modalEl = document.getElementById('editApprovalModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'editApprovalModal';
        modalEl.className = 'modal fade';
        modalEl.setAttribute('tabindex', '-1');
        modalEl.setAttribute('role', 'dialog');
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.innerHTML = \`
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
                <div class="modal-header text-white" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
                    <h5 class="modal-title font-weight-bold d-flex align-items-center">
                        <i class="fas fa-edit mr-2 text-primary"></i> Review, Edit & Approve Exam / Alert
                    </h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body p-4" style="background: #f8fafc;">
                    <form id="editApprovalForm" onsubmit="window.submitEditedApproval(event)">
                        <input type="hidden" id="edit_approval_id" />
                        
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">Target Class / Grade</label>
                                <select class="form-control" id="edit_approval_class" required>
                                    <option value="Class 10">Class 10</option>
                                    <option value="Class 6">Class 6</option>
                                    <option value="Class 7">Class 7</option>
                                    <option value="Class 8">Class 8</option>
                                    <option value="Class 9">Class 9</option>
                                    <option value="Class 11">Class 11</option>
                                    <option value="Class 12">Class 12</option>
                                    <option value="All Classes">All Classes</option>
                                </select>
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">Subject</label>
                                <input type="text" class="form-control" id="edit_approval_subject" placeholder="e.g. Physics" required />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="font-weight-bold small text-secondary">Exam / Alert Title</label>
                            <input type="text" class="form-control font-weight-bold" id="edit_approval_title" placeholder="e.g. Chapter 2: Sound" required />
                        </div>

                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">📅 Exam Date</label>
                                <input type="date" class="form-control" id="edit_approval_exam_date" required />
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">⏰ Exam Time Slot (Timetable)</label>
                                <input type="text" class="form-control" id="edit_approval_time" placeholder="e.g. 11:30 AM - 1:00 PM" />
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">📍 Venue / Room</label>
                                <input type="text" class="form-control" id="edit_approval_venue" placeholder="e.g. Exam Hall 1" value="Exam Hall 1" />
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">🎯 Max Marks</label>
                                <input type="number" class="form-control" id="edit_approval_marks" placeholder="100" value="100" />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="font-weight-bold small text-secondary">📚 Prescribed Syllabus</label>
                            <textarea class="form-control" id="edit_approval_syllabus" rows="2" placeholder="e.g. Sound, Wave Motion, Reflection"></textarea>
                        </div>

                        <!-- Visibility Schedule Controls -->
                        <div class="card p-3 mb-3 border-0 shadow-sm" style="background: #eff6ff; border-radius: 12px; border-left: 4px solid #2563eb !important;">
                            <h6 class="font-weight-bold text-primary mb-2">
                                <i class="fas fa-calendar-check mr-1"></i> Student Alert Visibility & Timetable Schedule
                            </h6>
                            <div class="row">
                                <div class="col-md-6 form-group mb-2">
                                    <label class="font-weight-bold small text-dark">Day to be Shown to Students</label>
                                    <input type="date" class="form-control" id="edit_approval_show_from" required />
                                    <small class="text-muted">Students will see the alert starting on this date (defaults to 1 day before exam or today).</small>
                                </div>
                                <div class="col-md-6 form-group mb-2">
                                    <label class="font-weight-bold small text-dark">When Alert Should be Stopped</label>
                                    <input type="date" class="form-control" id="edit_approval_stop_date" required />
                                    <small class="text-muted">Alert automatically disappears after this date (defaults to exam date).</small>
                                </div>
                            </div>
                        </div>

                        <div class="form-group mb-0">
                            <label class="font-weight-bold small text-secondary">Faculty Member / Submitted By</label>
                            <input type="text" class="form-control" id="edit_approval_author" placeholder="e.g. Mr. Akshay Kumar M" />
                        </div>

                        <div class="modal-footer px-0 pb-0 pt-3 border-top mt-3">
                            <button type="button" class="btn btn-secondary px-3" data-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-success px-4 font-weight-bold" id="submitApprovalBtn">
                                <i class="fas fa-check-circle mr-1"></i> Approve & Sync to Timetable
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>\`;
        document.body.appendChild(modalEl);
    }

    // Parse existing details
    const rawTitle = item.title || '';
    const desc = item.description || '';
    const classMatch = rawTitle.match(/\\[(Class\\s*\\d{1,2}|All Classes)\\]/i);
    const subMatch = rawTitle.match(/\\(([^)]+)\\)/) || desc.match(/Subject:\\s*([^\\n|]+)/i);
    const cleanTitle = rawTitle.replace(/\\[[^\\]]+\\]\\s*/g, '').replace(/\\([^)]+\\)/g, '').trim();

    const examDateMatch = desc.match(/(?:Exam\\s*Date|ExamDate|Date)\\s*:\\s*([^\\n\\r|]+)/i);
    const timeMatch = desc.match(/Time\\s*:\\s*([^\\n\\r|]+)/i);
    const venueMatch = desc.match(/(?:Venue|Room)\\s*:\\s*([^\\n\\r|]+)/i);
    const marksMatch = desc.match(/(?:Max|Total)\\s*Marks\\s*:\\s*([^\\n\\r|]+)/i);
    const syllabusMatch = desc.match(/(?:Syllabus|Chapters|Portion)\\s*:\\s*([^\\n\\r|]+)/i);
    const showFromMatch = desc.match(/(?:Show From|Start Date)\\s*:\\s*([^\\n\\r|]+)/i);
    const stopDateMatch = desc.match(/(?:Valid Until|Stop Date|Expiry)\\s*:\\s*([^\\n\\r|]+)/i);
    const authorMatch = desc.match(/(?:Submitted\\s*by|Faculty|Teacher|By)\\s*:\\s*([^\\n\\r|]+)/i);

    // Helpers to parse date to YYYY-MM-DD
    function toIso(dateInput) {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return \`\${y}-\${m}-\${day}\`;
    }

    const todayIso = toIso(new Date());
    let examDateIso = '';
    if (examDateMatch) {
        examDateIso = toIso(examDateMatch[1].trim());
    }
    if (!examDateIso) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        examDateIso = toIso(tomorrow);
    }

    // Default show from date: 1 day before exam or today
    let showFromIso = showFromMatch ? toIso(showFromMatch[1].trim()) : '';
    if (!showFromIso) {
        const examD = new Date(examDateIso);
        examD.setDate(examD.getDate() - 1);
        const dayBeforeIso = toIso(examD);
        showFromIso = dayBeforeIso >= todayIso ? dayBeforeIso : todayIso;
    }

    // Default stop date: exam date
    let stopDateIso = stopDateMatch ? toIso(stopDateMatch[1].trim()) : examDateIso;

    // Populate form fields
    document.getElementById('edit_approval_id').value = item.id;
    document.getElementById('edit_approval_class').value = classMatch ? classMatch[1] : 'Class 10';
    document.getElementById('edit_approval_subject').value = subMatch ? subMatch[1].trim() : 'Physics';
    document.getElementById('edit_approval_title').value = cleanTitle || 'Test Paper';
    document.getElementById('edit_approval_exam_date').value = examDateIso;
    document.getElementById('edit_approval_time').value = timeMatch ? timeMatch[1].trim() : '11:30 AM - 12:00 PM';
    document.getElementById('edit_approval_venue').value = venueMatch ? venueMatch[1].trim() : 'Exam Hall 1';
    document.getElementById('edit_approval_marks').value = marksMatch ? parseInt(marksMatch[1].trim(), 10) || 100 : 100;
    document.getElementById('edit_approval_syllabus').value = syllabusMatch ? syllabusMatch[1].trim() : 'Sound';
    document.getElementById('edit_approval_show_from').value = showFromIso;
    document.getElementById('edit_approval_stop_date').value = stopDateIso;
    document.getElementById('edit_approval_author').value = authorMatch ? authorMatch[1].trim() : 'Mr. Akshay Kumar M';

    // Show modal using jQuery / Bootstrap
    if (typeof $ !== 'undefined' && $('#editApprovalModal').modal) {
        $('#editApprovalModal').modal('show');
    }
};

window.submitEditedApproval = async function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('edit_approval_id').value;
    const targetClass = document.getElementById('edit_approval_class').value;
    const subject = document.getElementById('edit_approval_subject').value.trim();
    const title = document.getElementById('edit_approval_title').value.trim();
    const examDate = document.getElementById('edit_approval_exam_date').value;
    const examTime = document.getElementById('edit_approval_time').value.trim() || '11:30 AM - 12:00 PM';
    const venue = document.getElementById('edit_approval_venue').value.trim() || 'Exam Hall 1';
    const maxMarks = document.getElementById('edit_approval_marks').value || '100';
    const syllabus = document.getElementById('edit_approval_syllabus').value.trim() || 'Full Syllabus';
    const showFrom = document.getElementById('edit_approval_show_from').value;
    const stopDate = document.getElementById('edit_approval_stop_date').value;
    const author = document.getElementById('edit_approval_author').value.trim() || 'Faculty Member';

    const submitBtn = document.getElementById('submitApprovalBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Approving & Syncing...';
    }

    try {
        const sb = _getMasterHubSupabase();
        if (!sb) throw new Error('Database client not ready.');

        // Format friendly exam date (e.g. Fri, Oct 2, 2026)
        let friendlyExamDate = examDate;
        try {
            const parts = examDate.split('-');
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            friendlyExamDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } catch (_) {}

        // 1. Update announcement with edited metadata and visibility rules
        const fullTitle = \`[\${targetClass}] \${title} (\${subject})\`;
        const fullDesc = \`Exam Date: \${friendlyExamDate}\\nMax Marks: \${maxMarks}\\nVenue: \${venue}\\nSyllabus: \${syllabus}\\nShow From: \${showFrom}\\nValid Until: \${stopDate}\\nSubmitted by: \${author}\`;

        const { error: annErr } = await sb.from('announcements').update({
            title: fullTitle,
            description: fullDesc,
            time_label: 'Exam: ' + friendlyExamDate,
            icon: 'calendar',
            icon_bg: '#EFF6FF',
            icon_color: '#1A56DB',
            important: true
        }).eq('id', id);
        if (annErr) throw annErr;

        // 2. Add / Sync to Supabase 'classes' table as a Test Paper slot
        // Remove previous slot for same class, date, and subject
        await sb.from('classes')
            .delete()
            .eq('class_grade', targetClass)
            .eq('class_date', examDate)
            .eq('subject', subject);

        const timeString = \`\${examTime} • Test Paper • \${author}\`;
        const { error: clsErr } = await sb.from('classes').insert({
            roll_no: targetClass,
            class_grade: targetClass,
            subject: subject,
            class_date: examDate,
            time: timeString,
            status: 'upcoming:TP',
            published: true
        });
        if (clsErr) console.warn('Classes table sync warning:', clsErr);

        // 3. Mark pending_tests as approved if entry exists
        try {
            await sb.from('pending_tests').update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                time_str: examTime,
                venue_str: venue,
                class_tag: targetClass,
                subject: subject,
                date_str: examDate
            }).ilike('title', '%' + title + '%');
        } catch (_) {}

        // Hide modal
        if (typeof $ !== 'undefined' && $('#editApprovalModal').modal) {
            $('#editApprovalModal').modal('hide');
        }

        showBroadcastStatus('✅ Exam "' + title + '" successfully approved and synced to Timetable! Students will see it according to the visibility schedule.');
        await loadActiveBroadcasts();

        // Refresh live timetable platform if active
        if (typeof window.initLiveAppTimetable === 'function') {
            window.initLiveAppTimetable('hubTimetablePlatform');
            window.initLiveAppTimetable('liveTimetablePlatform');
        }
    } catch (err) {
        alert('Failed to approve exam: ' + (err.message || err));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Approve & Sync to Timetable';
        }
    }
};
`;
      code += '\n' + editModalLogic;
      fs.writeFileSync(masterHubJsPath, code, 'utf8');
      console.log('✓ Appended openEditApprovalModal and submitEditedApproval to master_hub.js');
    }
  }

  // 2. Update live_timetable.js so when viewing today, tomorrow's exams are shown 1 day in advance
  if (fs.existsSync(liveTimetableJsPath)) {
    let ltCode = fs.readFileSync(liveTimetableJsPath, 'utf8');

    // Update filter logic in live_timetable.js
    const oldDateFilter = `            // Date Filter
            if (_activeFilterDate === 'today' && item.class_date !== todayStr) return false;
            if (_activeFilterDate === 'tomorrow' && item.class_date !== tomorrowStr) return false;
            if (_activeFilterDate === 'upcoming' && item.class_date < todayStr) return false;
            if (_activeFilterDate === 'custom' && _activeCustomDate && item.class_date !== _activeCustomDate) return false;`;

    const newDateFilter = `            // Date Filter
            if (_activeFilterDate === 'today') {
                // If exam/test paper is tomorrow, show it 1 day before in today's view!
                const isTomorrowExam = item.class_date === tomorrowStr && (
                    (item.status && (item.status.includes('TP') || item.status.includes('test'))) ||
                    (item.time && item.time.toLowerCase().includes('test paper'))
                );
                if (item.class_date !== todayStr && !isTomorrowExam) return false;
            }
            if (_activeFilterDate === 'tomorrow' && item.class_date !== tomorrowStr) return false;
            if (_activeFilterDate === 'upcoming' && item.class_date < todayStr) return false;
            if (_activeFilterDate === 'custom' && _activeCustomDate && item.class_date !== _activeCustomDate) return false;`;

    if (ltCode.includes(oldDateFilter)) {
      ltCode = ltCode.replace(oldDateFilter, newDateFilter);
      fs.writeFileSync(liveTimetableJsPath, ltCode, 'utf8');
      console.log('✓ Updated live_timetable.js: tomorrow\'s exams are now shown 1 day before in today view');
    } else {
      console.log('Date filter in live_timetable.js already updated or modified.');
    }
  }

  // 3. Ensure the current Class 10 Physics test paper for tomorrow (2026-10-02) in Supabase is synced as a Test Paper
  try {
    const { data: existingClass } = await sb
      .from('classes')
      .select('*')
      .eq('class_grade', 'Class 10')
      .eq('class_date', '2026-10-02')
      .eq('subject', 'Physics');

    if (existingClass && existingClass.length > 0) {
      await sb
        .from('classes')
        .update({
          time: '11:30 AM - 12:00 PM • Test Paper • Mr. Akshay Kumar M',
          status: 'upcoming:TP',
          published: true,
        })
        .eq('id', existingClass[0].id);
      console.log('✓ Synced existing Class 10 Physics slot on 2026-10-02 with session type "Test Paper"');
    } else {
      await sb
        .from('classes')
        .insert({
          roll_no: 'Class 10',
          class_grade: 'Class 10',
          subject: 'Physics',
          class_date: '2026-10-02',
          time: '11:30 AM - 12:00 PM • Test Paper • Mr. Akshay Kumar M',
          status: 'upcoming:TP',
          published: true,
        });
      console.log('✓ Inserted Class 10 Physics slot on 2026-10-02 with session type "Test Paper"');
    }
  } catch (e) {
    console.warn('Supabase sync notice:', e);
  }

  console.log('=== All updates complete! ===');
}

main();
