const fs = require('fs');
const path = require('path');

const masterHubJsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';
const masterHubHtmlPath = 'C:/Users/madhu/code_test/private/master_hub.html';
const adminJsPath = 'C:/Users/madhu/code_test/private/js/admin.js';
const teacherTestsPath = 'c:/Users/madhu/eduhome/eduhome-app/app/(teacher)/tests.tsx';
const dataServicePath = 'c:/Users/madhu/eduhome/eduhome-app/lib/dataService.ts';

console.log('=== Starting Complete Exam Approval, Rejection, Editing & Deletion Patch ===');

// ─── 1. PATCH MASTER_HUB.JS ──────────────────────────────────────────────────
let mh = fs.readFileSync(masterHubJsPath, 'utf8');

// 1.1 In loadActiveBroadcasts, ensure examAlerts renders Edit | Delete with flex styling
const oldExamFooterRegex = /html \+= '<div class="broadcast-card-footer d-flex justify-content-end align-items-center pt-2 border-top">'\s*\+\s*'<div class="broadcast-actions-area d-flex align-items-center" style="gap: 8px;">'[\s\S]*?'<\/div>'\s*\+\s*'<\/div>'\s*\+\s*'<\/div>';/;

const newExamFooter = `html += '<div class="broadcast-card-footer pt-2 border-top w-100" style="margin-top: 6px;">'
                            + '<div class="broadcast-actions-area d-flex align-items-center w-100" style="gap: 10px; width: 100% !important; display: flex !important;">'
                            + '<button type="button" class="btn btn-sm btn-outline-primary px-3 py-2 btn-edit-ann flex-grow-1" style="flex: 1 1 0 !important; font-weight: 600; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;" data-id="' + a.id + '" onclick="window.openEditAnnouncementModal(\\'' + a.id + '\\', this, event)" title="Edit this exam alert">'
                            + '<i class="fas fa-edit mr-1" style="pointer-events: none;"></i> Edit'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-2 btn-delete-ann flex-grow-1" style="flex: 1 1 0 !important; font-weight: 600; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\\'' + a.id + '\\', this, event)" title="Delete this exam alert">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>'
                            + '</div>'
                            + '</div>';`;

if (oldExamFooterRegex.test(mh)) {
    mh = mh.replace(oldExamFooterRegex, newExamFooter);
    console.log('✓ Updated examAlerts card footer with Edit | Delete buttons');
} else {
    console.log('⚠️ oldExamFooterRegex did not match, applying targeted string replacement...');
    const targetMarker = 'title="Edit this exam alert"';
    if (mh.includes(targetMarker)) {
        console.log('Edit button already present, ensuring flex styling...');
    }
}

// 1.2 Update Reject Announcement Controller to ask "Are you sure you want to reject this exam?"
// and ensure complete rejection flow
const rejectControllerRegex = /\/\/ ─── REJECT FACULTY ANNOUNCEMENT CONTROLLER & MODAL ───────────────────────────[\s\S]*?(?=\/\/ ─── Direct Global Delete & Approve Functions)/;

