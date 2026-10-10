const fs = require('fs');

const masterHubJsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';
const dataServicePath = 'c:/Users/madhu/eduhome/eduhome-app/lib/dataService.ts';

console.log('--- Applying Reject Announcement Fix ---');

// 1. Patch master_hub.js
let mh = fs.readFileSync(masterHubJsPath, 'utf8');

// A. Update the Reject button onclick in pending announcements card
// Old: onclick="window.requestDeleteAnnouncement('${a.id}', this, event)"
// New: onclick="window.requestRejectAnnouncement('${a.id}', this, event)"
const oldRejectBtn = `<button type="button" class="btn btn-sm btn-outline-danger btn-reject font-weight-bold" data-action="reject" onclick="window.requestDeleteAnnouncement('\\'' + a.id + '\\'', this, event)" title="Reject & Delete" style="cursor: pointer;">`;
const newRejectBtn = `<button type="button" class="btn btn-sm btn-outline-danger btn-reject font-weight-bold" data-action="reject" onclick="window.requestRejectAnnouncement('\\'' + a.id + '\\'', this, event)" title="Reject this announcement" style="cursor: pointer;">`;

if (mh.includes(oldRejectBtn)) {
    mh = mh.replace(oldRejectBtn, newRejectBtn);
    console.log('✓ Updated Reject button onclick to window.requestRejectAnnouncement');
} else {
    console.warn('⚠️ Could not find exact oldRejectBtn, trying regex...');
    mh = mh.replace(
        /class="btn btn-sm btn-outline-danger btn-reject font-weight-bold"[^>]*onclick="window\.requestDeleteAnnouncement\([^)]+\)"/,
        `class="btn btn-sm btn-outline-danger btn-reject font-weight-bold" data-action="reject" onclick="window.requestRejectAnnouncement('\\'' + a.id + '\\'', this, event)"`
    );
    console.log('✓ Replaced via regex');
}

// B. In loadActiveBroadcasts(), update filtering to separate pending, rejected, exam alerts, and regular announcements
const oldFilters = `                const pendingAnns = anns.filter(a => a.title && (a.title.includes('[PENDING APPROVAL') || a.time_label === 'Pending Approval'));
                const examAlerts = anns.filter(a => a.title && (a.title.includes('[Exam Alert') || a.title.includes('[Test Alert')) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval');
                const regularAnns = anns.filter(a => (!a.title || (!a.title.includes('[Exam Alert') && !a.title.includes('[Test Alert'))) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval');`;

const newFilters = `                const pendingAnns = anns.filter(a => a.title && (a.title.includes('[PENDING APPROVAL') || a.time_label === 'Pending Approval') && !a.title.includes('[REJECTED') && a.time_label !== 'Rejected');
                const rejectedAnns = anns.filter(a => a.title && (a.title.includes('[REJECTED') || a.time_label === 'Rejected'));
                const examAlerts = anns.filter(a => a.title && (a.title.includes('[Exam Alert') || a.title.includes('[Test Alert')) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval' && !a.title.includes('[REJECTED') && a.time_label !== 'Rejected');
                const regularAnns = anns.filter(a => (!a.title || (!a.title.includes('[Exam Alert') && !a.title.includes('[Test Alert'))) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval' && !a.title.includes('[REJECTED') && a.time_label !== 'Rejected');`;

const isCRLF = mh.includes('\r\n');
const normOldFilters = oldFilters.replace(/\r?\n/g, isCRLF ? '\r\n' : '\n');
const normNewFilters = newFilters.replace(/\r?\n/g, isCRLF ? '\r\n' : '\n');

if (mh.includes(normOldFilters)) {
    mh = mh.replace(normOldFilters, normNewFilters);
    console.log('✓ Updated announcements filters to strictly exclude rejected announcements from active feeds');
} else {
    console.warn('⚠️ Could not match oldFilters directly, searching line by line...');
    const lines = mh.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const pendingAnns = anns.filter') && lines[i + 1]?.includes('const examAlerts') && lines[i + 2]?.includes('const regularAnns')) {
            lines.splice(i, 3,
                `                const pendingAnns = anns.filter(a => a.title && (a.title.includes('[PENDING APPROVAL') || a.time_label === 'Pending Approval') && !a.title.includes('[REJECTED') && a.time_label !== 'Rejected');`,
                `                const rejectedAnns = anns.filter(a => a.title && (a.title.includes('[REJECTED') || a.time_label === 'Rejected'));`,
                `                const examAlerts = anns.filter(a => a.title && (a.title.includes('[Exam Alert') || a.title.includes('[Test Alert')) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval' && !a.title.includes('[REJECTED') && a.time_label !== 'Rejected');`,
                `                const regularAnns = anns.filter(a => (!a.title || (!a.title.includes('[Exam Alert') && !a.title.includes('[Test Alert'))) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval' && !a.title.includes('[REJECTED') && a.time_label !== 'Rejected');`
            );
            mh = lines.join(isCRLF ? '\r\n' : '\n');
            console.log('✓ Replaced announcement filters line by line');
            break;
        }
    }
}

// C. In loadActiveBroadcasts(), add Rejected Announcements History section right before "Clear All Announcements" button
const clearAllMarker = `html += '<div class="mt-3 text-right">'\n                    + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-2" id="btnClearAllAnn"`;
const normClearAllMarker = clearAllMarker.replace(/\r?\n/g, isCRLF ? '\r\n' : '\n');

