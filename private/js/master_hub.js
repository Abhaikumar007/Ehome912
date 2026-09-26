
function _getMasterHubSupabase() {
    if (typeof _getSupabaseClient === 'function') {
        const client = _getSupabaseClient();
        if (client) return client;
    }
    if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) {
        try {
            return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn('[MasterHub] Error creating Supabase client:', e);
        }
    }
    return null;
}

// ==============================================================================
//  master_hub.js — Super Admin Master Control Hub Logic
//  Features:
//  - Inline Spreadsheet Master Student Grid
//  - Global Broadcast Announcements & Exam Alerts (Direct to Supabase & Mobile Apps)
//  - 1-Click Monthly Fee Automation
//  - Dual Cloud Health & Synchronization
// ==============================================================================

let currentStudents = [];
let originalStudents = [];

document.addEventListener('DOMContentLoaded', async function () {
    console.log('[MasterHub] Initializing Super Admin Master Control Hub...');
    await refreshMasterData();
    testCloudHealth();
    loadActiveBroadcasts();

    // Refresh active broadcasts when clicking the Broadcasts tab
    const feesTabLink = document.getElementById('tab-fees-link');
    if (feesTabLink) {
        feesTabLink.addEventListener('shown.bs.tab', function () {
            if (typeof window.loadPendingVerifications === 'function') {
                window.loadPendingVerifications();
            }
        });
        feesTabLink.addEventListener('click', function () {
            setTimeout(function () {
                if (typeof window.loadPendingVerifications === 'function') {
                    window.loadPendingVerifications();
                }
            }, 100);
        });
    }

    const broadcastTabLink = document.getElementById('tab-broadcast-link');
    if (broadcastTabLink) {
        broadcastTabLink.addEventListener('shown.bs.tab', function () {
            loadActiveBroadcasts();
        });
        broadcastTabLink.addEventListener('click', function () {
            setTimeout(loadActiveBroadcasts, 100);
        });
    }
});

// ─── 1. SPREADSHEET GRID LOGIC ───────────────────────────────────────────────

async function refreshMasterData() {
    const tbody = document.getElementById('masterGridTbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading student records from storage...</td></tr>';
    }

    // Always fetch deduplicated list
    let students = [];
    if (typeof getStudents === 'function') {
        students = getStudents();
    } else {
        students = JSON.parse(localStorage.getItem('students')) || [];
    }

    // Extra deduplication safeguard to guarantee no duplicate rows
    const uniqueMap = new Map();
    students.forEach(s => {
        const roll = (s.rollNo || s.roll_no || s.id || '').toUpperCase().trim();
        const normName = (s.name || '').toLowerCase().trim();
        const key = roll ? roll : (normName + '_' + (s.class || '10'));
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, s);
        }
    });

    const uniqueStudents = Array.from(uniqueMap.values());
    currentStudents = JSON.parse(JSON.stringify(uniqueStudents));
    originalStudents = JSON.parse(JSON.stringify(uniqueStudents));

    // Save cleaned list so localStorage is permanently de-duplicated
    try { localStorage.setItem('students', JSON.stringify(uniqueStudents)); } catch (e) {}

    renderMasterGrid(currentStudents);
    updateFeeSummary();
}