const newRejectController = `// ─── REJECT FACULTY ANNOUNCEMENT CONTROLLER & MODAL ───────────────────────────

window._pendingRejectAnnouncementId = null;

window.requestRejectAnnouncement = async function (id, btnElement, evt) {
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    if (!id) return;

    window._pendingRejectAnnouncementId = id;

    // Requirement 2: Show confirmation prompt: "Are you sure you want to reject this exam?"
    const confirmed = confirm('Are you sure you want to reject this exam?');
    if (!confirmed) {
        return;
    }

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Rejecting...';
    }

    try {
        const sb = _getMasterHubSupabase();
        if (!sb) throw new Error('Supabase database client not ready. Please refresh.');

        // 1. Fetch existing announcement details
        const { data: item, error: fetchErr } = await sb.from('announcements').select('*').eq('id', id).maybeSingle();
        if (fetchErr) throw fetchErr;
        if (!item) throw new Error('Announcement not found in database.');

        const rawTitle = item.title || '';
        const cleanTitle = cleanApprovedTitle(rawTitle);

        // 2. Update announcement in Supabase marking as Rejected
        const { error: updateErr } = await sb.from('announcements').update({
            title: '[REJECTED] ' + cleanTitle,
            description: 'Status: Rejected by Admin\\nRejected At: ' + new Date().toLocaleString() + '\\n\\nOriginal Details:\\n' + (item.description || ''),
            time_label: 'Rejected',
            important: false,
            icon: 'close-circle',
            icon_bg: '#FEE2E2',
            icon_color: '#DC2626'
        }).eq('id', id);

        if (updateErr) throw updateErr;

        // 3. Update pending_tests table if matching row exists
        try {
            await sb.from('pending_tests').update({
                status: 'rejected',
                rejected_at: new Date().toISOString()
            }).ilike('title', '%' + cleanTitle.replace(/^\\[[^\\]]+\\]\\s*/, '') + '%');
        } catch (_) {}

        // 4. Remove any pending test slot from classes table
        try {
            const classMatch = rawTitle.match(/\\[(Class\\s*[^ \\]]+)\\]/i);
            if (classMatch) {
                await sb.from('classes').delete().eq('class_grade', classMatch[1]).ilike('time', '%Test Paper%');
            }
        } catch (_) {}

        // 5. Send Supabase Realtime broadcast so student/faculty devices sync immediately
        try {
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'announcement_rejected',
                payload: { id, title: cleanTitle, rejected_at: new Date().toISOString() }
            });
        } catch (_) {}

        // 6. Close modal if open
        if (typeof window.closeRejectAnnouncementModal === 'function') {
            window.closeRejectAnnouncementModal();
        }

        // 7. Show clear status notification
        showBroadcastStatus('Exam rejected successfully.');
        alert('Exam rejected successfully.');

        // 8. Refresh UI
        await loadActiveBroadcasts();
    } catch (err) {
        console.error('[MasterHub] Error rejecting exam:', err);
        showBroadcastStatus('Failed to reject exam: ' + (err.message || err), true);
        alert('Failed to reject exam: ' + (err.message || err));
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = '<i class="fas fa-times mr-1"></i> Reject';
        }
    }
};

window.closeRejectAnnouncementModal = function () {
    if (typeof $ !== 'undefined' && typeof $('#rejectAnnouncementConfirmModal').modal === 'function') {
        $('#rejectAnnouncementConfirmModal').modal('hide');
    }
    const m = document.getElementById('rejectAnnouncementConfirmModal');
    if (m) {
        m.style.display = 'none';
        m.classList.remove('show');
    }
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('rejectAnnConfirmBackdrop');
    if (backdrop) backdrop.remove();
    window._pendingRejectAnnouncementId = null;
};

window.confirmAndExecuteRejectAnnouncement = function () {
    if (window._pendingRejectAnnouncementId) {
        window.requestRejectAnnouncement(window._pendingRejectAnnouncementId);
    }
};

`;

if (mh.includes('// ─── REJECT FACULTY ANNOUNCEMENT CONTROLLER & MODAL ───────────────────────────')) {
    mh = mh.replace(rejectControllerRegex, newRejectController);
    console.log('✓ Replaced window.requestRejectAnnouncement with confirmed exam rejection');
} else {
    mh += '\n' + newRejectController;
    console.log('✓ Appended newRejectController');
}

// 1.3 Update window.requestDeleteAnnouncement & window.executeDeleteAnnouncement
// Requirement 5: Confirmation prompt: "Are you sure you want to delete this approved exam? It will also be removed from the Student and Faculty Portals."
// Deletion from announcements, classes, academic_alerts, notifications, and broadcast.
const deleteControllerRegex = /window\.requestDeleteAnnouncement = function[\s\S]*?(?=\/\/ ─── 3\. MONTHLY FEES AUTOMATION)/;

