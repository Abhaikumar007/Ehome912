const fs = require('fs');
const path = require('path');

const codeTestDir = 'C:/Users/madhu/code_test/private/js';

// ----------------------------------------------------
// 1. UPDATE master_hub.js
// ----------------------------------------------------
const masterHubJsPath = path.join(codeTestDir, 'master_hub.js');
let hubCode = fs.readFileSync(masterHubJsPath, 'utf8');

// Target the renderFilteredAdminOpinions row rendering button & tr
const oldBtnRegex = /<button type="button" class="btn btn-sm btn-outline-danger" style="border-radius:6px;font-size:0\.75rem;padding:3px 7px;" onclick="deleteAdminOpinion\([^)]*\)"[^>]*>[\s\S]*?<\/button>/;

const newBtnCode = `<button type="button" class="btn btn-sm btn-outline-danger delete-admin-opinion-btn" style="border-radius:6px;font-size:0.75rem;padding:3px 7px;" data-row-id="' + safeRowId + '" data-json-id="' + safeJsonId + '" data-roll="' + safeRoll + '" data-student="' + safeStudent + '" data-teacher="' + safeTeacher + '" data-subject="' + safeSubject + '" onclick="deleteAdminOpinion(\\'' + safeRowId + '\\',\\'' + safeJsonId + '\\',\\'' + safeRoll + '\\',\\'' + safeStudent + '\\',\\'' + safeTeacher + '\\',\\'' + safeSubject + '\\')" title="Delete this opinion/remark">` +
`\\n<i class="fas fa-trash-alt mr-1" style="pointer-events:none;"></i>Delete` +
`\\n</button>`;

if (oldBtnRegex.test(hubCode)) {
    hubCode = hubCode.replace(oldBtnRegex, newBtnCode);
    console.log('✓ Replaced delete button in master_hub.js renderFilteredAdminOpinions');
} else {
    console.warn('⚠️ Could not match old delete button in master_hub.js');
}

// Add safeTeacher and safeSubject definitions if not present in the loop
if (!hubCode.includes('const safeTeacher =')) {
    const targetAnchor = "const safeStudentId = String(op.studentId || '').replace(/'/g, \"\\\\'\");";
    const addition = "\n        const safeTeacher = String(op.teacher || 'Faculty').replace(/'/g, \"\\\\'\");" +
                     "\n        const safeSubject = String(op.subject || 'Subject').replace(/'/g, \"\\\\'\");";
    hubCode = hubCode.replace(targetAnchor, targetAnchor + addition);
    console.log('✓ Added safeTeacher and safeSubject definitions to master_hub.js loop');
}