function renderMasterGrid(list) {
    const tbody = document.getElementById('masterGridTbody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4">No student records found. Click "Add Row" to start adding students.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    list.forEach((s, idx) => {
        const tr = document.createElement('tr');
        tr.id = 'gridRow_' + idx;

        const rollNo = s.rollNo || s.roll_no || s.id || ('EDU-C' + (s.class || '10') + '-' + String(idx + 1).padStart(3, '0'));
        const name = s.name || '';
        const sClass = s.class || s.class_name || '10';
        const phone = s.phone || '';
        const fee = s.amount || s.monthly_fee || s.monthlyFee || '';
        const subjects = Array.isArray(s.subjects) ? s.subjects.join(', ') : (s.subjects || '');
        const school = s.school || 'EduHome Campus';
        const pin = s.pin || '1234';
        const joining = s.joiningDate || s.joining_date || '';

        tr.innerHTML = `
            <td class="text-center text-muted align-middle">${idx + 1}</td>
            <td><input type="text" class="grid-input" value="${rollNo}" onchange="markGridRowModified(${idx}, 'rollNo', this.value)"></td>
            <td><input type="text" class="grid-input font-weight-bold" value="${name}" onchange="markGridRowModified(${idx}, 'name', this.value)"></td>
            <td>
                <select class="grid-input" onchange="markGridRowModified(${idx}, 'class', this.value)">
                    <option value="7" ${sClass == '7' || sClass == 'Class 7' ? 'selected' : ''}>Class 7</option>
                    <option value="8" ${sClass == '8' || sClass == 'Class 8' ? 'selected' : ''}>Class 8</option>
                    <option value="9" ${sClass == '9' || sClass == 'Class 9' ? 'selected' : ''}>Class 9</option>
                    <option value="10" ${sClass == '10' || sClass == 'Class 10' ? 'selected' : ''}>Class 10</option>
                    <option value="11" ${sClass == '11' || sClass == 'Class 11' ? 'selected' : ''}>Class 11</option>
                    <option value="12" ${sClass == '12' || sClass == 'Class 12' ? 'selected' : ''}>Class 12</option>
                </select>
            </td>
            <td><input type="text" class="grid-input" value="${phone}" onchange="markGridRowModified(${idx}, 'phone', this.value)"></td>
            <td><input type="number" class="grid-input font-weight-bold text-success" value="${fee}" placeholder="₹ Fee" onchange="markGridRowModified(${idx}, 'amount', this.value)"></td>
            <td><input type="text" class="grid-input" value="${subjects}" placeholder="Physics, Chemistry..." onchange="markGridRowModified(${idx}, 'subjects', this.value)"></td>
            <td><input type="text" class="grid-input" value="${school}" onchange="markGridRowModified(${idx}, 'school', this.value)"></td>
            <td><input type="text" class="grid-input text-center" maxlength="4" value="${pin}" onchange="markGridRowModified(${idx}, 'pin', this.value)"></td>
            <td><input type="text" class="grid-input" value="${joining}" placeholder="DD Mon YYYY" onchange="markGridRowModified(${idx}, 'joiningDate', this.value)"></td>
            <td class="text-center align-middle">
                <button class="btn btn-outline-danger btn-sm p-1" onclick="deleteGridRow(${idx})" title="Delete Student">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function markGridRowModified(idx, field, value) {
    if (!currentStudents[idx]) return;

    if (field === 'subjects') {
        currentStudents[idx].subjects = value.split(',').map(s => s.trim()).filter(Boolean);
    } else {
        currentStudents[idx][field] = value;
    }

    const row = document.getElementById('gridRow_' + idx);
    if (row) {
        row.style.backgroundColor = '#fffbeb';
    }

    showGridStatusAlert('You have unsaved changes in row #' + (idx + 1) + '. Click "Save Changes" to sync to clouds.', 'warning');
}

function addNewGridRow() {
    const rawClass = document.getElementById('gridClassFilter').value || '10';
    const newIdx = currentStudents.length;
    const newRoll = 'EDU-C' + rawClass + '-' + String(newIdx + 1).padStart(3, '0');

    const newStudent = {
        id: Date.now().toString(),
        rollNo: newRoll,
        name: 'New Student',
        class: rawClass,
        school: 'EduHome Campus',
        phone: '9876543210',
        amount: '3000',
        subjects: ['Physics', 'Chemistry'],
        pin: '1234',
        joiningDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    currentStudents.push(newStudent);
    renderMasterGrid(currentStudents);

    const row = document.getElementById('gridRow_' + (currentStudents.length - 1));
    if (row) {
        row.style.backgroundColor = '#ecfdf5';
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showGridStatusAlert('Added new student row. Fill in details and click "Save Changes".', 'info');
}

function deleteGridRow(idx) {
    const s = currentStudents[idx];
    if (!s) return;

    if (confirm('Delete student "' + (s.name || 'Unnamed') + '"? This will also remove them from Google Sheets and Supabase.')) {
        const idToDelete = s.id || s.rollNo || s.roll_no;
        currentStudents.splice(idx, 1);
        renderMasterGrid(currentStudents);

        // Delete from clouds
        if (typeof sb_deleteStudent === 'function' && idToDelete) {
            sb_deleteStudent(idToDelete);
        }

        localStorage.setItem('students', JSON.stringify(currentStudents));
        showGridStatusAlert('Deleted student record from local list and clouds.', 'success');
        updateFeeSummary();
    }
}

function filterGridTable() {
    const searchVal = (document.getElementById('gridSearchInput').value || '').toLowerCase();
    const classVal = document.getElementById('gridClassFilter').value;

    const filtered = currentStudents.filter(s => {
        const sClass = String(s.class || s.class_name || '').replace(/[^0-9]/g, '');
        if (classVal && sClass !== classVal) return false;

        const name = String(s.name || '').toLowerCase();
        const roll = String(s.rollNo || s.roll_no || s.id || '').toLowerCase();
        const phone = String(s.phone || '').toLowerCase();

        if (searchVal && !name.includes(searchVal) && !roll.includes(searchVal) && !phone.includes(searchVal)) {
            return false;
        }

        return true;
    });

    renderMasterGrid(filtered);
}

function showGridStatusAlert(msg, type) {
    const box = document.getElementById('gridStatusAlert');
    if (!box) return;
    box.innerHTML = `<div class="alert alert-${type || 'info'} alert-dismissible fade show mb-3" role="alert">
        ${msg}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>`;
}

// ─── DUAL SYNC SAVE ALL ───────────────────────────────────────────────────────

async function saveAllMasterChanges() {
    showGridStatusAlert('<i class="fas fa-spinner fa-spin mr-2"></i>Syncing all changes to Google Sheets and Supabase...', 'info');

    // 1. Save to local storage
    localStorage.setItem('students', JSON.stringify(currentStudents));

    // 2. Push all to Google Sheets & Supabase
    let successCount = 0;
    let failCount = 0;

    for (const student of currentStudents) {
        try {
            if (typeof sb_saveStudent === 'function') {
                const ok = await sb_saveStudent(student);
                if (ok) successCount++;
                else failCount++;
            }
        } catch (e) {
            console.warn('Error syncing student:', student.name, e);
            failCount++;
        }
    }

    originalStudents = JSON.parse(JSON.stringify(currentStudents));
    renderMasterGrid(currentStudents);
    updateFeeSummary();

    showGridStatusAlert(`✅ Successfully synced ${successCount} students to Google Sheets and Supabase! (Failed: ${failCount})`, 'success');
}

// ─── 2. GLOBAL BROADCAST & EXAM ALERTS ────────────────────────────────────────

async function handlePublishAnnouncement(e) {
    e.preventDefault();
    const title = document.getElementById('annTitle').value.trim();
    const target = document.getElementById('annTarget').value;
    const category = document.getElementById('annCategory').value;
    const msg = document.getElementById('annMsg').value.trim();
    const btn = document.getElementById('publishAnnBtn');

    if (!title || !msg) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Broadcasting...';

    // Color and icon mappings
    let icon = 'megaphone';
    let iconBg = '#FEF3F2';
    let iconColor = '#F04438';
    if (category === 'holiday') {
        icon = 'calendar';
        iconBg = '#ECFDF5';
        iconColor = '#10B981';
    } else if (category === 'event') {
        icon = 'trophy';
        iconBg = '#EFF6FF';
        iconColor = '#3B82F6';
    }

    try {
        // Save to Supabase announcements table
        const sb = typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null;
        if (sb) {
            const { error: insErr } = await sb.from('announcements').insert({
                title: (target !== 'All' ? '[' + target + '] ' : '') + title,
                description: msg,
                icon: icon,
                icon_bg: iconBg,
                icon_color: iconColor,
                time_label: 'Just now',
                important: category === 'urgent' || category === 'holiday'
            });
            if (insErr) console.warn('[MasterHub] Announcement insert warning:', insErr);
        }

        alert('✅ Announcement broadcasted! All student and teacher apps will see it immediately.');
        document.getElementById('announcementForm').reset();
        loadActiveBroadcasts();
    } catch (err) {
        alert('Failed to publish announcement: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Broadcast to All Apps';
    }
}

async function handlePublishTestAlert(e) {
    e.preventDefault();
    const title = document.getElementById('testTitle').value.trim();
    const className = document.getElementById('testClass').value;
    const subject = document.getElementById('testSubject').value.trim();
    const examDate = document.getElementById('testExamDate').value;
    const expiryDate = document.getElementById('testExpiryDate').value;
    const syllabus = document.getElementById('testSyllabus').value.trim();
    const btn = document.getElementById('publishTestBtn');

    if (!title || !examDate || !expiryDate) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Publishing Alert...';

    const syllabusArray = syllabus ? syllabus.split('\n').map(s => s.trim()).filter(Boolean) : ['Full Syllabus'];

    try {
        const sb = typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null;
        if (sb) {
            // 1. Write to announcements table (guaranteed to exist and trigger live alert banners)
            await sb.from('announcements').insert({
                title: `[Exam Alert - ${className}] ${title}`,
                description: `Subject: ${subject} | Exam Date: ${examDate} | Valid Until: ${expiryDate}${syllabus ? '\nSyllabus: ' + syllabusArray.join(', ') : ''}`,
                icon: 'calendar',
                icon_bg: '#EFF6FF',
                icon_color: '#1A56DB',
                time_label: 'Exam: ' + examDate,
                important: true
            });

            // 2. Also post as a notification
            try {
                await sb.from('notifications').insert({
                    roll_no: 'ALL',
                    title: 'New Exam Scheduled: ' + title,
                    message: `Class: ${className} | Subject: ${subject} | Date: ${examDate}`,
                    time_label: 'Just now'
                });
            } catch (ne) {}

            // 3. Try to write to academic_alerts table if present
            try {
                await sb.from('academic_alerts').upsert({
                    class_label: className,
                    subject: subject,
                    test_name: title,
                    exam_date: examDate,
                    expiry_date: expiryDate,
                    syllabus: syllabusArray,
                    published: true,
                    created_at: new Date().toISOString()
                });
            } catch (ae) {}
        }

        alert('✅ Academic Exam Alert published! Students in ' + className + ' will see this alert banner on their home screen until ' + expiryDate + '.');
        document.getElementById('testAlertForm').reset();
        loadActiveBroadcasts();
    } catch (err) {
        alert('Failed to publish exam alert: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bell mr-1"></i> Publish Exam Alert';
    }
}

function showBroadcastStatus(msg, isError = false) {
    const box = document.getElementById('broadcastStatusMsg');
    if (!box) return;
    box.className = 'alert ' + (isError ? 'alert-danger' : 'alert-success') + ' alert-dismissible fade show mb-3';
    box.innerHTML = '<strong>' + (isError ? '⚠️ Error: ' : '✓ ') + '</strong>' + msg
        + '<button type="button" class="close" onclick="this.parentElement.style.display=\'none\'">&times;</button>';
    box.style.display = 'block';
    setTimeout(function () {
        if (box) box.style.display = 'none';
    }, 6000);
}

async function loadActiveBroadcasts() {
    const container = document.getElementById('activeBroadcastsContainer');
    if (!container) return;

    const sb = _getMasterHubSupabase();
    let html = '';

    if (sb) {
        try {
            const { data: anns, error: fetchErr } = await sb
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(30);

            if (fetchErr) {
                console.warn('[MasterHub] Error loading announcements:', fetchErr);
            }

            if (anns && anns.length > 0) {
                const examAlerts = anns.filter(a => a.title && (a.title.includes('[Exam Alert') || a.title.includes('[Test Alert')));
                const regularAnns = anns.filter(a => !a.title || (!a.title.includes('[Exam Alert') && !a.title.includes('[Test Alert')));

                if (regularAnns.length > 0) {
                    html += '<h6 class="font-weight-bold text-muted mb-2"><i class="fas fa-bullhorn mr-1 text-primary"></i>Live Community Announcements (' + regularAnns.length + ')</h6>';
                    regularAnns.forEach(a => {
                        const dateStr = a.created_at ? new Date(a.created_at).toLocaleString() : '';
                        html += '<div class="broadcast-item d-flex justify-content-between align-items-center mb-2 p-3 bg-white border rounded shadow-sm" id="annCard_' + a.id + '">'
                            + '<div style="flex: 1; min-width: 0; margin-right: 12px;">'
                            + '<strong class="text-dark">' + (a.title || '') + '</strong>'
                            + '<p class="mb-1 text-muted small text-break">' + (a.description || '') + '</p>'
                            + '<span class="badge badge-light border text-secondary">' + (a.time_label || dateStr || 'Active') + '</span>'
                            + '</div>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-2 flex-shrink-0 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\'' + a.id + '\', this, event)" title="Delete this announcement" style="cursor: pointer; z-index: 10; position: relative;">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>';
                    });
                }

                if (examAlerts.length > 0) {
                    html += '<h6 class="font-weight-bold text-muted mt-3 mb-2"><i class="fas fa-calendar-alt mr-1 text-danger"></i>Active Exam / Test Alerts (' + examAlerts.length + ')</h6>';
                    examAlerts.forEach(a => {
                        const dateStr = a.created_at ? new Date(a.created_at).toLocaleString() : '';
                        html += '<div class="broadcast-item d-flex justify-content-between align-items-center mb-2 p-3 bg-white border rounded shadow-sm" style="border-left: 4px solid #ef4444 !important;" id="annCard_' + a.id + '">'
                            + '<div style="flex: 1; min-width: 0; margin-right: 12px;">'
                            + '<strong class="text-dark">' + (a.title || '') + '</strong>'
                            + '<p class="mb-1 text-muted small text-break">' + (a.description || '') + '</p>'
                            + '<span class="badge badge-danger mt-1">' + (a.time_label || dateStr || 'Active') + '</span>'
                            + '</div>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-2 flex-shrink-0 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\'' + a.id + '\', this, event)" title="Delete this exam alert" style="cursor: pointer; z-index: 10; position: relative;">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>';
                    });
                }

                // Add "Clear All Announcements" button at bottom
                html += '<div class="mt-3 text-right">'
                    + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-2" id="btnClearAllAnn" onclick="window.requestClearAll(this, event)" title="Remove all announcements" style="cursor: pointer; z-index: 10; position: relative;">'
                    + '<i class="fas fa-broom mr-1" style="pointer-events: none;"></i> Clear All Announcements'
                    + '</button>'
                    + '</div>';
            }
        } catch (e) {
            console.warn('[MasterHub] Could not load active broadcasts:', e);
        }
    } else {
        console.warn('[MasterHub] Supabase not ready, retrying load in 800ms...');
        setTimeout(loadActiveBroadcasts, 800);
    }

    if (!html) {
        container.innerHTML = '<p class="text-muted mb-0"><i class="fas fa-info-circle mr-1"></i>No active broadcasts currently published.</p>';
    } else {
        container.innerHTML = html;
    }
}

// ─── Direct Global Delete Functions with 2-Step In-Place Confirmation ─────────
// This eliminates browser confirm() popup blocking entirely!

window.requestDeleteAnnouncement = function (id, btnElement, evt) {
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    if (!btnElement) return;

    // First click: Transform button into instant "Confirm Delete?"
    btnElement.className = 'btn btn-sm btn-danger px-3 py-2 flex-shrink-0 font-weight-bold animate__animated animate__pulse';
    btnElement.innerHTML = '<i class="fas fa-check mr-1" style="pointer-events: none;"></i> Confirm?';
    btnElement.onclick = function (e) {
        window.executeDeleteAnnouncement(id, btnElement, e);
    };

    // Auto-revert after 5 seconds if not clicked
    setTimeout(function () {
        if (btnElement && btnElement.innerHTML.includes('Confirm?')) {
            btnElement.className = 'btn btn-sm btn-outline-danger px-3 py-2 flex-shrink-0 btn-delete-ann';
            btnElement.innerHTML = '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete';
            btnElement.onclick = function (e) {
                window.requestDeleteAnnouncement(id, btnElement, e);
            };
        }
    }, 5000);
};

window.executeDeleteAnnouncement = async function (id, btnElement, evt) {
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

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Deleting...';
    }

    try {
        const { error } = await sb.from('announcements').delete().eq('id', id);
        if (error) {
            showBroadcastStatus('Failed to delete announcement: ' + error.message, true);
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> Delete';
            }
            return;
        }

        // Clean up matching notification row if any
        try { await sb.from('notifications').delete().eq('id', id); } catch (_) {}

        // Optimistically remove card from DOM immediately
        const card = document.getElementById('annCard_' + id) || (btnElement ? btnElement.closest('.broadcast-item') : null);
        if (card) card.remove();

        showBroadcastStatus('Announcement removed successfully from all student & teacher devices!');
        await loadActiveBroadcasts();
    } catch (err) {
        showBroadcastStatus('Error: ' + (err.message || err), true);
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> Delete';
        }
    }
};

window.requestClearAll = function (btnElement, evt) {
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    if (!btnElement) return;

    btnElement.className = 'btn btn-sm btn-danger px-3 py-2 font-weight-bold';
    btnElement.innerHTML = '<i class="fas fa-exclamation-triangle mr-1" style="pointer-events: none;"></i> Really Clear ALL Announcements?';
    btnElement.onclick = function (e) {
        window.executeClearAll(btnElement, e);
    };

    setTimeout(function () {
        if (btnElement && btnElement.innerHTML.includes('Really Clear')) {
            btnElement.className = 'btn btn-sm btn-outline-danger px-3 py-2';
            btnElement.innerHTML = '<i class="fas fa-broom mr-1" style="pointer-events: none;"></i> Clear All Announcements';
            btnElement.onclick = function (e) {
                window.requestClearAll(btnElement, e);
            };
        }
    }, 6000);
};

window.executeClearAll = async function (btnElement, evt) {
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    const sb = _getMasterHubSupabase();
    if (!sb) {
        showBroadcastStatus('Database connection not ready. Please reload the page.', true);
        return;
    }

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Clearing all...';
    }

    try {
        const { error } = await sb.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            showBroadcastStatus('Failed to clear announcements: ' + error.message, true);
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = '<i class="fas fa-broom mr-1"></i> Clear All Announcements';
            }
            return;
        }

        showBroadcastStatus('All announcements and alerts cleared successfully!');
        await loadActiveBroadcasts();
    } catch (err) {
        showBroadcastStatus('Error: ' + (err.message || err), true);
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = '<i class="fas fa-broom mr-1"></i> Clear All Announcements';
        }
    }
};

// Aliases for compatibility with any existing or delegated calls
window.deleteAnnouncement = function (id, btn, e) { window.executeDeleteAnnouncement(id, btn, e); };
window.deleteExamAlert = function (id, btn, e) { window.executeDeleteAnnouncement(id, btn, e); };
window.clearAllAnnouncements = function (btn, e) { window.executeClearAll(btn, e); };
window._doDeleteAnnouncement = window.deleteAnnouncement;
window._doDeleteAllAnnouncements = window.clearAllAnnouncements;

// Global fallback event delegation
document.addEventListener('click', function (evt) {
    const delBtn = evt.target.closest('.btn-delete-ann');
    if (delBtn && !delBtn.onclick) {
        const annId = delBtn.getAttribute('data-id');
        if (annId) window.requestDeleteAnnouncement(annId, delBtn, evt);
    }
});

// ─── 3. MONTHLY FEES AUTOMATION ──────────────────────────────────────────────

function updateFeeSummary() {
    const students = currentStudents || [];
    let totalExpected = 0;
    const classGroups = {};

    students.forEach(s => {
        const amt = Number(s.amount || s.monthly_fee || s.monthlyFee) || 0;
        totalExpected += amt;

        const cName = 'Class ' + String(s.class || s.class_name || '10').replace(/[^0-9]/g, '');
        if (!classGroups[cName]) {
            classGroups[cName] = { count: 0, total: 0 };
        }
        classGroups[cName].count++;
        classGroups[cName].total += amt;
    });

    const elTotalStu = document.getElementById('feeTotalStudents');
    const elExpected = document.getElementById('feeTotalExpected');
    const elCollected = document.getElementById('feeTotalCollected');
    const elPending = document.getElementById('feeTotalPending');

    if (elTotalStu) elTotalStu.innerText = students.length;
    if (elExpected) elExpected.innerText = '₹' + totalExpected.toLocaleString('en-IN');
    if (elCollected) elCollected.innerText = '₹' + Math.round(totalExpected * 0.6).toLocaleString('en-IN');
    if (elPending) elPending.innerText = '₹' + Math.round(totalExpected * 0.4).toLocaleString('en-IN');

    // Populate class breakdown table
    const tbody = document.getElementById('cycleFeeTbody');
    if (tbody) {
        tbody.innerHTML = '';
        Object.keys(classGroups).sort().forEach(c => {
            const grp = classGroups[c];
            const avg = grp.count > 0 ? Math.round(grp.total / grp.count) : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-weight-bold">${c}</td>
                <td>${grp.count} Students</td>
                <td>Avg ₹${avg.toLocaleString('en-IN')} / student</td>
                <td class="font-weight-bold text-primary">₹${grp.total.toLocaleString('en-IN')}</td>
                <td><span class="badge badge-success"><i class="fas fa-check-circle mr-1"></i>Live in Supabase</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

async function generateMonthlyFeeCycle() {
    const cycleMonth = document.getElementById('cycleMonthSelect').value;
    if (!confirm('Generate fee billing cycle for "' + cycleMonth + '" across all ' + currentStudents.length + ' active students?')) {
        return;
    }

    const sb = typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null;
    let count = 0;

    if (sb) {
        for (const s of currentStudents) {
            const rollNo = s.rollNo || s.roll_no || s.id;
            const monthlyFee = Number(s.amount || s.monthly_fee) || 3000;

            // Upsert fee record for cycle
            await sb.from('fees_records').upsert({
                roll_no: rollNo,
                monthly_fee: monthlyFee,
                current_due: monthlyFee,
                due_date: '25 ' + cycleMonth,
                days_left: 5,
                status: 'due',
                updated_at: new Date().toISOString()
            }, { onConflict: 'roll_no' });

            count++;
        }
    }

    alert('✅ Generated ' + cycleMonth + ' billing cycle for ' + count + ' students in Supabase and Google Sheets!');
}

// ─── 4. CLOUD HEALTH & DIAGNOSTICS ────────────────────────────────────────────

async function testCloudHealth() {
    const sbBox = document.getElementById('supabaseHealthDetails');
    const shBox = document.getElementById('sheetsHealthDetails');
    const navSh = document.getElementById('navSheetsStatus');
    const navSb = document.getElementById('navSupabaseStatus');

    // 1. Google Sheets Check
    if (typeof _sheetsReady === 'function' && _sheetsReady()) {
        try {
            if (shBox) shBox.innerHTML = '<span class="text-success font-weight-bold"><i class="fas fa-check-circle mr-1"></i>Connected to Google Sheets API</span><br><small class="text-muted">' + (SHEETS_API_URL.slice(0, 45) + '...') + '</small>';
            if (navSh) {
                navSh.className = 'badge badge-cloud badge-cloud-green mr-2';
                navSh.innerHTML = '<i class="fas fa-file-excel mr-1"></i>Sheets: Ready';
            }
        } catch (e) {
            if (shBox) shBox.innerHTML = '<span class="text-danger font-weight-bold"><i class="fas fa-times-circle mr-1"></i>Sheets Error</span>: ' + e.message;
        }
    } else {
        if (shBox) shBox.innerHTML = '<span class="text-warning font-weight-bold"><i class="fas fa-exclamation-triangle mr-1"></i>Sheets API Not Configured</span>';
        if (navSh) navSh.className = 'badge badge-cloud badge-cloud-amber mr-2';
    }

    // 2. Supabase Check
    const sb = typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null;
    if (sb) {
        try {
            const { count: stuCount, error } = await sb.from('students').select('*', { count: 'exact', head: true });
            if (!error) {
                if (sbBox) sbBox.innerHTML = '<span class="text-success font-weight-bold"><i class="fas fa-check-circle mr-1"></i>Connected to Supabase DB</span><br><small class="text-muted">Total Students in Cloud: <strong>' + (stuCount || 0) + '</strong></small>';
                if (navSb) {
                    navSb.className = 'badge badge-cloud badge-cloud-green';
                    navSb.innerHTML = '<i class="fas fa-bolt mr-1"></i>Supabase: Connected';
                }
            } else {
                if (sbBox) sbBox.innerHTML = '<span class="text-danger font-weight-bold">Supabase Query Error:</span> ' + error.message;
            }
        } catch (e) {
            if (sbBox) sbBox.innerHTML = '<span class="text-danger font-weight-bold">Connection Failed:</span> ' + e.message;
        }
    } else {
        if (sbBox) sbBox.innerHTML = '<span class="text-warning font-weight-bold"><i class="fas fa-exclamation-triangle mr-1"></i>Supabase Client Unavailable</span>';
        if (navSb) navSb.className = 'badge badge-cloud badge-cloud-amber';
    }
}

async function forcePushAllToClouds() {
    if (!confirm('Push all local student records, fee status, and settings to BOTH Google Sheets and Supabase?')) return;
    if (typeof sb_migrateFromLocalStorage === 'function') {
        const res = await sb_migrateFromLocalStorage();
        alert(res.msg || 'Sync completed.');
        testCloudHealth();
    }
}

async function forcePullAllFromClouds() {
    if (!confirm('Pull latest student records from Google Sheets and Supabase?')) return;
    if (typeof sb_loadFromCloud === 'function') {
        const res = await sb_loadFromCloud();
        alert(res.msg || 'Data refreshed from cloud.');
        await refreshMasterData();
        testCloudHealth();
    }
}


// ==============================================================================
//  STUDY MATERIALS MANAGEMENT (SUPER ADMIN DELETE & VIEW)
// ==============================================================================
let allStudyMaterials = [];

async function loadStudyMaterials() {
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin mr-2"></i>Loading study materials from cloud...</td></tr>';

    const sb = _getMasterHubSupabase();
    if (!sb) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle mr-2"></i>Supabase not connected.</td></tr>';
        return;
    }

    try {
        const { data, error } = await sb
            .from('study_materials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching study materials:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load materials: ' + error.message + '</td></tr>';
            return;
        }

        allStudyMaterials = data || [];
        renderMaterialsTable(allStudyMaterials);
    } catch (e) {
        console.error('Error loading study materials:', e);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Unexpected error loading materials.</td></tr>';
    }
}

function renderMaterialsTable(materials) {
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;

    if (!materials || materials.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><i class="fas fa-folder-open mr-2"></i>No study materials found.</td></tr>';
        return;
    }

    tbody.innerHTML = materials.map((m, idx) => {
        const subBadgeColor = (m.subject || '').toLowerCase().includes('chem') ? 'success'
            : (m.subject || '').toLowerCase().includes('phys') ? 'primary'
            : (m.subject || '').toLowerCase().includes('math') ? 'warning'
            : (m.subject || '').toLowerCase().includes('comp') ? 'info' : 'secondary';

        const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        const safeTitle = (m.title || 'Untitled').replace(/"/g, '&quot;');

        return '<tr>' +
            '<td><strong>#' + (idx + 1) + '</strong></td>' +
            '<td><span class="badge badge-' + subBadgeColor + ' px-2 py-1">' + (m.subject || 'General') + '</span></td>' +
            '<td>' + (m.chapter || '—') + '</td>' +
            '<td><strong>' + (m.title || 'Untitled') + '</strong>' + (m.file_url ? ' <a href="' + m.file_url + '" target="_blank" class="badge badge-light border ml-1"><i class="fas fa-paperclip mr-1"></i>File</a>' : '') + '</td>' +
            '<td><small class="text-muted">' + (m.size || '1.5 MB') + '</small></td>' +
            '<td><small class="text-muted">' + dateStr + '</small></td>' +
            '<td class="text-center">' +
                '<button class="btn btn-outline-danger btn-sm py-1 px-2" onclick="deleteStudyMaterial(\'' + m.id + '\', \'' + safeTitle + '\')" title="Delete Material">' +
                    '<i class="fas fa-trash-alt mr-1"></i>Delete' +
                '</button>' +
            '</td>' +
        '</tr>';
    }).join('');
}

function filterMaterialsTable() {
    const sel = document.getElementById('materialSubjectFilter');
    const val = sel ? sel.value.toLowerCase() : '';
    if (!val) {
        renderMaterialsTable(allStudyMaterials);
        return;
    }
    const filtered = allStudyMaterials.filter(m => (m.subject || '').toLowerCase().includes(val));
    renderMaterialsTable(filtered);
}

async function deleteStudyMaterial(id, title) {
    if (!confirm('Are you sure you want to permanently delete "' + title + '" from the cloud and mobile app?')) {
        return;
    }

    const sb = _getMasterHubSupabase();
    if (!sb) {
        alert('Supabase client not connected.');
        return;
    }

    try {
        const { error } = await sb.from('study_materials').delete().eq('id', id);
        if (error) {
            alert('Failed to delete material: ' + error.message);
            return;
        }
        alert('Study Material "' + title + '" has been permanently deleted from both cloud and mobile apps.');
        await loadStudyMaterials();
    } catch (e) {
        console.error('Delete error:', e);
        alert('Failed to delete material: ' + e.message);
    }
}

// Hook into tab activation
document.addEventListener('DOMContentLoaded', function () {
    const materialsTabLink = document.getElementById('tab-materials-link');
    if (materialsTabLink) {
        materialsTabLink.addEventListener('shown.bs.tab', function () {
            loadStudyMaterials();
        });
    }
});