const newDeleteController = `window.requestDeleteAnnouncement = async function (id, btnElement, evt) {
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    if (!id) return;

    const sb = _getMasterHubSupabase();
    if (!sb) {
        showBroadcastStatus('Supabase database client not ready. Please reload the page.', true);
        return;
    }

    // Check item details from loaded announcements
    let item = null;
    if (window._allLoadedAnnouncements && Array.isArray(window._allLoadedAnnouncements)) {
        item = window._allLoadedAnnouncements.find(a => String(a.id) === String(id));
    }
    if (!item) {
        try {
            const { data } = await sb.from('announcements').select('*').eq('id', id).maybeSingle();
            item = data;
        } catch (_) {}
    }

    const rawTitle = (item && item.title) || '';
    const isExam = /exam|test|test alert|exam alert|test paper/i.test(rawTitle)
        || (item && item.icon === 'calendar')
        || (item && item.time_label && item.time_label.includes('Exam'));

    // Requirement 5: Prompt confirmation before deletion
    const confirmMessage = isExam
        ? 'Are you sure you want to delete this approved exam? It will also be removed from the Student and Faculty Portals.'
        : 'Are you sure you want to delete this announcement? It will also be removed from the Student and Faculty Portals.';

    const confirmed = confirm(confirmMessage);
    if (!confirmed) {
        return;
    }

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Deleting...';
    }

    try {
        const cleanTitle = cleanApprovedTitle(rawTitle);

        // 1. Delete from announcements table
        const { error: delErr } = await sb.from('announcements').delete().eq('id', id);
        if (delErr) throw delErr;

        // 2. Clean up from classes timetable table
        let targetClass = '';
        const clsM = rawTitle.match(/\\[(Class\\s*[^ \\]]+)\\]/i);
        if (clsM) targetClass = clsM[1].trim();

        const examDateM = (item?.description || '').match(/(?:Exam\\s*Date|ExamDate|Date)\\s*:\\s*([^\\n\\r|]+)/i);
        const examDateRaw = examDateM ? examDateM[1].trim() : '';

        try {
            if (targetClass) {
                await sb.from('classes').delete()
                    .eq('class_grade', targetClass)
                    .ilike('time', '%Test Paper%');
            }
            if (cleanTitle) {
                await sb.from('classes').delete().ilike('time', '%' + cleanTitle + '%');
            }
        } catch (clsDelErr) {
            console.warn('[MasterHub] Error deleting classes entry:', clsDelErr);
        }

        // 3. Delete from academic_alerts table if present
        try {
            await sb.from('academic_alerts').delete().or('id.eq.' + id + ',id.eq.alert-' + id);
            if (cleanTitle) {
                await sb.from('academic_alerts').delete().ilike('title', '%' + cleanTitle + '%');
            }
        } catch (_) {}

        // 4. Delete from pending_tests table if present
        try {
            if (cleanTitle) {
                await sb.from('pending_tests').delete().ilike('title', '%' + cleanTitle + '%');
            }
        } catch (_) {}

        // 5. Delete from notifications table
        try {
            await sb.from('notifications').delete().eq('id', id);
        } catch (_) {}

        // 6. Broadcast Realtime event to student and faculty apps
        try {
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'exam_deleted',
                payload: { id, title: cleanTitle, classGrade: targetClass, deleted_at: new Date().toISOString() }
            });
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'announcement_deleted',
                payload: { id, title: cleanTitle, deleted_at: new Date().toISOString() }
            });
        } catch (bcErr) {
            console.warn('[MasterHub] Broadcast error on delete:', bcErr);
        }

        // 7. Remove card from DOM
        const card = document.getElementById('annCard_' + id)
            || document.getElementById('pendingAnn_' + id)
            || (btnElement ? btnElement.closest('.broadcast-card-item') : null);
        if (card) card.remove();

        showBroadcastStatus(isExam ? 'Exam deleted successfully from Admin, Student, and Faculty Portals.' : 'Announcement deleted successfully.');

        // 8. Refresh UI
        await loadActiveBroadcasts();

        // 9. Refresh live timetable if available
        if (typeof window.initLiveAppTimetable === 'function') {
            window.initLiveAppTimetable('hubTimetablePlatform');
            window.initLiveAppTimetable('liveTimetablePlatform');
        }
    } catch (err) {
        console.error('[MasterHub] Error deleting exam:', err);
        showBroadcastStatus('Failed to delete: ' + (err.message || err), true);
        alert('Failed to delete: ' + (err.message || err));
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> Delete';
        }
    }
};

window.executeDeleteAnnouncement = function (id, btn, e) {
    window.requestDeleteAnnouncement(id, btn, e);
};

window.deleteAnnouncement = function (id, btn, e) { window.requestDeleteAnnouncement(id, btn, e); };
window.deleteExamAlert = function (id, btn, e) { window.requestDeleteAnnouncement(id, btn, e); };
window._doDeleteAnnouncement = window.deleteAnnouncement;

// Global fallback event delegation
document.addEventListener('click', function (evt) {
    const delBtn = evt.target.closest('.btn-delete-ann');
    if (delBtn && !delBtn.onclick) {
        const annId = delBtn.getAttribute('data-id');
        if (annId) window.requestDeleteAnnouncement(annId, delBtn, evt);
    }
});

`;