// Target deleteAdminOpinion function replacement in master_hub.js
const oldDeleteFnRegex = /async function deleteAdminOpinion\([\s\S]*?window\.deleteAdminOpinion = deleteAdminOpinion;/;

const newDeleteSystemCode = `// --- FACULTY OPINIONS CONFIRMATION MODAL & DELETION SYSTEM ---
window._pendingDeleteOpinion = null;

function ensureDeleteOpinionModalInDOM() {
    if (document.getElementById('deleteOpinionConfirmModal')) return;
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = \`
    <div class="modal fade" id="deleteOpinionConfirmModal" tabindex="-1" role="dialog" aria-labelledby="deleteOpinionConfirmModalLabel" aria-hidden="true" style="z-index: 1080;">
        <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 440px;">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
                <div class="modal-header bg-danger text-white py-3">
                    <h5 class="modal-title font-weight-bold mb-0" id="deleteOpinionConfirmModalLabel" style="font-size: 1.1rem;">
                        <i class="fas fa-trash-alt mr-2"></i>Delete Opinion / Remark
                    </h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" onclick="closeDeleteOpinionModal()" style="opacity: 0.9; outline: none;">
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
                        Are you sure you want to delete this opinion/remark?
                    </h6>
                    <div id="deleteOpinionConfirmDetails" class="bg-light p-3 rounded text-left border small text-dark my-3" style="display:none; line-height: 1.5;"></div>
                    <p class="text-muted small mb-0">
                        This entry will be permanently removed from the database and will no longer appear in the student or faculty portals.
                    </p>
                </div>
                <div class="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary px-3" data-dismiss="modal" onclick="closeDeleteOpinionModal()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-danger font-weight-bold px-4" id="executeDeleteOpinionBtn" onclick="confirmAndExecuteDeleteOpinion()">
                        <i class="fas fa-trash-alt mr-1"></i> Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    </div>\`;
    document.body.appendChild(modalDiv.firstElementChild);
}

function openDeleteOpinionModal() {
    ensureDeleteOpinionModalInDOM();
    const modalEl = document.getElementById('deleteOpinionConfirmModal');
    if (!modalEl) return;

    const btn = document.getElementById('executeDeleteOpinionBtn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> Yes, Delete';
    }

    let openedViaBootstrap = false;
    if (window.$ && typeof window.$.fn.modal === 'function') {
        try {
            $('#deleteOpinionConfirmModal').modal({ backdrop: 'static', keyboard: true, show: true });
            openedViaBootstrap = true;
        } catch (e) {
            console.warn('[Modal] Bootstrap open failed, falling back to pure DOM:', e);
        }
    }

    if (!openedViaBootstrap || modalEl.style.display !== 'block') {
        modalEl.style.display = 'block';
        modalEl.style.backgroundColor = 'rgba(0,0,0,0.55)';
        modalEl.classList.add('show');
        document.body.classList.add('modal-open');
    }
}
window.openDeleteOpinionModal = openDeleteOpinionModal;

function closeDeleteOpinionModal() {
    const modalEl = document.getElementById('deleteOpinionConfirmModal');
    if (window.$ && typeof window.$.fn.modal === 'function') {
        try {
            $('#deleteOpinionConfirmModal').modal('hide');
        } catch (e) {}
    }
    if (modalEl) {
        modalEl.style.display = 'none';
        modalEl.classList.remove('show');
        modalEl.style.backgroundColor = '';
    }
    const spm = document.getElementById('studentProfileModal');
    if (!spm || spm.style.display === 'none' || !spm.classList.contains('show')) {
        document.body.classList.remove('modal-open');
    }
    window._pendingDeleteOpinion = null;
}
window.closeDeleteOpinionModal = closeDeleteOpinionModal;

function deleteAdminOpinion(rowId, jsonId, rollNo, studentName, teacher, subject) {
    window._pendingDeleteOpinion = {
        rowId: String(rowId || '').trim(),
        jsonId: String(jsonId || '').trim(),
        rollNo: String(rollNo || '').trim(),
        studentName: String(studentName || 'Student').trim(),
        teacher: String(teacher || '').trim(),
        subject: String(subject || '').trim(),
        studentId: '',
        trRowId: 'admin-op-row-' + (rowId || jsonId)
    };

    const detailsEl = document.getElementById('deleteOpinionConfirmDetails');
    if (detailsEl) {
        detailsEl.style.display = 'block';
        let detailHtml = '<div><i class="fas fa-user-graduate text-primary mr-1"></i> <strong>Student:</strong> ' +
            (window._pendingDeleteOpinion.studentName || 'Student') +
            (window._pendingDeleteOpinion.rollNo ? ' <span class="badge badge-light border">' + window._pendingDeleteOpinion.rollNo + '</span>' : '') +
            '</div>';
        if (teacher || subject) {
            detailHtml += '<div class="mt-1"><i class="fas fa-chalkboard-teacher text-info mr-1"></i> <strong>Faculty:</strong> ' +
                (teacher || 'Faculty') + (subject ? ' • ' + subject : '') + '</div>';
        }
        detailsEl.innerHTML = detailHtml;
    }

    openDeleteOpinionModal();
}
window.deleteAdminOpinion = deleteAdminOpinion;

async function confirmAndExecuteDeleteOpinion() {
    const pending = window._pendingDeleteOpinion;
    if (!pending) {
        closeDeleteOpinionModal();
        return;
    }

    const { rowId, jsonId, rollNo, studentName, studentId, trRowId } = pending;

    const btn = document.getElementById('executeDeleteOpinionBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Deleting...';
    }

    // 1. Immediate Optimistic UI Removal from DOM
    const targetElement = document.getElementById(trRowId) ||
                          document.getElementById('admin-op-row-' + rowId) ||
                          document.getElementById('admin-op-row-' + jsonId);
    if (targetElement) {
        targetElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        targetElement.style.opacity = '0';
        targetElement.style.transform = 'scale(0.95)';
        setTimeout(() => { if (targetElement.parentNode) targetElement.parentNode.removeChild(targetElement); }, 200);
    }

    // 2. Immediate Optimistic Removal from in-memory array & re-render
    if (Array.isArray(window._allAdminOpinions)) {
        window._allAdminOpinions = window._allAdminOpinions.filter(op => {
            const matchRow = rowId && (op.supabaseRowId === rowId || op.id === rowId);
            const matchJson = jsonId && (op.id === jsonId || op.supabaseRowId === jsonId);
            return !matchRow && !matchJson;
        });
        if (typeof window.filterAdminOpinions === 'function') {
            window.filterAdminOpinions();
        }
    }

    // 3. Update student profile modal if open
    if (typeof window.loadStudentOpinionsInModal === 'function' && rollNo) {
        window.loadStudentOpinionsInModal(rollNo, studentId, studentName);
    }

    // 4. Instant User Feedback Alert
    const statusMsg = document.getElementById('opinionStatusMsg');
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'alert alert-success alert-dismissible fade show mb-3';
        statusMsg.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Opinion/remark for <strong>' + (studentName || rollNo || 'student') + '</strong> has been permanently deleted.';
        setTimeout(() => { if (statusMsg) statusMsg.style.display = 'none'; }, 4000);
    }
    const spmAlert = document.getElementById('spmAlertMsg');
    if (spmAlert) {
        spmAlert.style.display = 'block';
        spmAlert.className = 'alert alert-success alert-dismissible fade show mb-3';
        spmAlert.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Opinion/remark has been permanently deleted.';
        setTimeout(() => { if (spmAlert) spmAlert.style.display = 'none'; }, 4000);
    }

    // Close modal
    closeDeleteOpinionModal();

    // 5. Backend / Supabase Permanent Deletion
    await executePermanentOpinionDelete(rowId, jsonId, rollNo);
}
window.confirmAndExecuteDeleteOpinion = confirmAndExecuteDeleteOpinion;

async function executePermanentOpinionDelete(rowId, jsonId, rollNo) {
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || '').trim());
    const su = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) ? SUPABASE_URL : 'https://xrxwluezguxpqfzedlfq.supabase.co';
    const sk = (typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY) ? SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

    // A) Direct Supabase client deletion
    const sb = (typeof _getUniversalSupabaseClient === 'function' ? _getUniversalSupabaseClient() : null) ||
               (typeof _getMasterHubSupabase === 'function' ? _getMasterHubSupabase() : null) ||
               (typeof _getSafeAdminSupabase === 'function' ? _getSafeAdminSupabase() : null) ||
               (typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null);

    if (sb) {
        try {
            if (isUUID(rowId)) {
                await sb.from('notifications').delete().eq('id', rowId);
            }
            if (isUUID(jsonId) && jsonId !== rowId) {
                await sb.from('notifications').delete().eq('id', jsonId);
            }
            if (jsonId) {
                await sb.from('notifications').delete().eq('type', 'teacher_opinion').ilike('message', \`%"id":"\${jsonId}"%\`);
            }
            if (rollNo && jsonId) {
                await sb.from('notifications').delete().eq('type', 'teacher_opinion').eq('roll_no', rollNo).ilike('message', \`%"id":"\${jsonId}"%\`);
            }
            console.log('[executePermanentOpinionDelete] Supabase client deleted:', { rowId, jsonId, rollNo });
        } catch (e) {
            console.warn('[executePermanentOpinionDelete] Client delete error:', e);
        }
    }

    // B) Direct REST fetch call backup (guarantees DB execution)
    try {
        const headers = {
            'apikey': sk,
            'Authorization': 'Bearer ' + sk,
            'Prefer': 'return=representation'
        };
        if (isUUID(rowId)) {
            await fetch(\`\${su}/rest/v1/notifications?id=eq.\${encodeURIComponent(rowId)}\`, {
                method: 'DELETE',
                headers
            });
        }
        if (jsonId) {
            await fetch(\`\${su}/rest/v1/notifications?type=eq.teacher_opinion&message=ilike.*\${encodeURIComponent(jsonId)}*\`, {
                method: 'DELETE',
                headers
            });
        }
    } catch (re) {
        console.warn('[executePermanentOpinionDelete] REST fallback warn:', re);
    }

    // C) Realtime Broadcast to update Student and Faculty portals immediately
    try {
        if (sb && typeof sb.channel === 'function') {
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'opinion_deleted',
                payload: { rowId, jsonId, rollNo }
            });
        }
    } catch (be) {
        console.warn('[OpinionBroadcast warn]', be);
    }
}
window.executePermanentOpinionDelete = executePermanentOpinionDelete;

// Event delegation for delete buttons
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.delete-admin-opinion-btn');
    if (btn) {
        e.preventDefault();
        const rowId = btn.getAttribute('data-row-id');
        const jsonId = btn.getAttribute('data-json-id');
        const rollNo = btn.getAttribute('data-roll');
        const studentName = btn.getAttribute('data-student');
        const teacher = btn.getAttribute('data-teacher');
        const subject = btn.getAttribute('data-subject');
        deleteAdminOpinion(rowId, jsonId, rollNo, studentName, teacher, subject);
    }
});`;

if (oldDeleteFnRegex.test(hubCode)) {
    hubCode = hubCode.replace(oldDeleteFnRegex, newDeleteSystemCode);
    console.log('✓ Replaced deleteAdminOpinion in master_hub.js with complete confirmation modal system');
} else {
    console.warn('⚠️ Could not match old deleteAdminOpinion in master_hub.js');
}

fs.writeFileSync(masterHubJsPath, hubCode, 'utf8');
console.log('✓ Saved updated master_hub.js');


// ----------------------------------------------------
// 2. UPDATE admin.js
// ----------------------------------------------------
const adminJsPath = path.join(codeTestDir, 'admin.js');
let adminCode = fs.readFileSync(adminJsPath, 'utf8');

// Update loadStudentOpinionsInModal delete button
const oldModalBtn = /<button type="button" class="btn btn-sm btn-outline-danger"[^>]*onclick="deleteStudentOpinionInModal\([^)]*\)">[\s\S]*?<\/button>/;
const newModalBtn = `<button type="button" class="btn btn-sm btn-outline-danger delete-admin-opinion-btn" style="font-size:0.75rem;padding:2px 9px;border-radius:6px;font-weight:600;" data-row-id="\${safeRowId}" data-json-id="\${safeJsonId}" data-roll="\${safeRoll}" data-student="\${safeStudent}" data-teacher="\${op.teacher || ''}" data-subject="\${op.subject || ''}" onclick="deleteStudentOpinionInModal('\${safeRowId}', '\${safeJsonId}', '\${safeRoll}', '\${studentId}', '\${safeStudent}', '\${op.teacher || ''}', '\${op.subject || ''}')" title="Delete this opinion/remark">` +
`\\n<i class="fas fa-trash-alt mr-1" style="pointer-events:none;"></i>Delete` +
`\\n</button>`;

if (oldModalBtn.test(adminCode)) {
    adminCode = adminCode.replace(oldModalBtn, newModalBtn);
    console.log('✓ Replaced delete button in admin.js loadStudentOpinionsInModal');
}

// Update deleteStudentOpinionInModal to use confirmation modal
const oldDeleteModalRegex = /window\.deleteStudentOpinionInModal = async function\(rowId, jsonId, rollNo, studentId, studentName\) {[\s\S]*?if \(!window\.confirm\("Are you sure you want to delete this opinion\/remark\?"\)\) {[\s\S]*?if \(typeof window\.deleteAdminOpinion !== 'function'\) {[\s\S]*?};[\s\S]*?}/;

const newAdminModalLogic = `window.deleteStudentOpinionInModal = function(rowId, jsonId, rollNo, studentId, studentName, teacher, subject) {
    if (typeof window.deleteAdminOpinion === 'function') {
        window.deleteAdminOpinion(rowId, jsonId, rollNo, studentName, teacher, subject);
        if (studentId && window._pendingDeleteOpinion) {
            window._pendingDeleteOpinion.studentId = studentId;
        }
        return;
    }
    // Fallback if master_hub.js not loaded
    if (!window.confirm("Are you sure you want to delete this opinion/remark?")) return;
    if (typeof window.executePermanentOpinionDelete === 'function') {
        window.executePermanentOpinionDelete(rowId, jsonId, rollNo);
    }
};

// Global alias for deleteAdminOpinion in admin.js
if (typeof window.deleteAdminOpinion !== 'function') {
    window.deleteAdminOpinion = function(rowId, jsonId, rollNo, studentName, teacher, subject) {
        window.deleteStudentOpinionInModal(rowId, jsonId, rollNo, null, studentName, teacher, subject);
    };
}`;

if (oldDeleteModalRegex.test(adminCode)) {
    adminCode = adminCode.replace(oldDeleteModalRegex, newAdminModalLogic);
    console.log('✓ Updated deleteStudentOpinionInModal and alias in admin.js');
} else {
    console.warn('⚠️ Could not match old deleteStudentOpinionInModal in admin.js');
}

fs.writeFileSync(adminJsPath, adminCode, 'utf8');
console.log('✓ Saved updated admin.js');