const rejectedHistorySnippet = `
                // Rejected Announcements History
                if (rejectedAnns.length > 0) {
                    html += '<div class="mt-4 pt-3 border-top">'
                        + '<div class="d-flex justify-content-between align-items-center mb-2">'
                        + '<h6 class="font-weight-bold text-muted mb-0"><i class="fas fa-ban mr-1 text-danger"></i>Rejected Faculty Submissions History (' + rejectedAnns.length + ')</h6>'
                        + '</div>'
                        + '<div class="list-group shadow-sm" style="border-radius: 10px; overflow: hidden;">';

                    rejectedAnns.forEach(a => {
                        const dateStr = a.created_at ? new Date(a.created_at).toLocaleString() : '';
                        const cleanTitle = cleanApprovedTitle(a.title || '').replace(/^\\[REJECTED\\]\\s*/i, '');
                        html += '<div class="list-group-item list-group-item-action d-flex justify-content-between align-items-start p-3 bg-light border" style="opacity: 0.9;">'
                            + '<div class="flex-grow-1 mr-3">'
                            + '<div class="d-flex align-items-center mb-1" style="gap: 6px;">'
                            + '<span class="badge badge-danger font-weight-bold"><i class="fas fa-times-circle mr-1"></i>Rejected</span>'
                            + '<strong class="text-dark">' + escapeHtml(cleanTitle) + '</strong>'
                            + '</div>'
                            + '<p class="small text-muted mb-1" style="white-space: pre-line;">' + escapeHtml(a.description || '') + '</p>'
                            + '<small class="text-muted"><i class="far fa-clock mr-1"></i>' + escapeHtml(dateStr) + '</small>'
                            + '</div>'
                            + '<button type="button" class="btn btn-sm btn-outline-secondary px-2 py-1 flex-shrink-0" onclick="window.executeDeleteAnnouncement(\\'' + a.id + '\\', this, event)" title="Permanently remove from history">'
                            + '<i class="fas fa-trash-alt mr-1"></i> Remove'
                            + '</button>'
                            + '</div>';
                    });
                    html += '</div></div>';
                }
`;
const normRejectedHistorySnippet = rejectedHistorySnippet.replace(/\r?\n/g, isCRLF ? '\r\n' : '\n');

if (mh.includes(normClearAllMarker) && !mh.includes('Rejected Faculty Submissions History')) {
    mh = mh.replace(normClearAllMarker, normRejectedHistorySnippet + '\n                ' + normClearAllMarker);
    console.log('✓ Added Rejected Faculty Submissions History section to loadActiveBroadcasts');
}

// D. Add window.requestRejectAnnouncement function
const rejectFunctionCode = `
// ─── REJECT FACULTY ANNOUNCEMENT CONTROLLER ───────────────────────────────────

window.requestRejectAnnouncement = async function (id, btnElement, evt) {
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    if (!id) return;

    // Display confirmation prompt
    const confirmed = confirm('Are you sure you want to reject this announcement?');
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

        // 6. Show clear success messages
        showBroadcastStatus('Announcement rejected successfully.');
        alert('Announcement rejected successfully.');

        // 7. Refresh UI
        await loadActiveBroadcasts();
    } catch (err) {
        console.error('[MasterHub] Error rejecting announcement:', err);
        showBroadcastStatus('Failed to reject announcement: ' + (err.message || err), true);
        alert('Failed to reject announcement: ' + (err.message || err));
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = '<i class="fas fa-times mr-1"></i> Reject';
        }
    }
};
`;

if (!mh.includes('window.requestRejectAnnouncement')) {
    mh += '\n' + (isCRLF ? rejectFunctionCode.replace(/\n/g, '\r\n') : rejectFunctionCode);
    console.log('✓ Appended window.requestRejectAnnouncement to master_hub.js');
}

fs.writeFileSync(masterHubJsPath, mh, 'utf8');
console.log('✓ Successfully wrote master_hub.js');

// 2. Patch dataService.ts to exclude rejected announcements from student views
let ds = fs.readFileSync(dataServicePath, 'utf8');
const oldApprovedOnly = `          const approvedOnly = data.filter(
            (a: any) => !a.title?.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval'
          );`;

const newApprovedOnly = `          const approvedOnly = data.filter(
            (a: any) =>
              !a.title?.includes('[PENDING APPROVAL') &&
              a.time_label !== 'Pending Approval' &&
              !a.title?.includes('[REJECTED') &&
              a.time_label !== 'Rejected'
          );`;

if (ds.includes(oldApprovedOnly)) {
    ds = ds.replace(oldApprovedOnly, newApprovedOnly);
    console.log('✓ Updated approvedOnly in dataService.ts');
}

const oldAcademicPendingCheck = `            if (t.includes('[pending approval') || item.time_label === 'Pending Approval') {
              return false;
            }`;

const newAcademicPendingCheck = `            if (
              t.includes('[pending approval') ||
              item.time_label === 'Pending Approval' ||
              t.includes('[rejected') ||
              item.time_label === 'Rejected'
            ) {
              return false;
            }`;

if (ds.includes(oldAcademicPendingCheck)) {
    ds = ds.replace(oldAcademicPendingCheck, newAcademicPendingCheck);
    console.log('✓ Updated academic alert pending check in dataService.ts');
}

fs.writeFileSync(dataServicePath, ds, 'utf8');
console.log('✓ Successfully wrote dataService.ts');