if (deleteControllerRegex.test(mh)) {
    mh = mh.replace(deleteControllerRegex, newDeleteController);
    console.log('✓ Replaced window.requestDeleteAnnouncement with confirmed deletion and sync');
} else {
    console.warn('⚠️ Could not match deleteControllerRegex, searching alternative...');
}

// 1.4 Ensure handleSaveEditedAnnouncement updates classes table, academic_alerts, and broadcasts exam_updated
const saveEditMarker = 'window.handleSaveEditedAnnouncement = async function (e) {';
if (mh.includes(saveEditMarker)) {
    // Check if exam_updated broadcast is inside
    if (!mh.includes("event: 'exam_updated'")) {
        // Add exam_updated broadcast inside handleSaveEditedAnnouncement
        mh = mh.replace(
            "event: 'announcement_updated',",
            "event: 'announcement_updated',\n                payload: { id, title: fullTitle, updated_at: new Date().toISOString() }\n            });\n            await sb.channel('student_dashboard_realtime').send({\n                type: 'broadcast',\n                event: 'exam_updated',"
        );
        console.log('✓ Added exam_updated broadcast to handleSaveEditedAnnouncement');
    }
}

fs.writeFileSync(masterHubJsPath, mh, 'utf8');
console.log('✓ Successfully wrote updated master_hub.js');


// ─── 2. PATCH MASTER_HUB.HTML ────────────────────────────────────────────────
let html = fs.readFileSync(masterHubHtmlPath, 'utf8');

