const fs = require('fs');
const adminJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
if (!fs.existsSync(adminJsPath)) { console.log('admin.js not found.'); process.exit(0); }
let js = fs.readFileSync(adminJsPath, 'utf8');
if (js.includes('// --- PENDING TEST APPROVAL')) { console.log('Already patched.'); process.exit(0); }

const pendingTestsBlock = `
// --- PENDING TEST APPROVAL (FACULTY SUBMITTED TESTS) ---
window.loadPendingTests = async function() {
    const container = document.getElementById('pendingTestsContainer');
    if (!container) return;
    const sb = _getSupabaseClient();
    if (!sb) { container.innerHTML = '<p class="text-muted">Database not initialized.</p>'; return; }
    try {
        const { data, error } = await sb.from('pending_tests').select('*').eq('status', 'pending_approval').order('submitted_at', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-success py-2"><i class="fas fa-check-circle mr-1"></i> No pending test submissions.</p>';
            return;
        }
        container.innerHTML = '';
        data.forEach(test => {
            const card = document.createElement('div');
            card.className = 'card mb-3 border-0 shadow-sm';
            card.style.cssText = 'border-radius:12px;overflow:hidden;border-left:4px solid #8B5CF6 !important';
            const syllabusHtml = Array.isArray(test.syllabus) ? test.syllabus.map(s => '<li>' + s + '</li>').join('') : '<li>' + (test.syllabus || 'N/A') + '</li>';
            card.innerHTML =
                '<div class="card-body p-3">' +
                '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<div>' +
                '<span class="badge badge-info mr-1">' + (test.subject || '') + '</span>' +
                '<span class="badge badge-secondary">' + (test.class_tag || '') + '</span>' +
                '<h6 class="mb-0 mt-1" style="font-weight:700">' + (test.title || '') + '</h6>' +
                '<small class="text-muted">By: ' + (test.faculty_name || 'Faculty') + ' &bull; Date: ' + (test.date_str || 'TBD') + ' &bull; Max: ' + (test.max_marks || 100) + ' marks</small>' +
                '</div>' +
                '<span class="badge badge-warning">Pending</span>' +
                '</div>' +
                '<ul class="mb-2 small">' + syllabusHtml + '</ul>' +
                '<div class="row mb-2">' +
                '<div class="col-6"><label class="small font-weight-bold">Time</label><input type="text" class="form-control form-control-sm" id="test_time_' + test.test_id + '" placeholder="e.g. 4:30 PM - 6:00 PM" /></div>' +
                '<div class="col-6"><label class="small font-weight-bold">Venue / Room</label><input type="text" class="form-control form-control-sm" id="test_venue_' + test.test_id + '" placeholder="e.g. Room 204" /></div>' +
                '</div>' +
                '<div class="d-flex gap-2">' +
                '<button class="btn btn-sm btn-success" onclick="approvePendingTest(\'' + test.test_id + '\',\'' + (test.id || '') + '\',\'' + (test.class_tag || '') + '\',\'' + (test.subject || '') + '\')">' +
                '<i class="fas fa-check-circle mr-1"></i> Approve & Publish</button>' +
                '<button class="btn btn-sm btn-outline-danger" onclick="rejectPendingTest(\'' + (test.id || '') + '\')">' +
                '<i class="fas fa-times mr-1"></i> Reject</button>' +
                '</div>' +
                '</div>';
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + (e.message || e) + '</p>';
    }
};

window.approvePendingTest = async function(testId, rowId, classTag, subject) {
    const timeInput = document.getElementById('test_time_' + testId);
    const venueInput = document.getElementById('test_venue_' + testId);
    const timeStr = (timeInput && timeInput.value.trim()) || 'TBD';
    const venueStr = (venueInput && venueInput.value.trim()) || 'TBD';
    if (!confirm('Approve this test? Time: ' + timeStr + ', Venue: ' + venueStr + '. This will broadcast to students.')) return;
    const sb = _getSupabaseClient();
    if (!sb) return;
    try {
        await sb.from('pending_tests').update({ status: 'approved', approved_at: new Date().toISOString(), time_str: timeStr, venue_str: venueStr }).eq('id', rowId);
        // Publish as academic alert to student dashboard
        await sb.from('announcements').insert({
            title: '📝 Test Scheduled: ' + classTag + ' ' + subject,
            description: 'A test has been scheduled for ' + classTag + '. Date: TBD, Time: ' + timeStr + ', Venue: ' + venueStr + '. Check with your faculty for syllabus.',
            author: 'Center Admin',
            tag: 'Test Alert',
            important: true,
        });
        alert('Test approved and broadcast to students!');
        window.loadPendingTests();
    } catch (e) {
        alert('Failed to approve: ' + (e.message || e));
    }
};

window.rejectPendingTest = async function(rowId) {
    if (!confirm('Reject this test request?')) return;
    const sb = _getSupabaseClient();
    if (!sb) return;
    try {
        await sb.from('pending_tests').update({ status: 'rejected', rejected_at: new Date().toISOString() }).eq('id', rowId);
        alert('Test request rejected.');
        window.loadPendingTests();
    } catch (e) {
        alert('Failed to reject: ' + (e.message || e));
    }
};
`;
js = js.trimEnd() + '\n' + pendingTestsBlock;
fs.writeFileSync(adminJsPath, js, 'utf8');
console.log('admin.js patched: pending test approval flow added.');
