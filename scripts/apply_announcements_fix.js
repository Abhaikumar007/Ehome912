const fs = require('fs');
const path = require('path');

const codeTestDir = 'C:/Users/madhu/code_test/private';
const htmlPath = path.join(codeTestDir, 'master_hub.html');
const jsPath = path.join(codeTestDir, 'js/master_hub.js');

let html = fs.readFileSync(htmlPath, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');

// 1. Create backups
fs.writeFileSync(htmlPath + '.bak_' + Date.now(), html, 'utf8');
fs.writeFileSync(jsPath + '.bak_' + Date.now(), js, 'utf8');

// 2. Add Modals to master_hub.html if not already present
const deleteModalHtml = `
<!-- Modal: Delete Active Announcement & Live Alert Confirmation -->
<div class="modal fade" id="deleteAnnouncementConfirmModal" tabindex="-1" role="dialog" aria-labelledby="deleteAnnouncementConfirmModalLabel" aria-hidden="true" style="z-index: 1080;">
    <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 450px;">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
            <div class="modal-header bg-danger text-white py-3">
                <h5 class="modal-title font-weight-bold mb-0" id="deleteAnnouncementConfirmModalLabel" style="font-size: 1.1rem;">
                    <i class="fas fa-trash-alt mr-2"></i><span id="deleteAnnouncementModalTitle">Delete Announcement</span>
                </h5>
                <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" onclick="window.closeDeleteAnnouncementModal()" style="opacity: 0.9; outline: none;">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body p-4 text-center">
                <div class="mb-3">
                    <span style="display:inline-flex; width: 62px; height: 62px; border-radius: 50%; background-color: #fee2e2; align-items: center; justify-content: center;">
                        <i class="fas fa-trash-alt fa-2x text-danger"></i>
                    </span>
                </div>
                <h6 class="font-weight-bold text-dark mb-2" style="font-size: 1.05rem;">
                    Are you sure you want to delete this alert?
                </h6>
                <div id="deleteAnnouncementConfirmDetails" class="bg-light p-3 rounded text-left border small text-dark my-3" style="display:none; line-height: 1.5;"></div>
                <p class="text-muted small mb-0">
                    This item will be permanently removed from all Student and Faculty mobile apps.
                </p>
            </div>
            <div class="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                <button type="button" class="btn btn-secondary px-3" data-dismiss="modal" onclick="window.closeDeleteAnnouncementModal()">
                    Cancel
                </button>
                <button type="button" class="btn btn-danger font-weight-bold px-4" id="confirmExecuteDeleteAnnouncementBtn" onclick="window.confirmAndExecuteDeleteAnnouncement()">
                    <i class="fas fa-trash-alt mr-1"></i> Yes, Delete
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Modal: Clear All Announcements Confirmation -->
<div class="modal fade" id="clearAllAnnouncementsConfirmModal" tabindex="-1" role="dialog" aria-labelledby="clearAllAnnouncementsConfirmModalLabel" aria-hidden="true" style="z-index: 1080;">
    <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 450px;">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
            <div class="modal-header bg-danger text-white py-3">
                <h5 class="modal-title font-weight-bold mb-0" id="clearAllAnnouncementsConfirmModalLabel" style="font-size: 1.1rem;">
                    <i class="fas fa-broom mr-2"></i>Clear All Announcements
                </h5>
                <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" onclick="window.closeClearAllAnnouncementsModal()" style="opacity: 0.9; outline: none;">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body p-4 text-center">
                <div class="mb-3">
                    <span style="display:inline-flex; width: 62px; height: 62px; border-radius: 50%; background-color: #fee2e2; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle fa-2x text-danger"></i>
                    </span>
                </div>
                <h6 class="font-weight-bold text-dark mb-2" style="font-size: 1.05rem;">
                    Clear ALL active announcements & live alerts?
                </h6>
                <div class="bg-light p-3 rounded text-left border small text-dark my-3" style="line-height: 1.5;">
                    <div class="text-danger font-weight-bold mb-1"><i class="fas fa-radiation mr-1"></i>Warning: Irreversible Action</div>
                    <div>All active broadcast notices and exam alerts will be deleted immediately. All scheduled exam entries will also be removed from Student and Faculty timetables.</div>
                </div>
                <p class="text-muted small mb-0">
                    Are you sure you want to proceed with clearing all announcements?
                </p>
            </div>
            <div class="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                <button type="button" class="btn btn-secondary px-3" data-dismiss="modal" onclick="window.closeClearAllAnnouncementsModal()">
                    Cancel
                </button>
                <button type="button" class="btn btn-danger font-weight-bold px-4" id="confirmExecuteClearAllBtn" onclick="window.confirmAndExecuteClearAllAnnouncements()">
                    <i class="fas fa-broom mr-1"></i> Yes, Clear All
                </button>
            </div>
        </div>
    </div>
</div>
`;

if (!html.includes('id="deleteAnnouncementConfirmModal"')) {
    html = html.replace('</body>', `${deleteModalHtml}\n</body>`);
    console.log('Added delete and clear all confirmation modals to master_hub.html');
}

// Bump cache buster in master_hub.html
const newVersion = Date.now().toString();
html = html.replace(/src="js\/master_hub\.js\?v=[^"]*"/g, `src="js/master_hub.js?v=${newVersion}"`);
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Saved master_hub.html with version', newVersion);

// 3. Update master_hub.js
// Replace requestDeleteAnnouncement and requestClearAll block
const deleteFunctionsBlock = `
window._pendingDeleteAnnouncementId = null;
window._pendingDeleteAnnouncementDetails = null;

window.requestDeleteAnnouncement = async function (id, btnElement, evt) {
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    if (!id) return;

    window._pendingDeleteAnnouncementId = id;

    const sb = _getMasterHubSupabase();
    let item = null;
    if (window._allLoadedAnnouncements && Array.isArray(window._allLoadedAnnouncements)) {
        item = window._allLoadedAnnouncements.find(a => String(a.id) === String(id));
    }
    if (!item && sb) {
        try {
            const { data } = await sb.from('announcements').select('*').eq('id', id).maybeSingle();
            item = data;
        } catch (_) {}
    }

    const details = _extractExamDetailsFromItem(item || { id });
    window._pendingDeleteAnnouncementDetails = details;
    const isExam = !!details.isExam;
    const cleanTitle = details.cleanTitle || (item ? cleanApprovedTitle(item.title || '') : 'this item');

    const modalEl = document.getElementById('deleteAnnouncementConfirmModal');
    const detailsEl = document.getElementById('deleteAnnouncementConfirmDetails');
    const titleEl = document.getElementById('deleteAnnouncementModalTitle');

    if (modalEl && detailsEl) {
        if (titleEl) {
            titleEl.textContent = isExam ? 'Delete Academic Exam Alert' : 'Delete Active Announcement';
        }
        let descHtml = '<strong>' + escapeHtml(cleanTitle) + '</strong>';
        if (isExam) {
            descHtml += '<div class="text-danger mt-1 small"><i class="fas fa-exclamation-circle mr-1"></i>This will also completely remove this exam from Student & Faculty Timetables.</div>';
        } else {
            descHtml += '<div class="text-muted mt-1 small"><i class="fas fa-info-circle mr-1"></i>This announcement will immediately vanish from Student and Faculty dashboards.</div>';
        }
        detailsEl.innerHTML = descHtml;
        detailsEl.style.display = 'block';

        if (typeof $ !== 'undefined' && typeof $('#deleteAnnouncementConfirmModal').modal === 'function') {
            $('#deleteAnnouncementConfirmModal').modal('show');
        } else {
            modalEl.style.display = 'block';
            modalEl.classList.add('show');
            document.body.classList.add('modal-open');
            let backdrop = document.getElementById('deleteAnnBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'deleteAnnBackdrop';
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    } else {
        const confirmMessage = isExam
            ? 'Are you sure you want to delete "' + cleanTitle + '"? It will also be removed from Student and Faculty Timetables.'
            : 'Are you sure you want to delete "' + cleanTitle + '"?';
        if (confirm(confirmMessage)) {
            await window.confirmAndExecuteDeleteAnnouncement();
        }
    }
};

window.closeDeleteAnnouncementModal = function () {
    if (typeof $ !== 'undefined' && typeof $('#deleteAnnouncementConfirmModal').modal === 'function') {
        $('#deleteAnnouncementConfirmModal').modal('hide');
    }
    const modalEl = document.getElementById('deleteAnnouncementConfirmModal');
    if (modalEl) {
        modalEl.style.display = 'none';
        modalEl.classList.remove('show');
    }
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('deleteAnnBackdrop');
    if (backdrop) backdrop.remove();
    if (typeof $ !== 'undefined') $('.modal-backdrop').remove();
    window._pendingDeleteAnnouncementId = null;
    window._pendingDeleteAnnouncementDetails = null;
};

window.confirmAndExecuteDeleteAnnouncement = async function () {
    const id = window._pendingDeleteAnnouncementId;
    if (!id) {
        window.closeDeleteAnnouncementModal();
        return;
    }

    const confirmBtn = document.getElementById('confirmExecuteDeleteAnnouncementBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Deleting...';
    }

    try {
        const sb = _getMasterHubSupabase();
        if (!sb) throw new Error('Database client not ready. Please reload the page.');

        const details = window._pendingDeleteAnnouncementDetails || {};
        const isExam = !!details.isExam;
        const cleanTitle = details.cleanTitle || '';

        // 1. Delete matching timetable slots from classes table
        if (typeof _deleteExamSlotsFromClasses === 'function') {
            await _deleteExamSlotsFromClasses(sb, details);
        }

        // 2. Delete from announcements table
        const { error: delErr } = await sb.from('announcements').delete().eq('id', id);
        if (delErr) throw delErr;

        // 3. Delete from notifications table if present
        try {
            await sb.from('notifications').delete().eq('id', id);
        } catch (_) {}

        // 4. Purge orphan test paper rows
        if (typeof _purgeOrphanedTestPaperClasses === 'function') {
            await _purgeOrphanedTestPaperClasses(sb);
        }

        // 5. Broadcast Realtime events to both student and faculty apps
        try {
            const payload = {
                id,
                title: cleanTitle,
                classGrade: details.targetClass,
                examDate: details.examDateIso,
                subject: details.subject,
                deleted_at: new Date().toISOString()
            };
            await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'exam_deleted', payload });
            await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'announcement_deleted', payload });
            await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'classes_changed', payload });
            await sb.channel('teacher_classes_realtime').send({ type: 'broadcast', event: 'exam_deleted', payload });
            await sb.channel('teacher_classes_realtime').send({ type: 'broadcast', event: 'classes_changed', payload });
        } catch (bcErr) {
            console.warn('[MasterHub] Broadcast error on delete:', bcErr);
        }

        // 6. Remove card from DOM immediately
        const card = document.getElementById('annCard_' + id)
            || document.getElementById('pendingAnn_' + id);
        if (card) card.remove();

        window.closeDeleteAnnouncementModal();
        showBroadcastStatus(isExam ? 'Exam deleted successfully from Admin, Student, and Faculty Portals & Timetable.' : 'Announcement deleted successfully.');

        // 7. Refresh UI
        await loadActiveBroadcasts();

        // 8. Refresh live timetable
        if (typeof window.initLiveAppTimetable === 'function') {
            window.initLiveAppTimetable('hubTimetablePlatform');
            window.initLiveAppTimetable('liveTimetablePlatform');
        }
    } catch (err) {
        console.error('[MasterHub] Error deleting announcement:', err);
        showBroadcastStatus('Failed to delete: ' + (err.message || err), true);
        alert('Failed to delete: ' + (err.message || err));
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> Yes, Delete';
        }
    }
};

window.requestClearAll = function (btnElement, evt) {
    if (evt) { evt.preventDefault(); evt.stopPropagation(); }

    const modalEl = document.getElementById('clearAllAnnouncementsConfirmModal');
    if (modalEl) {
        if (typeof $ !== 'undefined' && typeof $('#clearAllAnnouncementsConfirmModal').modal === 'function') {
            $('#clearAllAnnouncementsConfirmModal').modal('show');
        } else {
            modalEl.style.display = 'block';
            modalEl.classList.add('show');
            document.body.classList.add('modal-open');
            let backdrop = document.getElementById('clearAllAnnBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'clearAllAnnBackdrop';
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    } else {
        if (confirm('Are you sure you want to clear ALL announcements and exam alerts? All scheduled exams will also be removed from Student and Faculty timetables.')) {
            window.confirmAndExecuteClearAllAnnouncements();
        }
    }
};

window.closeClearAllAnnouncementsModal = function () {
    if (typeof $ !== 'undefined' && typeof $('#clearAllAnnouncementsConfirmModal').modal === 'function') {
        $('#clearAllAnnouncementsConfirmModal').modal('hide');
    }
    const modalEl = document.getElementById('clearAllAnnouncementsConfirmModal');
    if (modalEl) {
        modalEl.style.display = 'none';
        modalEl.classList.remove('show');
    }
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('clearAllAnnBackdrop');
    if (backdrop) backdrop.remove();
    if (typeof $ !== 'undefined') $('.modal-backdrop').remove();
};

window.confirmAndExecuteClearAllAnnouncements = async function () {
    const sb = _getMasterHubSupabase();
    if (!sb) {
        alert('Database connection unavailable. Please reload the page.');
        return;
    }

    const confirmBtn = document.getElementById('confirmExecuteClearAllBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Clearing Everything...';
    }

    try {
        // 1. Delete all rows from announcements
        const { error: annErr } = await sb.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (annErr) throw annErr;

        // 2. Delete test paper classes from timetable
        try {
            await sb.from('classes').delete().or('time.ilike.%Test Paper%,status.ilike.%TP%');
        } catch (_) {}

        // 3. Purge orphaned test paper classes if helper exists
        if (typeof _purgeOrphanedTestPaperClasses === 'function') {
            await _purgeOrphanedTestPaperClasses(sb);
        }

        // 4. Send Realtime broadcasts
        try {
            await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'announcement_deleted', payload: { all: true } });
            await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'exam_deleted', payload: { all: true } });
            await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: { all: true } });
            await sb.channel('teacher_classes_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: { all: true } });
        } catch (_) {}

        window.closeClearAllAnnouncementsModal();
        showBroadcastStatus('All announcements and exam alerts removed successfully.');

        // 5. Refresh UI
        await loadActiveBroadcasts();
        if (typeof window.initLiveAppTimetable === 'function') {
            window.initLiveAppTimetable('hubTimetablePlatform');
            window.initLiveAppTimetable('liveTimetablePlatform');
        }
    } catch (err) {
        console.error('[MasterHub] Error clearing announcements:', err);
        alert('Failed to clear: ' + (err.message || err));
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-broom mr-1"></i> Yes, Clear All';
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

// Locate start and end of delete/clear all block in js
const startIdx = js.indexOf('window.requestDeleteAnnouncement = async function');
const endMarker = '// ─── 3. MONTHLY FEES AUTOMATION';
const endIdx = js.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    js = js.slice(0, startIdx) + deleteFunctionsBlock.trim() + '\n\n' + js.slice(endIdx);
    console.log('Replaced delete & clear all block in master_hub.js');
} else {
    console.error('Could not find boundaries for delete functions block in master_hub.js');
}

// 4. Fix Edit Button delegation (line ~3902)
const oldEditDelegation = `document.addEventListener('click', function (evt) {
    const editBtn = evt.target.closest('.btn-edit-ann');
    if (editBtn) {
        const annId = editBtn.getAttribute('data-id');
        if (annId) {
            window.openEditAnnouncementModal(annId, editBtn, evt);
        }
    }
});`;

const newEditDelegation = `document.addEventListener('click', function (evt) {
    const editBtn = evt.target.closest('.btn-edit-ann');
    if (editBtn && !editBtn.onclick) {
        const annId = editBtn.getAttribute('data-id');
        if (annId) {
            window.openEditAnnouncementModal(annId, editBtn, evt);
        }
    }
});`;

if (js.includes(oldEditDelegation)) {
    js = js.replace(oldEditDelegation, newEditDelegation);
    console.log('Fixed edit button delegation to avoid duplicate event triggers');
} else {
    console.log('Old edit delegation string not exact match, checking pattern');
    js = js.replace(/document\.addEventListener\('click',\s*function\s*\(evt\)\s*\{\s*const editBtn = evt\.target\.closest\('\.btn-edit-ann'\);\s*if\s*\(editBtn\)\s*\{/g, "document.addEventListener('click', function (evt) {\n    const editBtn = evt.target.closest('.btn-edit-ann');\n    if (editBtn && !editBtn.onclick) {");
}

// 5. Enhance closeEditAnnouncementModal to ensure backdrops are cleaned
const oldCloseModal = `window.closeEditAnnouncementModal = function () {
    if (typeof $ !== 'undefined' && typeof $('#editAnnouncementModal').modal === 'function') {
        $('#editAnnouncementModal').modal('hide');
    }
    const m = document.getElementById('editAnnouncementModal');
    if (m) {
        m.style.display = 'none';
        m.classList.remove('show');
    }
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('editAnnBackdrop');
    if (backdrop) backdrop.remove();
};`;

const newCloseModal = `window.closeEditAnnouncementModal = function () {
    if (typeof $ !== 'undefined' && typeof $('#editAnnouncementModal').modal === 'function') {
        $('#editAnnouncementModal').modal('hide');
    }
    const m = document.getElementById('editAnnouncementModal');
    if (m) {
        m.style.display = 'none';
        m.classList.remove('show');
    }
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('editAnnBackdrop');
    if (backdrop) backdrop.remove();
    if (typeof $ !== 'undefined') $('.modal-backdrop').remove();
};`;

if (js.includes(oldCloseModal)) {
    js = js.replace(oldCloseModal, newCloseModal);
    console.log('Enhanced closeEditAnnouncementModal backdrop cleanup');
}

fs.writeFileSync(jsPath, js, 'utf8');
console.log('Successfully updated master_hub.js');