// 2.1 Update cache buster for master_hub.js
const newVersion = '20261006_v' + Date.now();
html = html.replace(/js\/master_hub\.js\?v=[^"']+/g, 'js/master_hub.js?v=' + newVersion);
console.log('✓ Updated master_hub.js cache buster to: ' + newVersion);

// 2.2 In rejectAnnouncementConfirmModal, update text to "Are you sure you want to reject this exam?"
html = html.replace(
    'Are you sure you want to reject this announcement?',
    'Are you sure you want to reject this exam?'
);
html = html.replace(
    '<h5 class="modal-title font-weight-bold mb-0" id="rejectAnnouncementConfirmModalLabel" style="font-size: 1.1rem;">\n                    <i class="fas fa-times-circle mr-2"></i>Reject Announcement',
    '<h5 class="modal-title font-weight-bold mb-0" id="rejectAnnouncementConfirmModalLabel" style="font-size: 1.1rem;">\n                    <i class="fas fa-times-circle mr-2"></i>Reject Exam Submission'
);
html = html.replace(
    'This announcement will be rejected and will not be published to students or faculty.',
    'This exam will be rejected and will not be visible to students. The faculty member will see it marked as Rejected.'
);

// 2.3 In editAnnouncementModal, add Instructions field if not already present
if (!html.includes('id="edit_ann_instructions"')) {
    const sylBlock = '<div class="form-group mb-0">\n                                <label class="font-weight-bold small text-dark">📚 Prescribed Syllabus (Chapters / Portion)</label>\n                                <textarea class="form-control" id="edit_ann_syllabus" rows="2" placeholder="e.g. Unit 6: Object Oriented Programming&#10;Unit 7: Data Structures"></textarea>\n                            </div>';
    const sylWithInstructions = sylBlock + '\n                            <div class="form-group mb-0 mt-2">\n                                <label class="font-weight-bold small text-dark">📝 Exam Instructions & Guidelines</label>\n                                <textarea class="form-control" id="edit_ann_instructions" rows="2" placeholder="e.g. Reporting time is strictly 15 minutes before exam. Bring stationery."></textarea>\n                            </div>';
    html = html.replace(sylBlock, sylWithInstructions);
    console.log('✓ Added Instructions field to editAnnouncementModal');
}

// 2.4 Ensure responsive CSS for .broadcast-actions-area .btn-edit-ann and .btn-delete-ann
const actionBtnCssOld = `.broadcast-actions-area .btn,
        .approval-actions-container .btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            white-space: nowrap !important;
            font-weight: 600 !important;
            border-radius: 6px !important;
            padding: 8px 14px !important;
            font-size: 0.88rem !important;
        }`;

const actionBtnCssNew = `.broadcast-actions-area .btn,
        .approval-actions-container .btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            white-space: nowrap !important;
            font-weight: 600 !important;
            border-radius: 6px !important;
            padding: 8px 14px !important;
            font-size: 0.88rem !important;
        }

        .broadcast-actions-area .btn-edit-ann,
        .broadcast-actions-area .btn-delete-ann {
            flex: 1 1 0 !important;
            min-width: 80px !important;
            text-align: center !important;
        }`;

if (!html.includes('.broadcast-actions-area .btn-edit-ann')) {
    html = html.replace(actionBtnCssOld, actionBtnCssNew);
    console.log('✓ Added flex styling for Edit | Delete action buttons');
}

fs.writeFileSync(masterHubHtmlPath, html, 'utf8');
console.log('✓ Successfully wrote updated master_hub.html');


// ─── 3. PATCH LIB/DATASERVICE.TS ─────────────────────────────────────────────
let ds = fs.readFileSync(dataServicePath, 'utf8');

// 3.1 Ensure DataService.getStudentTests ONLY returns approved tests (never pending or rejected)
const oldGetStudentTests = `  async getStudentTests(rollNo: string, classGrade?: string) {
    const allTests = await this.getTests();
    return allTests.map((t) => {`;

const newGetStudentTests = `  async getStudentTests(rollNo: string, classGrade?: string) {
    const allTests = await this.getTests();
    // Only return tests that have been approved by Admin (never pending or rejected)
    const approvedTests = allTests.filter((t) => {
      const status = (t.approvalStatus || '').toLowerCase();
      if (status === 'rejected' || status === 'pending_approval' || status === 'pending') {
        return false;
      }
      const rawTitle = (t.title || '').toLowerCase();
      if (rawTitle.includes('[pending') || rawTitle.includes('[rejected')) {
        return false;
      }
      return true;
    });
    return approvedTests.map((t) => {`;

if (ds.includes(oldGetStudentTests)) {
    ds = ds.replace(oldGetStudentTests, newGetStudentTests);
    console.log('✓ Updated getStudentTests to strictly filter out pending and rejected exams');
}

// 3.2 Ensure getAcademicAlert strictly excludes pending or rejected announcements
const oldAlertPendingCheck = `            if (t.includes('[pending approval') || item.time_label === 'Pending Approval') {
              return false;
            }`;

const newAlertPendingCheck = `            if (
              t.includes('[pending approval') ||
              item.time_label === 'Pending Approval' ||
              t.includes('[rejected') ||
              item.time_label === 'Rejected'
            ) {
              return false;
            }`;

if (ds.includes(oldAlertPendingCheck)) {
    ds = ds.replace(oldAlertPendingCheck, newAlertPendingCheck);
    console.log('✓ Updated getAcademicAlert in dataService.ts to exclude rejected exams');
}

// 3.3 Ensure DataService has setCachedTests helper
if (!ds.includes('async setCachedTests(')) {
    const setCachedTestsCode = `
  async setCachedTests(tests: any[]): Promise<void> {
    await setCached('teacher_tests', tests);
  },
`;
    ds = ds.replace(
        'async clearAllTests(): Promise<void> {',
        setCachedTestsCode + '  async clearAllTests(): Promise<void> {'
    );
    console.log('✓ Added setCachedTests helper to DataService');
}

fs.writeFileSync(dataServicePath, ds, 'utf8');
console.log('✓ Successfully wrote updated dataService.ts');


// ─── 4. PATCH APP/(TEACHER)/TESTS.TSX ─────────────────────────────────────────
let tt = fs.readFileSync(teacherTestsPath, 'utf8');

// 4.1 Update ExamItem interface to include approvalStatus, rejectionReason, instructions
if (!tt.includes('approvalStatus?:')) {
    tt = tt.replace(
        '  author?: string;\n}',
        '  author?: string;\n  approvalStatus?: \'pending_approval\' | \'approved\' | \'rejected\';\n  rejectionReason?: string;\n}'
    );
    console.log('✓ Updated ExamItem interface with approvalStatus in tests.tsx');
}

// 4.2 Update handleCreateTest to explicitly mark status as 'pending_approval'
if (!tt.includes("approvalStatus: 'pending_approval'")) {
    tt = tt.replace(
        "author: activeTeacher?.name || 'Faculty Member',",
        "author: activeTeacher?.name || 'Faculty Member',\n        approvalStatus: 'pending_approval',"
    );
    console.log('✓ Set approvalStatus: pending_approval on newly scheduled exam');
}

// 4.3 Add syncWithSupabase and Realtime subscription in tests.tsx
const oldUseEffectTests = `  // Load persisted tests from DataService
  useEffect(() => {
    const loadTests = async () => {
      const data = await DataService.getTests();
      if (data && data.length > 0) {
        setTests(data);
        const match = data.find((t: ExamItem) => t.classTag === selectedClass) || data[0];
        if (match) setActiveTestId(match.id);
      }
    };
    loadTests();
  }, []);`;

const newUseEffectTests = `  // Load persisted tests from DataService & synchronize status with Supabase
  useEffect(() => {
    let isMounted = true;
    const syncWithSupabase = async (currentTests: ExamItem[]) => {
      try {
        const { data: remoteAnns } = await supabase
          .from('announcements')
          .select('*')
          .or('title.ilike.%[PENDING APPROVAL]%,title.ilike.%[REJECTED]%,title.ilike.%[Test Alert]%,title.ilike.%[Exam Alert]%')
          .order('created_at', { ascending: false });

        if (!remoteAnns || remoteAnns.length === 0 || !isMounted) return;

        let modified = false;
        const updatedList = currentTests.map((test) => {
          const cleanTestTitle = test.title.replace(/^\\[[^\\]]+\\]\\s*/, '').trim().toLowerCase();
          const match = remoteAnns.find((ann: any) => {
            const rawTitle = (ann.title || '').toLowerCase();
            return rawTitle.includes(cleanTestTitle);
          });

          if (!match) return test;

          let status: 'pending_approval' | 'approved' | 'rejected' = 'approved';
          const matchTitle = match.title || '';
          if (matchTitle.includes('[REJECTED]') || match.time_label === 'Rejected') {
            status = 'rejected';
          } else if (matchTitle.includes('[PENDING APPROVAL]') || match.time_label === 'Pending Approval') {
            status = 'pending_approval';
          } else {
            status = 'approved';
          }

          const desc = match.description || '';
          const examDateM = desc.match(/(?:Exam\\s*Date|Date)\\s*:\\s*([^\\n\\r|]+)/i);
          const timeM = desc.match(/Time:\\s*([^\\n\\r|]+)/i);
          const roomM = desc.match(/(?:Venue|Room):\\s*([^\\n\\r|]+)/i);
          const marksM = desc.match(/(?:Max|Total)\\s*Marks:\\s*([^\\n\\r|]+)/i);

          const updatedDateStr = examDateM ? examDateM[1].trim() : test.dateStr;
          const updatedTimeStr = timeM ? timeM[1].trim() : (status === 'approved' && test.timeStr.includes('TBD') ? '11:30 AM - 12:00 PM' : test.timeStr);
          const updatedRoomStr = roomM ? roomM[1].trim() : (status === 'approved' && test.roomStr.includes('TBD') ? 'Exam Hall 1' : test.roomStr);
          const updatedMaxMarks = marksM ? parseInt(marksM[1].trim(), 10) || test.maxMarks : test.maxMarks;

          if (
            test.approvalStatus !== status ||
            test.dateStr !== updatedDateStr ||
            test.timeStr !== updatedTimeStr ||
            test.roomStr !== updatedRoomStr ||
            test.maxMarks !== updatedMaxMarks
          ) {
            modified = true;
            return {
              ...test,
              approvalStatus: status,
              dateStr: updatedDateStr,
              timeStr: updatedTimeStr,
              roomStr: updatedRoomStr,
              maxMarks: updatedMaxMarks,
              rejectionReason: status === 'rejected' ? desc : undefined,
            };
          }
          return test;
        });

        if (modified && isMounted) {
          setTests(updatedList);
          await DataService.setCachedTests(updatedList);
        }
      } catch (err) {
        console.warn('[TeacherTests] Supabase sync error:', err);
      }
    };

    const loadTests = async () => {
      const data = await DataService.getTests();
      if (data && data.length > 0 && isMounted) {
        setTests(data);
        const match = data.find((t: ExamItem) => t.classTag === selectedClass) || data[0];
        if (match) setActiveTestId(match.id);
        await syncWithSupabase(data);
      }
    };
    loadTests();

    // Listen to realtime exam events (approve, reject, edit, delete)
    const channel = supabase
      .channel('teacher_exam_approval_realtime')
      .on('broadcast', { event: 'announcement_rejected' }, (payload: any) => {
        const title = (payload?.payload?.title || '').toLowerCase();
        setTests((prev) =>
          prev.map((t) => {
            if (t.title.toLowerCase().includes(title) || title.includes(t.title.toLowerCase())) {
              return { ...t, approvalStatus: 'rejected' };
            }
            return t;
          })
        );
      })
      .on('broadcast', { event: 'exam_deleted' }, (payload: any) => {
        const title = (payload?.payload?.title || '').toLowerCase();
        setTests((prev) => prev.filter((t) => !t.title.toLowerCase().includes(title) && !title.includes(t.title.toLowerCase())));
      })
      .on('broadcast', { event: 'announcement_deleted' }, (payload: any) => {
        const title = (payload?.payload?.title || '').toLowerCase();
        setTests((prev) => prev.filter((t) => !t.title.toLowerCase().includes(title) && !title.includes(t.title.toLowerCase())));
      })
      .on('broadcast', { event: 'exam_updated' }, (payload: any) => {
        const p = payload?.payload;
        if (!p) return;
        setTests((prev) =>
          prev.map((t) => {
            const cleanT = t.title.toLowerCase();
            const targetT = (p.cleanTitle || p.title || '').toLowerCase();
            if (cleanT.includes(targetT) || targetT.includes(cleanT)) {
              return {
                ...t,
                approvalStatus: 'approved',
                title: p.cleanTitle || t.title,
                dateStr: p.examDate || t.dateStr,
                timeStr: p.timeSlot || t.timeStr,
                roomStr: p.venue || t.roomStr,
                maxMarks: parseInt(p.maxMarks, 10) || t.maxMarks,
              };
            }
            return t;
          })
        );
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);`;

if (tt.includes(oldUseEffectTests)) {
    tt = tt.replace(oldUseEffectTests, newUseEffectTests);
    console.log('✓ Added Supabase exam status sync and Realtime listener to tests.tsx');
}

// 4.4 In the test card UI, render the Approval Status Badge and Rejected Banner
const oldCardTop = `<View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[styles.evalPill, { backgroundColor: activeTest.isEvaluated ? '#ECFDF3' : '#FFFBEB' }]}>
                  <Text style={[styles.evalText, { color: activeTest.isEvaluated ? Colors.green : '#D97706' }]}>
                    {activeTest.isEvaluated ? 'Evaluated ✓' : 'Pending'}
                  </Text>
                </View>`;

const newCardTop = `<View style={{ alignItems: 'flex-end', gap: 6 }}>
                {/* Approval Status Badge */}
                {activeTest.approvalStatus === 'rejected' ? (
                  <View style={[styles.evalPill, { backgroundColor: '#FEE2E2', borderColor: '#FECACA', borderWidth: 1 }]}>
                    <Text style={[styles.evalText, { color: '#DC2626', fontWeight: '700' }]}>
                      ❌ Rejected by Admin
                    </Text>
                  </View>
                ) : activeTest.approvalStatus === 'pending_approval' ? (
                  <View style={[styles.evalPill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 }]}>
                    <Text style={[styles.evalText, { color: '#D97706', fontWeight: '700' }]}>
                      ⏳ Awaiting Approval
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.evalPill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1 }]}>
                    <Text style={[styles.evalText, { color: '#059669', fontWeight: '700' }]}>
                      ✅ Approved & Live
                    </Text>
                  </View>
                )}
                <View style={[styles.evalPill, { backgroundColor: activeTest.isEvaluated ? '#ECFDF3' : '#F1F5F9' }]}>
                  <Text style={[styles.evalText, { color: activeTest.isEvaluated ? Colors.green : '#64748B' }]}>
                    {activeTest.isEvaluated ? 'Evaluated ✓' : 'Pending Evaluation'}
                  </Text>
                </View>`;

if (tt.includes(oldCardTop)) {
    tt = tt.replace(oldCardTop, newCardTop);
    console.log('✓ Added Approval Status badge to activeTest card in tests.tsx');
}

// 4.5 Add rejection alert banner inside active test card if rejected
const oldMaxText = '<Text style={styles.testMax}>Maximum Marks: {activeTest.maxMarks}</Text>\n              </View>';
const newMaxText = `<Text style={styles.testMax}>Maximum Marks: {activeTest.maxMarks}</Text>
                {activeTest.approvalStatus === 'rejected' && (
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' }}>
                    <Text style={{ fontSize: 12, color: '#B91C1C', fontWeight: '600' }}>
                      ⚠️ Rejected by Admin: This exam submission was rejected and is NOT visible to students. You may reschedule or delete this test.
                    </Text>
                  </View>
                )}
                {activeTest.approvalStatus === 'pending_approval' && (
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: '#FFFBEB', borderRadius: 8, borderWidth: 1, borderColor: '#FCD34D' }}>
                    <Text style={{ fontSize: 12, color: '#B45309', fontWeight: '600' }}>
                      ⏳ Submitted for Approval: Admin review pending. This exam will automatically become visible to students once approved.
                    </Text>
                  </View>
                )}
              </View>`;

if (tt.includes(oldMaxText)) {
    tt = tt.replace(oldMaxText, newMaxText);
    console.log('✓ Added dynamic status notice banner to activeTest card');
}

// 4.6 In test tabs, display status indicator icon
const oldTabTitle = `<Text style={[styles.testTabTitle, isActive && styles.testTabTitleActive]} numberOfLines={1}>
                    {t.title.split(':')[0]}
                  </Text>`;

const newTabTitle = `<Text style={[styles.testTabTitle, isActive && styles.testTabTitleActive]} numberOfLines={1}>
                    {t.approvalStatus === 'rejected' ? '❌ ' : t.approvalStatus === 'pending_approval' ? '⏳ ' : '✅ '}{t.title.split(':')[0]}
                  </Text>`;

if (tt.includes(oldTabTitle)) {
    tt = tt.replace(oldTabTitle, newTabTitle);
    console.log('✓ Added status icon to horizontal test tabs');
}

fs.writeFileSync(teacherTestsPath, tt, 'utf8');
console.log('✓ Successfully wrote updated app/(teacher)/tests.tsx');

console.log('=== All files successfully patched! ===');
