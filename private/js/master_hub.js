function cleanApprovedTitle(rawTitle) {
    if (!rawTitle) return 'Community Announcement';
    let t = rawTitle;
    if (/^\[PENDING APPROVAL\s*-\s*All Classes\]/i.test(t)) {
        t = t.replace(/^\[PENDING APPROVAL\s*-\s*All Classes\]\s*/i, '');
    } else if (/^\[PENDING APPROVAL\s*-\s*([^\]]+)\]/i.test(t)) {
        t = t.replace(/^\[PENDING APPROVAL\s*-\s*([^\]]+)\]\s*/i, '[$1] ');
    } else {
        t = t.replace(/^\[PENDING APPROVAL\s*-\s*/i, '').replace(/^\[PENDING APPROVAL\]\s*/i, '');
    }
    return t.replace(/\s{2,}/g, ' ').trim();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function getStandardClassFee(className) {
    const raw = String(className || '10').replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 10;
    if (num >= 11) return 4000;
    if (num >= 9) return 3000;
    return 2500;
}
window.getStandardClassFee = getStandardClassFee;

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
let _realtimeChannel = null;

function setupMasterHubRealtime() {
    const sb = _getMasterHubSupabase();
    if (!sb || typeof sb.channel !== 'function') {
        console.warn('[MasterHub Realtime] Supabase channel API not available');
        return;
    }

    if (_realtimeChannel) {
        try { _realtimeChannel.unsubscribe(); } catch (e) {}
    }

    try {
        _realtimeChannel = sb
            .channel('public:master_hub_live_' + Date.now())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
                console.log('[MasterHub Realtime] Announcements changed:', payload.eventType);
                loadActiveBroadcasts();
                setupMasterHubRealtime();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
                console.log('[MasterHub Realtime] Students changed:', payload.eventType);
                refreshMasterData(true);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'fees_records' }, (payload) => {
                console.log('[MasterHub Realtime] Fees records changed:', payload.eventType);
                if (typeof updateFeeSummary === 'function') updateFeeSummary();
            })
            .subscribe((status) => {
                console.log('[MasterHub Realtime] Subscription status:', status);
                const cloudBadge = document.getElementById('cloudStatusBadge');
                if (cloudBadge && status === 'SUBSCRIBED') {
                    cloudBadge.className = 'badge badge-cloud badge-cloud-green';
                    cloudBadge.innerHTML = '<i class="fas fa-bolt mr-1"></i> Supabase Realtime Active';
                }
            });
    } catch (err) {
        console.warn('[MasterHub Realtime] Error setting up realtime:', err);
    }
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
    if (typeof updateBulkPaidRangePreview === 'function') updateBulkPaidRangePreview();

    // Refresh active broadcasts when clicking the Broadcasts tab
    const feesTabLink = document.getElementById('tab-fees-link');
    if (feesTabLink) {
        feesTabLink.addEventListener('shown.bs.tab', function () {
            if (typeof window.loadPendingVerifications === 'function') {
                window.loadPendingVerifications();
            }
            if (typeof updateFeeSummary === 'function') updateFeeSummary();
        });
        feesTabLink.addEventListener('click', function () {
            setTimeout(function () {
                if (typeof window.loadPendingVerifications === 'function') {
                    window.loadPendingVerifications();
                }
                if (typeof updateFeeSummary === 'function') updateFeeSummary();
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

async function refreshMasterData(isRealtime) {
    const refreshBtn = document.querySelector('button[onclick="refreshMasterData()"]');
    if (refreshBtn && !isRealtime) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Syncing...';
    }

    const tbody = document.getElementById('masterGridTbody');
    if (tbody && !isRealtime) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading live student records from database...</td></tr>';
    }

    let students = [];
    const sb = _getMasterHubSupabase();

    // 1. Fetch live students directly from Supabase
    if (sb) {
        try {
            const { data: dbStudents, error } = await sb
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            // Fetch live fees_records to get exact fee figures
            let feeMap = new Map();
            try {
                const { data: feeRows, error: feeErr } = await sb
                    .from('fees_records')
                    .select('roll_no, current_due, due_date, days_left, recent_payments');
                if (!feeErr && Array.isArray(feeRows)) {
                    feeRows.forEach(fr => {
                        if (fr.roll_no) feeMap.set(String(fr.roll_no).toUpperCase().trim(), fr);
                    });
                }
            } catch (feeEx) {
                console.warn('[MasterHub] Error querying fees_records in refreshMasterData:', feeEx);
            }

            if (!error && Array.isArray(dbStudents) && dbStudents.length > 0) {
                students = dbStudents.map(s => {
                    const roll = s.roll_no || s.rollNo || s.id || '';
                    const cleanRoll = String(roll).toUpperCase().trim();
                    const feeRec = feeMap.get(cleanRoll);
                    const sClass = s.class || s.class_name || '10';
                    const stdFee = getStandardClassFee(sClass);
                    const actualFee = feeRec ? (Number(feeRec.current_due) || stdFee) : (Number(s.monthly_fee || s.amount || s.fee) || stdFee);

                    return {
                        rollNo: roll,
                        name: s.name || '',
                        class: sClass,
                        phone: s.phone || '',
                        fee: actualFee,
                        amount: actualFee,
                        subjects: Array.isArray(s.subjects) ? s.subjects : (s.subjects ? String(s.subjects).split(',').map(x => x.trim()) : []),
                        school: s.school || 'EduHome Campus',
                        pin: s.pin || '1234',
                        joiningDate: s.joining_date || s.joiningDate || '',
                        status: s.status || 'Active'
                    };
                });
            }
        } catch (e) {
            console.warn('[MasterHub] Error querying students from Supabase:', e);
        }
    }

    // 2. Fallback to localStorage / getStudents if Supabase had no rows or offline
    if (!students || students.length === 0) {
        if (typeof getStudents === 'function') {
            students = getStudents();
        } else {
            students = JSON.parse(localStorage.getItem('students')) || [];
        }
    }

    students.forEach(s => {
        if (!s.class) s.class = s.class_name || '10';
        if (!s.amount || Number(s.amount) === 0) {
            s.amount = getStandardClassFee(s.class);
            s.fee = s.amount;
        }
    });

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

    // Save cleaned list so localStorage is permanently up to date
    try { localStorage.setItem('students', JSON.stringify(uniqueStudents)); } catch (e) {}

    renderMasterGrid(currentStudents);
    await updateFeeSummary();

    // Also refresh active announcements and pending fee receipts
    if (!isRealtime) {
        loadActiveBroadcasts();
        if (typeof window.loadPendingVerifications === 'function') {
            window.loadPendingVerifications();
        }
    }

    if (refreshBtn && !isRealtime) {
        refreshBtn.innerHTML = '<i class="fas fa-check mr-1 text-success"></i> Synced ✓';
        setTimeout(() => {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> Refresh Data';
        }, 1500);
    }
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
                .limit(40);

            if (fetchErr) {
                console.warn('[MasterHub] Error loading announcements:', fetchErr);
            }

            if (anns && anns.length > 0) {
                const pendingAnns = anns.filter(a => a.title && (a.title.includes('[PENDING APPROVAL') || a.time_label === 'Pending Approval'));
                const examAlerts = anns.filter(a => a.title && (a.title.includes('[Exam Alert') || a.title.includes('[Test Alert')) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval');
                const regularAnns = anns.filter(a => (!a.title || (!a.title.includes('[Exam Alert') && !a.title.includes('[Test Alert'))) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval');

                if (pendingAnns.length > 0) {
                    html += '<div class="alert alert-warning mb-4 border-warning shadow-sm p-3 rounded" style="background: #fffbeb; border-left: 5px solid #f59e0b !important;">'
                        + '<div class="d-flex justify-content-between align-items-center flex-wrap mb-2" style="gap: 8px;">'
                        + '<h6 class="font-weight-bold text-dark mb-0"><i class="fas fa-clock mr-2 text-warning"></i>Faculty Announcements Awaiting Admin Approval (' + pendingAnns.length + ')</h6>'
                        + '<span class="badge badge-warning text-dark font-weight-bold px-2 py-1">Requires Action</span>'
                        + '</div>'
                        + '<p class="small text-muted mb-3">Submitted by faculty members via mobile app. Review and approve to broadcast live to all student devices.</p>';

                    pendingAnns.forEach(a => {
                        const rawTitle = a.title || '';
                        const cleanTitle = cleanApprovedTitle(rawTitle);
                        const dateStr = a.created_at ? new Date(a.created_at).toLocaleString() : 'Just now';
                        const desc = a.description || '';

                        // Determine if this is a test / exam submission
                        const isTest = /test|exam|unit\s*test|paper/i.test(rawTitle)
                            || /exam\s*date|max\s*marks|syllabus/i.test(desc)
                            || (a.icon === 'calendar');

                        // Extract class tag if present (e.g. "[Class 10] Sound (Physics)")
                        let classTag = '';
                        let displayTitle = cleanTitle;
                        const classMatch = cleanTitle.match(/^\[(Class\s*[^\]]+)\]\s*(.*)$/i);
                        if (classMatch) {
                            classTag = classMatch[1];
                            displayTitle = classMatch[2] || cleanTitle;
                        }

                        // Parse structured test fields
                        const examDateMatch = desc.match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r]+)/i);
                        const timeMatch = desc.match(/Time\s*:\s*([^\n\r]+)/i);
                        const roomMatch = desc.match(/(?:Venue|Room)\s*:\s*([^\n\r]+)/i);
                        const maxMarksMatch = desc.match(/(?:Max\s*Marks|Total\s*Marks|Marks)\s*:\s*([^\n\r]+)/i);
                        const syllabusMatch = desc.match(/(?:Syllabus|Chapters|Portion)\s*:\s*([^\n\r]+)/i);
                        const submittedByMatch = desc.match(/(?:Submitted\s*by|Faculty|Teacher|By)\s*:\s*([^\n\r]+)/i);

                        // Collect any extra notes/instructions not captured by main fields
                        const allLines = desc.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                        const remainingLines = allLines.filter(line => {
                            return !/^(?:Exam\s*Date|ExamDate|Date|Time|Venue|Room|(?:Max|Total)\s*Marks|Marks|Syllabus|Chapters|Portion|(?:Submitted\s*by|Faculty|Teacher|By))\s*:/i.test(line);
                        });

                        let bodyHtml = '';
                        if (isTest && (examDateMatch || maxMarksMatch || syllabusMatch || submittedByMatch)) {
                            bodyHtml = '<div class="pending-test-details-box my-2">'
                                + '<div class="row" style="row-gap: 8px;">';

                            if (examDateMatch) {
                                bodyHtml += '<div class="col-sm-6 col-12">'
                                    + '<span class="pending-test-meta-label"><i class="far fa-calendar-alt text-primary mr-1"></i>Exam Date</span>'
                                    + '<div class="pending-test-meta-value font-weight-bold text-dark">' + escapeHtml(examDateMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (maxMarksMatch) {
                                bodyHtml += '<div class="col-sm-6 col-12">'
                                    + '<span class="pending-test-meta-label"><i class="fas fa-award text-warning mr-1"></i>Max Marks</span>'
                                    + '<div class="pending-test-meta-value font-weight-bold text-dark">' + escapeHtml(maxMarksMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (timeMatch) {
                                bodyHtml += '<div class="col-sm-6 col-12">'
                                    + '<span class="pending-test-meta-label"><i class="far fa-clock text-info mr-1"></i>Time</span>'
                                    + '<div class="pending-test-meta-value text-dark">' + escapeHtml(timeMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (roomMatch) {
                                bodyHtml += '<div class="col-sm-6 col-12">'
                                    + '<span class="pending-test-meta-label"><i class="fas fa-map-marker-alt text-danger mr-1"></i>Venue / Room</span>'
                                    + '<div class="pending-test-meta-value text-dark">' + escapeHtml(roomMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (syllabusMatch) {
                                bodyHtml += '<div class="col-12">'
                                    + '<span class="pending-test-meta-label"><i class="fas fa-book-open text-info mr-1"></i>Syllabus Portion</span>'
                                    + '<div class="pending-test-meta-value text-dark">' + escapeHtml(syllabusMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (submittedByMatch) {
                                bodyHtml += '<div class="col-12">'
                                    + '<span class="pending-test-meta-label"><i class="fas fa-chalkboard-teacher text-success mr-1"></i>Submitted By</span>'
                                    + '<div class="pending-test-meta-value font-weight-bold text-dark">' + escapeHtml(submittedByMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (remainingLines.length > 0) {
                                bodyHtml += '<div class="col-12 mt-1 pt-1 border-top">'
                                    + '<small class="text-muted"><strong><i class="fas fa-info-circle mr-1"></i>Notes:</strong> ' + escapeHtml(remainingLines.join(' • ')) + '</small>'
                                    + '</div>';
                            }

                            bodyHtml += '</div></div>';
                        } else {
                            bodyHtml = '<div class="pending-test-details-box my-2">'
                                + '<p class="broadcast-content-text mb-0 text-dark">' + escapeHtml(desc || 'No description provided.') + '</p>'
                                + '</div>';
                        }

                        html += '<div class="broadcast-card-item pending-approval-item" id="pendingAnn_' + a.id + '">'
                            // Header Row
                            + '<div class="broadcast-card-header d-flex flex-wrap align-items-center justify-content-between mb-1" style="gap: 8px;">'
                            + '<div class="d-flex align-items-center flex-wrap" style="gap: 6px;">'
                            + '<span class="badge badge-warning text-dark font-weight-bold py-1 px-2"><i class="fas fa-clock mr-1"></i>Pending Approval</span>'
                            + (classTag ? '<span class="badge badge-primary font-weight-bold py-1 px-2">' + escapeHtml(classTag) + '</span>' : '')
                            + (isTest ? '<span class="badge badge-info font-weight-bold py-1 px-2"><i class="fas fa-file-alt mr-1"></i>Test Paper</span>' : '')
                            + '<strong class="broadcast-content-title text-dark mb-0 ml-1">' + escapeHtml(displayTitle) + '</strong>'
                            + '</div>'
                            + '<span class="badge badge-light border text-secondary"><i class="far fa-clock mr-1"></i>' + escapeHtml(dateStr) + '</span>'
                            + '</div>'

                            // Body Row (Full width)
                            + '<div class="broadcast-card-body w-100">'
                            + bodyHtml
                            + '</div>'

                            // Footer Action Row
                            + '<div class="broadcast-card-footer">'
                            + '<small class="text-muted"><i class="fas fa-shield-alt text-warning mr-1"></i>Review & approve to broadcast live to all student devices</small>'
                            + '<div class="broadcast-actions-area" style="gap: 8px; flex-wrap: wrap;">'
                            + '<button type="button" class="btn btn-sm btn-primary px-3 py-2 font-weight-bold shadow-sm" onclick="window.openEditApprovalModal(\'' + a.id + '\', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-edit mr-1"></i> Edit & Approve'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-success px-3 py-2 font-weight-bold shadow-sm" onclick="window.requestApproveAnnouncement(\'' + a.id + '\', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-check-circle mr-1"></i> Quick Approve'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-2 font-weight-bold" data-action="reject" onclick="window.requestDeleteAnnouncement(\'' + a.id + '\', this, event)" title="Reject & Delete" style="cursor: pointer;">'
                            + '<i class="fas fa-times mr-1"></i> Reject'
                            + '</button>'
                            + '</div>'
                            + '</div>'

                            + '</div>';
                    });
                    html += '</div>';
                }

                if (regularAnns.length > 0) {
                    html += '<h6 class="font-weight-bold text-muted mb-2"><i class="fas fa-bullhorn mr-1 text-primary"></i>Live Community Announcements (' + regularAnns.length + ')</h6>';
                    regularAnns.forEach(a => {
                        const dateStr = a.created_at ? new Date(a.created_at).toLocaleString() : '';
                        html += '<div class="broadcast-card-item" id="annCard_' + a.id + '">'
                            + '<div class="broadcast-card-header d-flex flex-wrap align-items-center justify-content-between mb-1" style="gap: 8px;">'
                            + '<strong class="broadcast-content-title text-dark mb-0">' + escapeHtml(a.title || '') + '</strong>'
                            + '<span class="badge badge-light border text-secondary"><i class="far fa-clock mr-1"></i>' + escapeHtml(a.time_label || dateStr || 'Active') + '</span>'
                            + '</div>'
                            + '<div class="broadcast-card-body w-100 mb-2">'
                            + '<p class="broadcast-content-text mb-0 text-secondary">' + escapeHtml(a.description || '') + '</p>'
                            + '</div>'
                            + '<div class="broadcast-card-footer d-flex justify-content-end align-items-center pt-2 border-top">'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\'' + a.id + '\', this, event)" title="Delete this announcement" style="cursor: pointer;">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>'
                            + '</div>';
                    });
                }

                if (examAlerts.length > 0) {
                    html += '<h6 class="font-weight-bold text-muted mt-3 mb-2"><i class="fas fa-calendar-alt mr-1 text-danger"></i>Active Exam / Test Alerts (' + examAlerts.length + ')</h6>';
                    examAlerts.forEach(a => {
                        const dateStr = a.created_at ? new Date(a.created_at).toLocaleString() : '';
                        const desc = a.description || '';
                        const examDateMatch = desc.match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r|]+)/i);
                        const marksMatch = desc.match(/(?:Max|Total)\s*Marks:\s*([^\n\r|]+)/i);
                        const syllabusMatch = desc.match(/Syllabus:\s*([^\n\r]+)/i);

                        let bodyContent = '';
                        if (examDateMatch || marksMatch || syllabusMatch) {
                            bodyContent = '<div class="p-2 rounded my-1" style="background: #fef2f2; border: 1px solid #fee2e2;">'
                                + '<div class="row" style="row-gap: 6px;">';
                            if (examDateMatch) {
                                bodyContent += '<div class="col-sm-6 col-12"><small class="text-danger font-weight-bold d-block">EXAM DATE</small><span class="text-dark font-weight-bold">' + escapeHtml(examDateMatch[1].trim()) + '</span></div>';
                            }
                            if (marksMatch) {
                                bodyContent += '<div class="col-sm-6 col-12"><small class="text-danger font-weight-bold d-block">MAX MARKS</small><span class="text-dark font-weight-bold">' + escapeHtml(marksMatch[1].trim()) + '</span></div>';
                            }
                            if (syllabusMatch) {
                                bodyContent += '<div class="col-12"><small class="text-danger font-weight-bold d-block">SYLLABUS</small><span class="text-dark">' + escapeHtml(syllabusMatch[1].trim()) + '</span></div>';
                            }
                            bodyContent += '</div></div>';
                        } else {
                            bodyContent = '<p class="broadcast-content-text mb-0 text-secondary">' + escapeHtml(desc) + '</p>';
                        }

                        html += '<div class="broadcast-card-item exam-alert-item" id="annCard_' + a.id + '">'
                            + '<div class="broadcast-card-header d-flex flex-wrap align-items-center justify-content-between mb-1" style="gap: 8px;">'
                            + '<div class="d-flex align-items-center flex-wrap" style="gap: 6px;">'
                            + '<span class="badge badge-danger font-weight-bold"><i class="fas fa-calendar-alt mr-1"></i>Exam Alert</span>'
                            + '<strong class="broadcast-content-title text-dark mb-0">' + escapeHtml(a.title || '') + '</strong>'
                            + '</div>'
                            + '<span class="badge badge-danger"><i class="fas fa-bell mr-1"></i>' + escapeHtml(a.time_label || dateStr || 'Active') + '</span>'
                            + '</div>'
                            + '<div class="broadcast-card-body w-100 mb-2">'
                            + bodyContent
                            + '</div>'
                            + '<div class="broadcast-card-footer d-flex justify-content-end align-items-center pt-2 border-top">'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\'' + a.id + '\', this, event)" title="Delete this exam alert" style="cursor: pointer;">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>'
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

// ─── Direct Global Delete & Approve Functions ─────────────────────────────────

window.requestApproveAnnouncement = async function (id, btn, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (!id) return;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Approving...';
    }

    try {
        const sb = _getMasterHubSupabase();
        if (!sb) throw new Error('Supabase client not initialized. Please refresh.');

        const { data: item, error: fetchErr } = await sb.from('announcements').select('*').eq('id', id).maybeSingle();
        if (fetchErr) throw fetchErr;

        let cleanTitle = 'Community Announcement';
        if (item && item.title) {
            cleanTitle = cleanApprovedTitle(item.title);
        }

        const isTestOrExam = (item && item.title && (item.title.toLowerCase().includes('test') || item.title.toLowerCase().includes('exam')))
            || (item && item.description && (item.description.includes('Exam Date:') || item.description.includes('Max Marks:') || item.description.includes('Syllabus:')));

        let approvedTitle = cleanTitle;
        if (isTestOrExam && !approvedTitle.includes('[Exam Alert') && !approvedTitle.includes('[Test Alert')) {
            const classMatch = approvedTitle.match(/^\[Class\s*[^\]]+\]/i);
            if (classMatch) {
                approvedTitle = approvedTitle.replace(/^(\[Class\s*[^\]]+\])\s*/i, '$1 [Test Alert] ');
            } else {
                approvedTitle = '[Test Alert] ' + approvedTitle;
            }
        }

        const { error: updateErr } = await sb.from('announcements').update({
            title: approvedTitle,
            time_label: 'Just now',
            icon: isTestOrExam ? 'calendar' : 'megaphone',
            icon_bg: '#EBF3FF',
            icon_color: '#1A56DB',
            important: true
        }).eq('id', id);

        if (updateErr) throw updateErr;

        // Also if it's an exam alert, sync to academic_alerts table if possible
        if (isTestOrExam) {
            try {
                const desc = (item && item.description) || '';
                const dateMatch = desc.match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r|]+)/i);
                const marksMatch = desc.match(/(?:Max|Total)\s*Marks:\s*([^\n\r|]+)/i);
                const syllabusMatch = desc.match(/Syllabus:\s*([^\n\r]+)/i);
                const classMatch = approvedTitle.match(/\[Class\s*([^\]]+)\]/i);

                await sb.from('academic_alerts').upsert({
                    title: approvedTitle.replace(/^\[[^\]]+\]\s*/g, ''),
                    class_label: classMatch ? ('Class ' + classMatch[1].trim()) : 'All',
                    exam_date: dateMatch ? dateMatch[1].trim() : '',
                    max_marks: marksMatch ? marksMatch[1].trim() : '',
                    syllabus: syllabusMatch ? syllabusMatch[1].trim() : '',
                    published: true,
                    is_active: true,
                    created_at: new Date().toISOString()
                });
            } catch (ignore) {}
        }

        showBroadcastStatus('✅ Announcement / Test "' + cleanTitle + '" approved and broadcasted to student & faculty apps!');
        await loadActiveBroadcasts();
    } catch (err) {
        console.error('[MasterHub] Failed to approve announcement:', err);
        showBroadcastStatus('Failed to approve announcement: ' + (err.message || err), true);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Approve & Publish';
        }
    }
};

window.requestDeleteAnnouncement = function (id, btnElement, evt) {
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    if (!btnElement) return;

    const isReject = btnElement.getAttribute('data-action') === 'reject' || (btnElement.textContent || '').includes('Reject');

    // First click: Transform button into instant "Confirm Delete?" or "Confirm Reject?"
    btnElement.className = 'btn btn-sm btn-danger px-3 py-2 flex-shrink-0 font-weight-bold animate__animated animate__pulse';
    btnElement.innerHTML = '<i class="fas fa-check mr-1" style="pointer-events: none;"></i> ' + (isReject ? 'Confirm Reject?' : 'Confirm?');
    btnElement.onclick = function (e) {
        window.executeDeleteAnnouncement(id, btnElement, e);
    };

    // Auto-revert after 5 seconds if not clicked
    setTimeout(function () {
        if (btnElement && btnElement.innerHTML.includes('Confirm')) {
            if (isReject) {
                btnElement.className = 'btn btn-sm btn-outline-danger px-3 py-2 font-weight-bold';
                btnElement.innerHTML = '<i class="fas fa-times mr-1"></i> Reject';
            } else {
                btnElement.className = 'btn btn-sm btn-outline-danger px-3 py-1 flex-shrink-0 btn-delete-ann';
                btnElement.innerHTML = '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete';
            }
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
        const card = document.getElementById('pendingAnn_' + id)
            || document.getElementById('annCard_' + id)
            || (btnElement ? (btnElement.closest('.broadcast-card-item') || btnElement.closest('.broadcast-item')) : null);
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

async function updateFeeSummary() {
    const students = currentStudents || [];
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    const classGroups = {};

    const sb = _getMasterHubSupabase();
    let feeRecordsMap = new Map();
    if (sb) {
        try {
            const { data: fRows, error } = await sb
                .from('fees_records')
                .select('roll_no, current_due, recent_payments, due_date');
            if (!error && Array.isArray(fRows)) {
                fRows.forEach(r => {
                    if (r.roll_no) {
                        feeRecordsMap.set(String(r.roll_no).toUpperCase().trim(), r);
                    }
                });
            }
        } catch (e) {
            console.warn('[MasterHub] Error fetching fee records for summary:', e);
        }
    }

    students.forEach(s => {
        const rollKey = String(s.rollNo || s.roll_no || s.id || '').toUpperCase().trim();
        const sClass = s.class || s.class_name || '10';
        const stdFee = getStandardClassFee(sClass);
        const monthlyFee = Number(s.amount || s.fee) || stdFee;
        totalExpected += monthlyFee;

        const fRec = feeRecordsMap.get(rollKey);
        if (fRec) {
            const due = Number(fRec.current_due);
            if (isNaN(due) || due === 0) {
                totalCollected += monthlyFee;
            } else {
                totalPending += due;
            }

            // Sum any verified payments from mobile app
            const payments = Array.isArray(fRec.recent_payments) ? fRec.recent_payments : [];
            payments.forEach(p => {
                if (p && (p.status === 'Verified by Center Admin' || p.status === 'approved' || p.status === 'paid')) {
                    const pAmt = Number(p.amount) || 0;
                    totalCollected += pAmt;
                    if (totalPending >= pAmt) {
                        totalPending -= pAmt;
                    }
                }
            });
        } else {
            totalPending += monthlyFee;
        }

        const rawCls = String(sClass).replace(/[^0-9]/g, '') || '10';
        const cName = 'Class ' + rawCls;
        if (!classGroups[cName]) {
            classGroups[cName] = { count: 0, total: 0 };
        }
        classGroups[cName].count++;
        classGroups[cName].total += monthlyFee;
    });

    // Guard: if fresh cycle and no collections yet, pending equals expected
    if (totalCollected === 0 && totalPending === 0 && totalExpected > 0) {
        totalPending = totalExpected;
    }

    const elTotalStu = document.getElementById('feeTotalStudents');
    const elExpected = document.getElementById('feeTotalExpected');
    const elCollected = document.getElementById('feeTotalCollected');
    const elPending = document.getElementById('feeTotalPending');

    if (elTotalStu) elTotalStu.innerText = students.length;
    if (elExpected) elExpected.innerText = '₹' + totalExpected.toLocaleString('en-IN');
    if (elCollected) elCollected.innerText = '₹' + totalCollected.toLocaleString('en-IN');
    if (elPending) elPending.innerText = '₹' + totalPending.toLocaleString('en-IN');

    // Populate class breakdown table
    const tbody = document.getElementById('cycleFeeTbody');
    if (tbody) {
        tbody.innerHTML = '';
        const sortedClasses = Object.keys(classGroups).sort((a, b) => {
            const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
            const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
            return numA - numB;
        });

        if (sortedClasses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No student classes registered. Add students in the Master Grid.</td></tr>';
        } else {
            sortedClasses.forEach(c => {
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
}

async function generateMonthlyFeeCycle() {
    const cycleSelect = document.getElementById('cycleMonthSelect');
    const cycleMonth = cycleSelect ? cycleSelect.value : 'October 2026';
    const students = currentStudents || [];

    if (!students || students.length === 0) {
        alert('⚠️ No active student records found. Please wait for students to load or refresh.');
        return;
    }

    if (!confirm('Generate fee billing cycle for "' + cycleMonth + '" across all ' + students.length + ' active students? This will set active cycle dues in Supabase.')) {
        return;
    }

    const genBtn = document.querySelector('button[onclick="generateMonthlyFeeCycle()"]');
    const originalBtnHtml = genBtn ? genBtn.innerHTML : '<i class="fas fa-bolt mr-1"></i> Generate Cycle Dues';
    if (genBtn) {
        genBtn.disabled = true;
        genBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Generating Cycle...';
    }

    const sb = _getMasterHubSupabase();
    if (!sb) {
        alert('❌ Supabase database client not available. Please verify cloud connection.');
        if (genBtn) {
            genBtn.disabled = false;
            genBtn.innerHTML = originalBtnHtml;
        }
        return;
    }

    try {
        const dueDateStr = '25 ' + cycleMonth;
        let daysLeft = 24;
        try {
            const dueObj = new Date(dueDateStr);
            if (!isNaN(dueObj.getTime())) {
                const now = new Date();
                const diffTime = dueObj.getTime() - now.getTime();
                daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
        } catch (dEx) {
            daysLeft = 20;
        }

        const recordsToUpsert = [];
        let totalCycleAmount = 0;

        students.forEach((s, idx) => {
            const rollNo = s.rollNo || s.roll_no || s.id || ('EDU-C10-' + String(idx + 1).padStart(3, '0'));
            const sClass = s.class || s.class_name || '10';
            const stdFee = getStandardClassFee(sClass);
            const monthlyFee = Number(s.amount || s.fee) || stdFee;

            s.amount = monthlyFee;
            s.fee = monthlyFee;
            s.class = sClass;
            totalCycleAmount += monthlyFee;

            // Check if student is already cleared/paid for this cycle
            const rollKey = String(rollNo).toUpperCase().trim();
            const fRec = (typeof feeMap !== 'undefined' && feeMap) ? feeMap.get(rollKey) : null;
            const pmts = Array.isArray(fRec?.recent_payments) ? fRec.recent_payments : [];
            const isCyclePaid = pmts.some(p => p.fullMonth?.includes(cycleMonth) || (cycleMonth.includes('October') && p.month === 'OCT'));

            recordsToUpsert.push({
                roll_no: String(rollNo).trim(),
                current_due: isCyclePaid ? 0 : monthlyFee,
                due_date: isCyclePaid ? 'All Cleared' : dueDateStr,
                days_left: isCyclePaid ? 0 : daysLeft,
                updated_at: new Date().toISOString()
            });
        });

        console.log(`[MonthlyFeeCycle] Upserting ${recordsToUpsert.length} records into fees_records for ${cycleMonth}...`);

        // Batch upsert into Supabase fees_records (strictly valid schema columns!)
        const { error: sbError } = await sb
            .from('fees_records')
            .upsert(recordsToUpsert, { onConflict: 'roll_no' });

        if (sbError) {
            console.error('[MonthlyFeeCycle] Supabase upsert error:', sbError);
            throw sbError;
        }

        // Persist updated students to memory & localStorage
        originalStudents = JSON.parse(JSON.stringify(students));
        try {
            localStorage.setItem('students', JSON.stringify(students));
        } catch (e) {}

        // Immediately refresh the grid and summary cards
        renderMasterGrid(students);
        await updateFeeSummary();

        // Broadcast realtime notification to student mobile apps
        try {
            const feeChan = sb.channel('fee_realtime_broadcast');
            feeChan.subscribe((subStatus) => {
                if (subStatus === 'SUBSCRIBED') {
                    feeChan.send({
                        type: 'broadcast',
                        event: 'cycle_generated',
                        payload: {
                            cycle: cycleMonth,
                            dueDate: dueDateStr,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            });
        } catch (rtEx) {
            console.warn('[MonthlyFeeCycle] Realtime broadcast warning:', rtEx);
        }

        // Display in-page status alert
        const cycleAlertBox = document.getElementById('cycleStatusAlert');
        if (cycleAlertBox) {
            cycleAlertBox.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show my-3" role="alert">
                    <i class="fas fa-check-circle mr-2"></i>
                    <strong>${cycleMonth} Fee Cycle Active!</strong> Successfully generated dues for <strong>${recordsToUpsert.length} students</strong>. Total Expected Revenue: <strong>₹${totalCycleAmount.toLocaleString('en-IN')}</strong>. Due Date: <strong>${dueDateStr}</strong> (${daysLeft} days left).
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            `;
        }

        alert(`✅ Successfully generated "${cycleMonth}" billing cycle for ${recordsToUpsert.length} students in Supabase!\n\n• Due Date: ${dueDateStr} (${daysLeft} days left)\n• Total Expected Revenue: ₹${totalCycleAmount.toLocaleString('en-IN')}\n• All student mobile apps now reflect these active dues.`);

    } catch (err) {
        console.error('[MonthlyFeeCycle] Error generating cycle:', err);
        const cycleAlertBox = document.getElementById('cycleStatusAlert');
        if (cycleAlertBox) {
            cycleAlertBox.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show my-3" role="alert">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    <strong>Error Generating Cycle:</strong> ${escapeHtml(err.message || String(err))}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            `;
        }
        alert('❌ Failed to generate fee cycle: ' + (err.message || err));
    } finally {
        if (genBtn) {
            genBtn.disabled = false;
            genBtn.innerHTML = originalBtnHtml;
        }
    }
}

window.updateFeeSummary = updateFeeSummary;
window.generateMonthlyFeeCycle = generateMonthlyFeeCycle;

// ─── 3.1 BULK FEE SETTLEMENT & MARK PAID UP TO MONTH ─────────────────────────

const BULK_MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const BULK_MONTH_SHORTS = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

function updateBulkPaidRangePreview() {
    const startSelect = document.getElementById('bulkPaidStartMonth');
    const endSelect = document.getElementById('bulkPaidEndMonth');
    const classSelect = document.getElementById('bulkPaidClassSelect');
    const badge = document.getElementById('bulkMonthsPreviewBadge');

    if (!startSelect || !endSelect || !badge) return;

    let startIdx = parseInt(startSelect.value, 10);
    let endIdx = parseInt(endSelect.value, 10);

    if (startIdx > endIdx) {
        endSelect.value = startIdx;
        endIdx = startIdx;
    }

    const monthCount = endIdx - startIdx + 1;
    const startName = BULK_MONTH_SHORTS[startIdx];
    const endName = BULK_MONTH_SHORTS[endIdx];
    const targetClass = classSelect ? classSelect.value : 'all';
    const targetLabel = targetClass === 'all' ? 'All Classes' : `Class ${targetClass}`;

    badge.innerHTML = `<i class="fas fa-calendar-check mr-1"></i> ${targetLabel}: ${startName} 2026 → ${endName} 2026 (${monthCount} Month${monthCount > 1 ? 's' : ''})`;
}

function setBulkPaidPreset(startIdx, endIdx) {
    const startSelect = document.getElementById('bulkPaidStartMonth');
    const endSelect = document.getElementById('bulkPaidEndMonth');
    if (startSelect) startSelect.value = startIdx;
    if (endSelect) endSelect.value = endIdx;
    updateBulkPaidRangePreview();
}

async function markStudentsPaidUpToMonth() {
    const startSelect = document.getElementById('bulkPaidStartMonth');
    const endSelect = document.getElementById('bulkPaidEndMonth');
    const classSelect = document.getElementById('bulkPaidClassSelect');
    const btn = document.getElementById('btnBulkMarkPaid');
    const alertBox = document.getElementById('bulkPaidStatusAlert');

    let startIdx = startSelect ? parseInt(startSelect.value, 10) : 0;
    let endIdx = endSelect ? parseInt(endSelect.value, 10) : 9;

    if (startIdx > endIdx) {
        alert('Start month cannot be after the end month.');
        return;
    }

    const targetClass = classSelect ? classSelect.value : 'all';
    const allStudents = currentStudents || [];

    const targetStudents = targetClass === 'all'
        ? allStudents
        : allStudents.filter(s => {
            const rawCls = String(s.class || s.class_name || '').replace(/[^0-9]/g, '');
            return rawCls === targetClass;
        });

    if (targetStudents.length === 0) {
        alert('No students found for the selected target group.');
        return;
    }

    const monthCount = endIdx - startIdx + 1;
    const startMonthName = BULK_MONTH_NAMES[startIdx];
    const endMonthName = BULK_MONTH_NAMES[endIdx];

    const confirmMsg = `Are you sure you want to mark ${targetStudents.length} students as PAID from ${startMonthName} to ${endMonthName} (${monthCount} billing cycle${monthCount > 1 ? 's' : ''})?\n\nThis will:\n• Record verified receipt entries in Supabase\n• Award loyalty badges for all ${monthCount} months\n• Clear active dues (set current due to ₹0 for covered months)\n• Instantly update student mobile apps in real-time.`;

    if (typeof window.__confirmBypass === 'undefined' && !confirm(confirmMsg)) {
        return;
    }

    const originalBtnHtml = btn ? btn.innerHTML : '<i class="fas fa-check-double mr-1"></i> Mark Everyone Paid';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Clearing Fees...';
    }

    const sb = _getMasterHubSupabase();
    if (!sb) {
        alert('Database connection unavailable. Please check cloud status.');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
        return;
    }

    try {
        const clearedMonths = [];
        for (let i = startIdx; i <= endIdx; i++) {
            clearedMonths.push({
                index: i,
                name: BULK_MONTH_NAMES[i],
                short: BULK_MONTH_SHORTS[i],
                full: `${BULK_MONTH_NAMES[i]} 2026`
            });
        }

        let feeMap = new Map();
        try {
            const { data: fRows } = await sb
                .from('fees_records')
                .select('*');
            if (Array.isArray(fRows)) {
                fRows.forEach(r => {
                    if (r.roll_no) feeMap.set(String(r.roll_no).toUpperCase().trim(), r);
                });
            }
        } catch (fErr) {
            console.warn('[BulkPaid] Warning fetching current records:', fErr);
        }

        const now = new Date();
        const paidOnDateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const recordsToUpsert = [];

        // Check if current cycle (October = index 9) is included in the cleared range
        const isCurrentCycleCovered = endIdx >= 9;

        targetStudents.forEach(s => {
            const roll = s.rollNo || s.roll_no || s.id;
            if (!roll) return;
            const rollKey = String(roll).toUpperCase().trim();
            const fRec = feeMap.get(rollKey);

            const sClass = s.class || s.class_name || '10';
            const stdFee = getStandardClassFee(sClass);
            const monthlyFee = Number(s.amount || s.fee) || stdFee;

            // Merge recent_payments
            const existingPayments = Array.isArray(fRec?.recent_payments) ? [...fRec.recent_payments] : [];
            clearedMonths.forEach(m => {
                const pIdx = existingPayments.findIndex(p => p.fullMonth === m.full || p.month === m.short);
                const receiptItem = {
                    month: m.short,
                    fullMonth: m.full,
                    paidOn: paidOnDateStr,
                    amount: monthlyFee,
                    onTime: true,
                    status: 'Verified by Center Admin',
                    receiptNo: `REC-2026-${m.short}-${Math.floor(1000 + Math.random() * 9000)}`,
                    utr: 'ADMIN-BULK-SETTLED'
                };
                if (pIdx >= 0) {
                    existingPayments[pIdx] = receiptItem;
                } else {
                    existingPayments.push(receiptItem);
                }
            });

            // Merge loyalty_months
            const existingLoyalty = Array.isArray(fRec?.loyalty_months) ? [...fRec.loyalty_months] : [];
            clearedMonths.forEach(m => {
                if (!existingLoyalty.some(l => l.label === m.name || l.label === m.full)) {
                    existingLoyalty.push({ label: m.name, earned: true });
                }
            });

            const currentDue = isCurrentCycleCovered ? 0 : monthlyFee;
            const dueDate = isCurrentCycleCovered ? 'All Cleared' : '25 October 2026';
            const daysLeft = isCurrentCycleCovered ? 0 : 24;

            recordsToUpsert.push({
                roll_no: String(roll).trim(),
                current_due: currentDue,
                due_date: dueDate,
                days_left: daysLeft,
                months_paid_on_time: Math.max(fRec?.months_paid_on_time || 0, monthCount),
                loyalty_months: existingLoyalty,
                recent_payments: existingPayments,
                updated_at: now.toISOString()
            });
        });

        const { error: sbErr } = await sb
            .from('fees_records')
            .upsert(recordsToUpsert, { onConflict: 'roll_no' });

        if (sbErr) {
            throw sbErr;
        }

        // Also update local storage fees map for fees.html compatibility
        try {
            let localFees = JSON.parse(localStorage.getItem('fees')) || {};
            targetStudents.forEach(s => {
                const sId = s.id || s.rollNo || s.roll_no;
                const subjects = (Array.isArray(s.subjects) && s.subjects.length > 0) ? s.subjects : ['General'];
                clearedMonths.forEach(m => {
                    subjects.forEach(sub => {
                        localFees[`${sId}_${sub}_${m.name}_2026`] = 'Paid';
                        localFees[`${s.rollNo}_${sub}_${m.name}_2026`] = 'Paid';
                    });
                });
            });
            localStorage.setItem('fees', JSON.stringify(localFees));
        } catch (locErr) {
            console.warn('[BulkPaid] Local fees cache warning:', locErr);
        }

        // Recalculate fee summary widgets
        await updateFeeSummary();

        // Broadcast realtime notification to student mobile apps
        try {
            const feeChan = sb.channel('fee_realtime_broadcast');
            feeChan.subscribe((subStatus) => {
                if (subStatus === 'SUBSCRIBED') {
                    feeChan.send({
                        type: 'broadcast',
                        event: 'bulk_paid_up_to_month',
                        payload: {
                            targetGroup: targetClass,
                            startMonth: startMonthName,
                            endMonth: endMonthName,
                            monthCount: monthCount,
                            studentCount: targetStudents.length,
                            timestamp: now.toISOString()
                        }
                    });
                }
            });
        } catch (rtEx) {
            console.warn('[BulkPaid] Realtime broadcast warning:', rtEx);
        }

        if (alertBox) {
            alertBox.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show my-3" role="alert">
                    <i class="fas fa-check-double mr-2"></i>
                    <strong>Bulk Settlement Complete!</strong> Marked <strong>${targetStudents.length} students</strong> as <strong>PAID</strong> for <strong>${monthCount} months</strong> (${startMonthName} 2026 → ${endMonthName} 2026). Supabase records, receipts, and mobile app dues have been updated.
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            `;
        }

        alert(`✅ Bulk Settlement Successful!\n\n• Students Cleared: ${targetStudents.length}\n• Months Cleared: ${startMonthName} 2026 to ${endMonthName} 2026 (${monthCount} months)\n• Receipts Generated & Verified in Supabase\n• Student App Dues: ${isCurrentCycleCovered ? 'All Cleared (₹0)' : 'Updated'}`);

    } catch (err) {
        console.error('[BulkPaid] Error in bulk settlement:', err);
        if (alertBox) {
            alertBox.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show my-3" role="alert">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    <strong>Error in Bulk Settlement:</strong> ${escapeHtml(err.message || String(err))}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            `;
        }
        alert('❌ Error processing bulk settlement: ' + (err.message || err));
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
    }
}

window.updateBulkPaidRangePreview = updateBulkPaidRangePreview;
window.setBulkPaidPreset = setBulkPaidPreset;
window.markStudentsPaidUpToMonth = markStudentsPaidUpToMonth;

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
        modalEl.innerHTML = `
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
        </div>`;
        document.body.appendChild(modalEl);
    }

    // Parse existing details
    const rawTitle = item.title || '';
    const desc = item.description || '';
    const classMatch = rawTitle.match(/\[(Class\s*\d{1,2}|All Classes)\]/i);
    const subMatch = rawTitle.match(/\(([^)]+)\)/) || desc.match(/Subject:\s*([^\n|]+)/i);
    const cleanTitle = rawTitle.replace(/\[[^\]]+\]\s*/g, '').replace(/\([^)]+\)/g, '').trim();

    const examDateMatch = desc.match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r|]+)/i);
    const timeMatch = desc.match(/Time\s*:\s*([^\n\r|]+)/i);
    const venueMatch = desc.match(/(?:Venue|Room)\s*:\s*([^\n\r|]+)/i);
    const marksMatch = desc.match(/(?:Max|Total)\s*Marks\s*:\s*([^\n\r|]+)/i);
    const syllabusMatch = desc.match(/(?:Syllabus|Chapters|Portion)\s*:\s*([^\n\r|]+)/i);
    const showFromMatch = desc.match(/(?:Show From|Start Date)\s*:\s*([^\n\r|]+)/i);
    const stopDateMatch = desc.match(/(?:Valid Until|Stop Date|Expiry)\s*:\s*([^\n\r|]+)/i);
    const authorMatch = desc.match(/(?:Submitted\s*by|Faculty|Teacher|By)\s*:\s*([^\n\r|]+)/i);

    // Helpers to parse date to YYYY-MM-DD
    function toIso(dateInput) {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
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
        const fullTitle = `[${targetClass}] ${title} (${subject})`;
        const fullDesc = `Exam Date: ${friendlyExamDate}\nMax Marks: ${maxMarks}\nVenue: ${venue}\nSyllabus: ${syllabus}\nShow From: ${showFrom}\nValid Until: ${stopDate}\nSubmitted by: ${author}`;

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

        const timeString = `${examTime} • Test Paper • ${author}`;
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
