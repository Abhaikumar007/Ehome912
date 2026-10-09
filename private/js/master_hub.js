
// ─── PUSH NOTIFICATION DISPATCHER (EXPO PUSH API) ───────────────────────────
async function sendExpoPushNotification({ title, message, targetClass = 'All' }) {
    try {
        let sb = typeof _getMasterHubSupabase === 'function' ? _getMasterHubSupabase() : null;
        if (!sb && typeof _getSupabaseClient === 'function') sb = _getSupabaseClient();
        if (!sb && typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
            sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        if (!sb) {
            console.warn('[Push] Supabase client unavailable for push tokens query.');
            return 0;
        }

        let query = sb.from('push_tokens').select('push_token, class');
        if (targetClass && targetClass !== 'All') {
            const cleanTarget = String(targetClass).replace(/[^0-9]/g, '');
            if (cleanTarget) {
                query = query.or('class.eq.' + cleanTarget + ',class.ilike.%' + targetClass + '%');
            }
        }

        const { data: rows, error: tokenErr } = await query;
        if (tokenErr) {
            console.warn('[Push] Error fetching push tokens:', tokenErr);
            return 0;
        }
        if (!rows || rows.length === 0) {
            console.log('[Push] No registered push tokens found for target:', targetClass);
            return 0;
        }

        // Deduplicate tokens
        const uniqueTokens = Array.from(new Set(rows.map(r => r.push_token).filter(Boolean)));
        if (uniqueTokens.length === 0) return 0;

        console.log('[Push] Dispatching push notification to ' + uniqueTokens.length + ' devices...');

        // Build messages
        const messages = uniqueTokens.map(tok => ({
            to: tok,
            sound: 'default',
            title: title,
            body: message,
            channelId: 'default',
            priority: 'high',
        }));

        // Send in chunks of 100 using CORS-safe text/plain transport
        const chunkSize = 100;
        for (let i = 0; i < messages.length; i += chunkSize) {
            const chunk = messages.slice(i, i + chunkSize);
            try {
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: JSON.stringify(chunk),
                });
                console.log('[Push] Dispatched payload chunk to', chunk.length, 'devices.');
            } catch (postErr) {
                console.warn('[Push] Fetch dispatch error:', postErr);
            }
        }
        return uniqueTokens.length;
    } catch (pushErr) {
        console.warn('[Push] Push dispatch note:', pushErr);
        return 0;
    }
}

function cleanApprovedTitle(rawTitle) {
    if (!rawTitle) return 'Community Announcement';
    let t = String(rawTitle);

    // Extract class if formatted as [Class X] or [PENDING APPROVAL - Class X]
    let classTag = '';
    const classMatch = t.match(/\[(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i)
                    || t.match(/\[PENDING APPROVAL\s*-\s*(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i);
    if (classMatch) {
        classTag = classMatch[1];
    }

    // Strip all pending approval tags anywhere in the title
    t = t.replace(/\[PENDING APPROVAL[^\]]*\]/gi, '')
         .replace(/\[Test Alert\]/gi, '')
         .replace(/\[Exam Alert\]/gi, '');

    // Strip class tag from title body so we can format cleanly
    if (classTag) {
        const escapedClass = classTag.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        t = t.replace(new RegExp('\\[' + escapedClass + '\\]', 'gi'), '');
    }

    // Clean whitespace
    t = t.replace(/\s{2,}/g, ' ').trim();
    if (!t) t = 'Test Paper';

    // Prefix class tag if present and not "All Classes"
    if (classTag && !classTag.toLowerCase().includes('all classes')) {
        return '[' + classTag + '] ' + t;
    }
    return t;
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
                console.log('[MasterHub Realtime] Notifications changed:', payload.eventType);
                if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
                if (typeof window.refreshCurrentStudentModalOpinions === 'function') window.refreshCurrentStudentModalOpinions();
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
    if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
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

    // Auto-activate tab from URL hash if provided (e.g. #tab-broadcast)
    function activateTabFromHash() {
        const hash = window.location.hash;
        if (hash) {
            const hashLink = document.querySelector('a[href="' + hash + '"]');
            if (hashLink) {
                if (typeof $ !== 'undefined' && typeof $(hashLink).tab === 'function') {
                    $(hashLink).tab('show');
                } else {
                    hashLink.click();
                }
            }
        }
    }
    activateTabFromHash();
    window.addEventListener('hashchange', activateTabFromHash);

    const broadcastTabLink = document.getElementById('tab-broadcast-link');
    if (broadcastTabLink) {
        broadcastTabLink.addEventListener('shown.bs.tab', function () {
            loadActiveBroadcasts();
            if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
        });
        broadcastTabLink.addEventListener('click', function () {
            setTimeout(function() {
                loadActiveBroadcasts();
                if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
            }, 100);
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

        // Send live lock-screen push notifications to all phones
        let pushedCount = 0;
        try {
            pushedCount = await sendExpoPushNotification({
                title: (target !== 'All' ? '[' + target + '] ' : '') + title,
                message: msg,
                targetClass: target
            });
        } catch (_) {}

        const pushSummary = pushedCount > 0 ? (' (Sent push to ' + pushedCount + ' registered phone' + (pushedCount > 1 ? 's' : '') + ')') : '';
        alert('✅ Announcement broadcasted!' + pushSummary + ' All student and teacher apps will see it immediately.');
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

        // Send live lock-screen push notification to students in this class
        sendExpoPushNotification({
            title: '[Exam Alert - ' + className + '] ' + title,
            message: 'Subject: ' + subject + ' | Date: ' + examDate,
            targetClass: className
        });

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
                window._allLoadedAnnouncements = anns;
                const pendingAnns = anns.filter(a => a.title && (a.title.includes('[PENDING APPROVAL') || a.time_label === 'Pending Approval') && !a.title.includes('[REJECTED') && a.time_label !== 'Rejected');
                const rejectedAnns = anns.filter(a => a.title && (a.title.includes('[REJECTED') || a.time_label === 'Rejected'));
                const examAlerts = anns.filter(a => a.title && (a.title.includes('[Exam Alert') || a.title.includes('[Test Alert')) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval' && !a.title.includes('[REJECTED') && a.time_label !== 'Rejected');
                const regularAnns = anns.filter(a => (!a.title || (!a.title.includes('[Exam Alert') && !a.title.includes('[Test Alert'))) && !a.title.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval' && !a.title.includes('[REJECTED') && a.time_label !== 'Rejected');

                if (pendingAnns.length > 0) {
                    html += '<div class="alert alert-warning pending-approvals-banner mb-4 shadow-sm">'
                        + '<div class="d-flex justify-content-between align-items-center flex-wrap mb-2" style="gap: 8px;">'
                        + '<h6 class="font-weight-bold text-dark mb-0 d-flex align-items-center"><i class="fas fa-clock mr-2 text-warning"></i>Faculty Announcements Awaiting Admin Approval (' + pendingAnns.length + ')</h6>'
                        + '<span class="badge badge-warning text-dark font-weight-bold px-2 py-1">Requires Action</span>'
                        + '</div>'
                        + '<p class="small text-muted mb-3" style="line-height: 1.45;">Submitted by faculty members via mobile app. Review and approve to broadcast live to all student devices.</p>';

                    pendingAnns.forEach(a => {
                        const rawTitle = a.title || '';
                        const cleanTitle = cleanApprovedTitle(rawTitle);
                        const dateStr = a.created_at
                            ? new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Just now';
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
                                + '<div class="pending-test-grid">';

                            if (examDateMatch) {
                                bodyHtml += '<div class="pending-test-grid-item">'
                                    + '<span class="pending-test-meta-label"><i class="far fa-calendar-alt text-primary"></i>Exam Date</span>'
                                    + '<div class="pending-test-meta-value font-weight-bold text-dark">' + escapeHtml(examDateMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (maxMarksMatch) {
                                bodyHtml += '<div class="pending-test-grid-item">'
                                    + '<span class="pending-test-meta-label"><i class="fas fa-award text-warning"></i>Max Marks</span>'
                                    + '<div class="pending-test-meta-value font-weight-bold text-dark">' + escapeHtml(maxMarksMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (timeMatch) {
                                bodyHtml += '<div class="pending-test-grid-item">'
                                    + '<span class="pending-test-meta-label"><i class="far fa-clock text-info"></i>Time</span>'
                                    + '<div class="pending-test-meta-value text-dark">' + escapeHtml(timeMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (roomMatch) {
                                bodyHtml += '<div class="pending-test-grid-item">'
                                    + '<span class="pending-test-meta-label"><i class="fas fa-map-marker-alt text-danger"></i>Venue / Room</span>'
                                    + '<div class="pending-test-meta-value text-dark">' + escapeHtml(roomMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (syllabusMatch) {
                                bodyHtml += '<div class="pending-test-grid-item grid-col-full">'
                                    + '<span class="pending-test-meta-label"><i class="fas fa-book-open text-info"></i>Syllabus Portion</span>'
                                    + '<div class="pending-test-meta-value text-dark">' + escapeHtml(syllabusMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (submittedByMatch) {
                                bodyHtml += '<div class="pending-test-grid-item grid-col-full">'
                                    + '<span class="pending-test-meta-label"><i class="fas fa-chalkboard-teacher text-success"></i>Submitted By</span>'
                                    + '<div class="pending-test-meta-value font-weight-bold text-dark">' + escapeHtml(submittedByMatch[1].trim()) + '</div>'
                                    + '</div>';
                            }

                            if (remainingLines.length > 0) {
                                bodyHtml += '<div class="pending-test-grid-item grid-col-full mt-1 pt-2 border-top">'
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
                            // Header: Badges & Timestamp Row
                            + '<div class="broadcast-card-header mb-1">'
                            + '<div class="approval-meta-row d-flex align-items-center justify-content-between flex-wrap" style="gap: 6px;">'
                            + '<div class="approval-badges d-flex align-items-center flex-wrap" style="gap: 6px;">'
                            + '<span class="badge badge-warning text-dark font-weight-bold py-1 px-2"><i class="fas fa-clock mr-1"></i>Pending Approval</span>'
                            + (classTag ? '<span class="badge badge-primary font-weight-bold py-1 px-2">' + escapeHtml(classTag) + '</span>' : '')
                            + (isTest ? '<span class="badge badge-info font-weight-bold py-1 px-2"><i class="fas fa-file-alt mr-1"></i>Test Paper</span>' : '')
                            + '</div>'
                            + '<span class="approval-timestamp badge badge-light border text-secondary" title="' + escapeHtml(new Date(a.created_at).toLocaleString()) + '"><i class="far fa-clock mr-1"></i>' + escapeHtml(dateStr) + '</span>'
                            + '</div>'
                            // Header: Clean Left-Aligned Full-Width Title
                            + '<div class="approval-title-box mt-2 mb-1">'
                            + '<h5 class="approval-card-title text-dark font-weight-bold mb-0">' + escapeHtml(displayTitle) + '</h5>'
                            + '</div>'
                            + '</div>'

                            // Body Row (Full width)
                            + '<div class="broadcast-card-body w-100">'
                            + bodyHtml
                            + '</div>'

                            // Footer Action Row (Responsive & Touch Friendly)
                            + '<div class="broadcast-card-footer pending-card-footer">'
                            + '<div class="pending-footer-instruction">'
                            + '<small class="text-muted"><i class="fas fa-shield-alt text-warning mr-1"></i>Review & approve to broadcast live to all student devices</small>'
                            + '</div>'
                            + '<div class="broadcast-actions-area approval-actions-container">'
                            + '<button type="button" class="btn btn-sm btn-success btn-quick-approve font-weight-bold shadow-sm" onclick="window.requestApproveAnnouncement(\'' + a.id + '\', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-check-circle mr-1"></i> Quick Approve'
                            + '</button>'
                            + '<div class="approval-btn-pair">'
                            + '<button type="button" class="btn btn-sm btn-primary btn-edit-approve font-weight-bold shadow-sm" onclick="window.openEditApprovalModal(\'' + a.id + '\', this, event)" style="cursor: pointer;">'
                            + '<i class="fas fa-edit mr-1"></i> Edit & Approve'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger btn-reject font-weight-bold" data-action="reject" onclick="window.requestRejectAnnouncement(\'' + a.id + '\', this, event)" title="Reject announcement" style="cursor: pointer;">'
                            + '<i class="fas fa-times mr-1"></i> Reject'
                            + '</button>'
                            + '</div>'
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
                            + '<div class="broadcast-card-footer pt-2 border-top w-100" style="margin-top: 6px;">'
                            + '<div class="broadcast-actions-area d-flex align-items-center w-100" style="gap: 6px; width: 100% !important; display: flex !important;">'
                            + '<button type="button" class="btn btn-sm btn-outline-info px-2 py-2 btn-view-ann flex-grow-1 font-weight-bold" style="flex: 1 1 0 !important; min-width: 0 !important; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem !important;" data-id="' + a.id + '" onclick="window.openViewAnnouncementModal(\'' + a.id + '\', this, event)" title="View full details">'
                            + '<i class="fas fa-eye mr-1" style="pointer-events: none;"></i> View'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-primary px-2 py-2 btn-edit-ann flex-grow-1 font-weight-bold" style="flex: 1 1 0 !important; min-width: 0 !important; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem !important;" data-id="' + a.id + '" onclick="window.openEditAnnouncementModal(\'' + a.id + '\', this, event)" title="Edit this announcement">'
                            + '<i class="fas fa-edit mr-1" style="pointer-events: none;"></i> Edit'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-2 py-2 btn-delete-ann flex-grow-1 font-weight-bold" style="flex: 1 1 0 !important; min-width: 0 !important; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem !important;" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\'' + a.id + '\', this, event)" title="Delete this announcement">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>'
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
                            + '<div class="broadcast-card-footer pt-2 border-top w-100" style="margin-top: 6px;">'
                            + '<div class="broadcast-actions-area d-flex align-items-center w-100" style="gap: 6px; width: 100% !important; display: flex !important;">'
                            + '<button type="button" class="btn btn-sm btn-outline-info px-2 py-2 btn-view-ann flex-grow-1 font-weight-bold" style="flex: 1 1 0 !important; min-width: 0 !important; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem !important;" data-id="' + a.id + '" onclick="window.openViewAnnouncementModal(\'' + a.id + '\', this, event)" title="View full details">'
                            + '<i class="fas fa-eye mr-1" style="pointer-events: none;"></i> View'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-primary px-2 py-2 btn-edit-ann flex-grow-1 font-weight-bold" style="flex: 1 1 0 !important; min-width: 0 !important; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem !important;" data-id="' + a.id + '" onclick="window.openEditAnnouncementModal(\'' + a.id + '\', this, event)" title="Edit this exam alert">'
                            + '<i class="fas fa-edit mr-1" style="pointer-events: none;"></i> Edit'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-2 py-2 btn-delete-ann flex-grow-1 font-weight-bold" style="flex: 1 1 0 !important; min-width: 0 !important; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem !important;" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\'' + a.id + '\', this, event)" title="Delete this exam alert">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>'
                            + '</div>'
                            + '</div>';
                    });
                }
                // Add "Clear All Announcements" button at bottom
                // Rejected Announcements History
                if (rejectedAnns.length > 0) {
                    html += '<div class="mt-4 pt-3 border-top">'
                        + '<div class="d-flex justify-content-between align-items-center mb-2">'
                        + '<h6 class="font-weight-bold text-muted mb-0"><i class="fas fa-ban mr-1 text-danger"></i>Rejected Faculty Submissions History (' + rejectedAnns.length + ')</h6>'
                        + '</div>'
                        + '<div class="list-group shadow-sm" style="border-radius: 10px; overflow: hidden;">';

                    rejectedAnns.forEach(a => {
                        const dateStr = a.created_at ? new Date(a.created_at).toLocaleString() : '';
                        const cleanTitle = cleanApprovedTitle(a.title || '').replace(/^\[REJECTED\]\s*/i, '');
                        html += '<div class="list-group-item list-group-item-action d-flex justify-content-between align-items-start p-3 bg-light border" style="opacity: 0.9;">'
                            + '<div class="flex-grow-1 mr-3">'
                            + '<div class="d-flex align-items-center mb-1" style="gap: 6px;">'
                            + '<span class="badge badge-danger font-weight-bold"><i class="fas fa-times-circle mr-1"></i>Rejected</span>'
                            + '<strong class="text-dark">' + escapeHtml(cleanTitle) + '</strong>'
                            + '</div>'
                            + '<p class="small text-muted mb-1" style="white-space: pre-line;">' + escapeHtml(a.description || '') + '</p>'
                            + '<small class="text-muted"><i class="far fa-clock mr-1"></i>' + escapeHtml(dateStr) + '</small>'
                            + '</div>'
                            + '<button type="button" class="btn btn-sm btn-outline-secondary px-2 py-1 flex-shrink-0" onclick="window.executeDeleteAnnouncement(\'' + a.id + '\', this, event)" title="Permanently remove from history">'
                            + '<i class="fas fa-trash-alt mr-1"></i> Remove'
                            + '</button>'
                            + '</div>';
                    });
                    html += '</div></div>';
                }

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
        if (!item) throw new Error('Announcement not found in database.');

        const cleanTitle = cleanApprovedTitle(item.title);
        const desc = item.description || '';

        const isTestOrExam = (item && item.title && (item.title.toLowerCase().includes('test') || item.title.toLowerCase().includes('exam') || item.title.toLowerCase().includes('unit')))
            || (desc.includes('Exam Date:') || desc.includes('Max Marks:') || desc.includes('Syllabus:'))
            || (item && item.icon === 'calendar');

        let approvedTitle = cleanTitle;
        if (isTestOrExam) {
            const classMatch = approvedTitle.match(/^\[(Class\s*[^ \]]+)\]\s*(.*)$/i);
            if (classMatch) {
                approvedTitle = '[' + classMatch[1] + '] [Test Alert] ' + classMatch[2];
            } else {
                approvedTitle = '[Test Alert] ' + approvedTitle;
            }
        }

        // 1. Update announcement in Supabase removing [PENDING APPROVAL]
        const { error: updateErr } = await sb.from('announcements').update({
            title: approvedTitle,
            time_label: 'Just now',
            icon: isTestOrExam ? 'calendar' : 'megaphone',
            icon_bg: '#EBF3FF',
            icon_color: '#1A56DB',
            important: true
        }).eq('id', id);

        if (updateErr) throw updateErr;

        // 2. If it's a test/exam, sync to Timetable (classes table)
        if (isTestOrExam) {
            try {
                const examDateMatch = desc.match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r|]+)/i);
                const timeMatch = desc.match(/Time\s*:\s*([^\n\r|]+)/i);
                const venueMatch = desc.match(/(?:Venue|Room)\s*:\s*([^\n\r|]+)/i);
                const subMatch = (item.title || '').match(/\(([^)]+)\)/) || desc.match(/Subject:\s*([^\n\r|]+)/i);
                const classMatch = approvedTitle.match(/\[(Class\s*[^ \]]+)\]/i);
                const authorMatch = desc.match(/(?:Submitted\s*by|Faculty|Teacher|By)\s*:\s*([^\n\r|]+)/i);

                const classTag = classMatch ? classMatch[1].trim() : 'Class 10';
                const subject = subMatch ? subMatch[1].trim() : 'General';
                const teacherName = authorMatch ? authorMatch[1].trim() : 'Faculty Member';
                const timeStr = timeMatch ? timeMatch[1].trim() : '11:30 AM - 12:00 PM';
                const venueStr = venueMatch ? venueMatch[1].trim() : 'Exam Hall 1';

                // Format ISO date YYYY-MM-DD
                let examDateIso = '';
                if (examDateMatch) {
                    const parsedD = new Date(examDateMatch[1].trim());
                    if (!isNaN(parsedD.getTime())) {
                        const y = parsedD.getFullYear();
                        const m = String(parsedD.getMonth() + 1).padStart(2, '0');
                        const d = String(parsedD.getDate()).padStart(2, '0');
                        examDateIso = `${y}-${m}-${d}`;
                    }
                }
                if (!examDateIso) {
                    examDateIso = new Date().toISOString().split('T')[0];
                }

                // Delete duplicate slot if any
                await sb.from('classes')
                    .delete()
                    .eq('class_grade', classTag)
                    .eq('class_date', examDateIso)
                    .eq('subject', subject);

                // Insert into classes table as Test Paper slot for student and faculty timetable
                const timeString = `${timeStr} • Test Paper • ${teacherName}`;
                await sb.from('classes').insert({
                    roll_no: classTag,
                    class_grade: classTag,
                    subject: subject,
                    class_date: examDateIso,
                    time: timeString,
                    status: 'upcoming:TP',
                    published: true
                });

                // Update pending_tests table if entry exists
                try {
                    await sb.from('pending_tests').update({
                        status: 'approved',
                        approved_at: new Date().toISOString(),
                        time_str: timeStr,
                        venue_str: venueStr,
                        class_tag: classTag,
                        subject: subject,
                        date_str: examDateIso
                    }).ilike('title', '%' + cleanTitle.replace(/^\[[^\]]+\]\s*/, '') + '%');
                } catch (_) {}
            } catch (clsErr) {
                console.warn('[MasterHub] Error syncing approved test to timetable:', clsErr);
            }
        }

        showBroadcastStatus('✅ Announcement / Test "' + cleanTitle + '" approved and broadcasted to student & faculty apps!');
        await loadActiveBroadcasts();

        // Refresh timetable on page if present
        if (typeof window.initLiveAppTimetable === 'function') {
            window.initLiveAppTimetable('hubTimetablePlatform');
            window.initLiveAppTimetable('liveTimetablePlatform');
        }
    } catch (err) {
        console.error('[MasterHub] Failed to approve announcement:', err);
        showBroadcastStatus('Failed to approve announcement: ' + (err.message || err), true);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Quick Approve';
        }
    }
};



// ─── REJECT FACULTY ANNOUNCEMENT CONTROLLER & MODAL ───────────────────────────

window._pendingRejectAnnouncementId = null;

window.requestRejectAnnouncement = function (id, btnElement, evt) {
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    if (!id) return;

    window._pendingRejectAnnouncementId = id;

    // Retrieve details for confirmation modal
    let cleanTitle = 'Faculty Announcement';
    let author = 'Faculty Member';
    let classTag = 'All Classes';

    if (window._allLoadedAnnouncements && Array.isArray(window._allLoadedAnnouncements)) {
        const item = window._allLoadedAnnouncements.find(a => String(a.id) === String(id));
        if (item) {
            cleanTitle = cleanApprovedTitle(item.title || '');
            const authorMatch = (item.description || '').match(/(?:Submitted\s*by|Faculty|Teacher|By):\s*([^\n\r|]+)/i);
            if (authorMatch) author = authorMatch[1].trim();
            const classMatch = (item.title || '').match(/\[(Class\s*[^ \]]+)\]/i);
            if (classMatch) classTag = classMatch[1].trim();
        }
    }

    const detailsBox = document.getElementById('rejectAnnouncementConfirmDetails');
    if (detailsBox) {
        detailsBox.innerHTML = '<div><strong>Title:</strong> ' + escapeHtml(cleanTitle) + '</div>'
            + '<div><strong>Submitted by:</strong> ' + escapeHtml(author) + '</div>'
            + '<div><strong>Class:</strong> ' + escapeHtml(classTag) + '</div>';
        detailsBox.style.display = 'block';
    }

    // Reset button state
    const confirmBtn = document.getElementById('confirmExecuteRejectAnnouncementBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-times mr-1"></i> Yes, Reject';
    }

    // Open confirmation modal
    if (typeof $ !== 'undefined' && typeof $('#rejectAnnouncementConfirmModal').modal === 'function') {
        $('#rejectAnnouncementConfirmModal').modal('show');
    } else {
        const m = document.getElementById('rejectAnnouncementConfirmModal');
        if (m) {
            m.style.display = 'block';
            m.classList.add('show');
            document.body.classList.add('modal-open');
            let backdrop = document.getElementById('rejectAnnConfirmBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'rejectAnnConfirmBackdrop';
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        } else {
            // Native fallback
            if (confirm('Are you sure you want to reject this announcement?')) {
                window.confirmAndExecuteRejectAnnouncement();
            }
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


// ─── Timetable & Exam Deletion Synchronisation Helpers ─────────────────────────

function _parseExamDateToIso(str) {
    if (!str) return '';
    const clean = String(str).replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*[,\s]*/i, '').trim();
    const fullClean = String(str).trim();
    const isoM = fullClean.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (isoM) return `${isoM[1]}-${isoM[2].padStart(2, '0')}-${isoM[3].padStart(2, '0')}`;
    const dmyM = fullClean.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (dmyM) return `${dmyM[3]}-${dmyM[2].padStart(2, '0')}-${dmyM[1].padStart(2, '0')}`;
    let d = new Date(clean);
    if (isNaN(d.getTime())) d = new Date(fullClean);
    if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    return '';
}

function _extractExamDetailsFromItem(item) {
    const rawTitle = (item && item.title) || '';
    const desc = (item && item.description) || '';
    const timeLabel = (item && item.time_label) || '';

    let targetClass = item?.target_class || item?.targetClass || item?.class_grade || '';
    if (!targetClass) {
        const clsM = rawTitle.match(/\[(?:PENDING APPROVAL\s*-\s*)?(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i)
            || rawTitle.match(/\b(Class\s*\d{1,2})\b/i);
        if (clsM) targetClass = clsM[1].trim();
    }
    if (!targetClass) {
        const clsDescM = desc.match(/(?:Target\s*Class|Class)\s*:\s*([^\n\r|,]+)/i);
        if (clsDescM) targetClass = clsDescM[1].trim();
    }
    if (targetClass && /^\d{1,2}$/.test(targetClass)) {
        targetClass = 'Class ' + targetClass;
    }

    let examDateIso = '';
    const dateDescM = desc.match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r|]+)/i)
        || timeLabel.match(/(?:Exam|Date)\s*:\s*([^\n\r|]+)/i);
    if (dateDescM) {
        examDateIso = _parseExamDateToIso(dateDescM[1]);
    }
    if (!examDateIso && item?.exam_date) {
        examDateIso = _parseExamDateToIso(item.exam_date);
    }

    let subject = item?.subject || '';
    if (!subject) {
        const subDescM = desc.match(/Subject\s*:\s*([^\n\r|,]+)/i);
        if (subDescM) subject = subDescM[1].trim();
    }
    if (!subject) {
        const subParenM = rawTitle.match(/\(([^)]+)\)/);
        if (subParenM) subject = subParenM[1].trim();
    }
    if (!subject) {
        const knownSubjects = ['Computer Science', 'Mathematics', 'Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Accountancy', 'Economics', 'Business Studies'];
        for (const ks of knownSubjects) {
            if (new RegExp('\\b' + ks + '\\b', 'i').test(rawTitle) || new RegExp('\\b' + ks + '\\b', 'i').test(desc)) {
                subject = ks;
                break;
            }
        }
    }

    let teacherName = item?.author || '';
    const teacherDescM = desc.match(/(?:Submitted by|By|Teacher|Faculty)\s*:\s*([^\n\r|,]+)/i);
    if (teacherDescM) teacherName = teacherDescM[1].trim();

    let cleanTitle = rawTitle.replace(/\[PENDING APPROVAL[^\]]*\]/gi, '').replace(/\[Test Alert\]/gi, '').replace(/\[Exam Alert\]/gi, '').replace(/\[Class\s*[^\]]+\]/gi, '').trim();

    const isExam = /exam|test|test alert|exam alert|test paper/i.test(rawTitle)
        || (item && item.icon === 'calendar')
        || (timeLabel && timeLabel.includes('Exam'));

    return {
        targetClass,
        examDateIso,
        subject,
        teacherName,
        cleanTitle,
        isExam
    };
}

async function _deleteExamSlotsFromClasses(sb, details) {
    if (!sb || !details) return;
    const { targetClass, examDateIso, subject, teacherName, cleanTitle } = details;
    try {
        if (examDateIso) {
            if (targetClass && subject) {
                await sb.from('classes').delete().eq('class_date', examDateIso).eq('class_grade', targetClass).eq('subject', subject);
                await sb.from('classes').delete().eq('class_date', examDateIso).eq('roll_no', targetClass).eq('subject', subject);
            }
            if (subject) {
                await sb.from('classes').delete().eq('class_date', examDateIso).eq('subject', subject).ilike('time', '%Test Paper%');
                await sb.from('classes').delete().eq('class_date', examDateIso).ilike('subject', '%' + subject + '%').ilike('time', '%Test Paper%');
            }
            if (targetClass) {
                await sb.from('classes').delete().eq('class_date', examDateIso).eq('class_grade', targetClass).ilike('time', '%Test Paper%');
                await sb.from('classes').delete().eq('class_date', examDateIso).eq('roll_no', targetClass).ilike('time', '%Test Paper%');
            }
            if (teacherName && teacherName !== 'Faculty Member') {
                await sb.from('classes').delete().eq('class_date', examDateIso).ilike('time', '%' + teacherName + '%').ilike('time', '%Test Paper%');
            }
        }
        if (targetClass && subject) {
            await sb.from('classes').delete().eq('class_grade', targetClass).eq('subject', subject).ilike('time', '%Test Paper%');
            await sb.from('classes').delete().eq('roll_no', targetClass).eq('subject', subject).ilike('time', '%Test Paper%');
        }
        if (cleanTitle) {
            await sb.from('classes').delete().ilike('time', '%' + cleanTitle + '%');
        }
    } catch (err) {
        console.warn('[MasterHub] _deleteExamSlotsFromClasses notice:', err);
    }
}

async function _purgeOrphanedTestPaperClasses(sb) {
    if (!sb) return;
    try {
        const { data: allAnns } = await sb.from('announcements').select('*');
        const activeApprovedExams = (allAnns || []).filter(a => {
            const t = a.title || '';
            if (t.startsWith('[REJECTED]') || t.startsWith('[PENDING APPROVAL')) return false;
            return /exam|test|test alert|exam alert|test paper/i.test(t) || a.icon === 'calendar' || (a.time_label && a.time_label.includes('Exam'));
        });

        const { data: tpClasses } = await sb.from('classes').select('id, class_date, subject, class_grade, time').or('time.ilike.%Test Paper%,status.ilike.%TP%');
        if (!tpClasses || tpClasses.length === 0) return;

        const orphanIds = [];
        for (const c of tpClasses) {
            const classDate = c.class_date;
            const sub = (c.subject || '').toLowerCase().trim();

            const hasMatchingAnn = activeApprovedExams.some(a => {
                const dM = (a.description || '').match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r|]+)/i)
                    || (a.time_label || '').match(/(?:Exam|Date)\s*:\s*([^\n\r|]+)/i);
                const dIso = dM ? _parseExamDateToIso(dM[1]) : '';
                if (dIso && classDate && dIso !== classDate) return false;

                const annSubM = (a.description || '').match(/Subject\s*:\s*([^\n\r|,]+)/i);
                const annSub = annSubM ? annSubM[1].toLowerCase().trim() : '';
                const inTitle = (a.title || '').toLowerCase().includes(sub);
                const inDesc = (a.description || '').toLowerCase().includes(sub);

                return (annSub && annSub === sub) || inTitle || inDesc;
            });

            if (!hasMatchingAnn) {
                orphanIds.push(c.id);
            }
        }

        if (orphanIds.length > 0) {
            console.log('[MasterHub] Purging orphaned test paper rows from classes:', orphanIds);
            await sb.from('classes').delete().in('id', orphanIds);
        }
    } catch (err) {
        console.warn('[MasterHub] _purgeOrphanedTestPaperClasses notice:', err);
    }
}

window.confirmAndExecuteRejectAnnouncement = async function () {
    const id = window._pendingRejectAnnouncementId;
    if (!id) {
        window.closeRejectAnnouncementModal();
        return;
    }

    const confirmBtn = document.getElementById('confirmExecuteRejectAnnouncementBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Rejecting...';
    }

    try {
        const sb = _getMasterHubSupabase();
        if (!sb) throw new Error('Supabase database client not ready. Please refresh.');

        // 1. Fetch announcement row
        const { data: item, error: fetchErr } = await sb.from('announcements').select('*').eq('id', id).maybeSingle();
        if (fetchErr) throw fetchErr;
        if (!item) throw new Error('Announcement not found in database.');

        const rawTitle = item.title || '';
        const cleanTitle = cleanApprovedTitle(rawTitle);

        // 2. Update announcement status to Rejected
        const { error: updateErr } = await sb.from('announcements').update({
            title: '[REJECTED] ' + cleanTitle,
            description: 'Status: Rejected by Admin\nRejected At: ' + new Date().toLocaleString() + '\n\nOriginal Details:\n' + (item.description || ''),
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
            }).ilike('title', '%' + cleanTitle.replace(/^\[[^\]]+\]\s*/, '') + '%');
        } catch (_) {}

        // 4. Remove any pending or scheduled test slot from classes table
        try {
            const details = _extractExamDetailsFromItem(item);
            await _deleteExamSlotsFromClasses(sb, details);
            await _purgeOrphanedTestPaperClasses(sb);
        } catch (_) {}

        // 5. Send Supabase Realtime broadcast so student/faculty devices sync immediately
        try {
            const payload = { id, title: cleanTitle, rejected_at: new Date().toISOString() };
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'announcement_rejected',
                payload
            });
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'exam_deleted',
                payload
            });
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'classes_changed',
                payload
            });
            await sb.channel('teacher_classes_realtime').send({
                type: 'broadcast',
                event: 'classes_changed',
                payload
            });
        } catch (_) {}

        // 6. Close modal
        window.closeRejectAnnouncementModal();

        // 7. Show success confirmation message
        showBroadcastStatus('Announcement rejected successfully.');

        // 8. Refresh UI
        await loadActiveBroadcasts();
    } catch (err) {
        console.error('[MasterHub] Error rejecting announcement:', err);
        showBroadcastStatus('Failed to reject announcement: ' + (err.message || err), true);
        alert('Failed to reject announcement: ' + (err.message || err));
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-times mr-1"></i> Yes, Reject';
        }
    }
};

window.requestDeleteAnnouncement = async function (id, btnElement, evt) {
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

    const details = _extractExamDetailsFromItem(item);
    const isExam = details.isExam;

    // Prompt confirmation before deletion
    const confirmMessage = isExam
        ? 'Are you sure you want to delete this approved exam? It will also be completely removed from the Student and Faculty Portals & Timetables.'
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
        const cleanTitle = details.cleanTitle || cleanApprovedTitle(item?.title || '');

        // 1. Delete matching timetable slots from classes table
        await _deleteExamSlotsFromClasses(sb, details);

        // 2. Delete from announcements table
        const { error: delErr } = await sb.from('announcements').delete().eq('id', id);
        if (delErr) throw delErr;

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

        // 6. Run comprehensive orphan cleanup to purge any lingering or orphaned test paper slots
        await _purgeOrphanedTestPaperClasses(sb);

        // 7. Broadcast Realtime events to both student and faculty apps
        try {
            const payload = {
                id,
                title: cleanTitle,
                classGrade: details.targetClass,
                examDate: details.examDateIso,
                subject: details.subject,
                deleted_at: new Date().toISOString()
            };
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'exam_deleted',
                payload
            });
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'announcement_deleted',
                payload
            });
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'classes_changed',
                payload
            });
            await sb.channel('teacher_classes_realtime').send({
                type: 'broadcast',
                event: 'exam_deleted',
                payload
            });
            await sb.channel('teacher_classes_realtime').send({
                type: 'broadcast',
                event: 'classes_changed',
                payload
            });
        } catch (bcErr) {
            console.warn('[MasterHub] Broadcast error on delete:', bcErr);
        }

        // 8. Remove card from DOM
        const card = document.getElementById('annCard_' + id)
            || document.getElementById('pendingAnn_' + id)
            || (btnElement ? btnElement.closest('.broadcast-card-item') : null);
        if (card) card.remove();

        showBroadcastStatus(isExam ? 'Exam deleted successfully from Admin, Student, and Faculty Portals & Timetable.' : 'Announcement deleted successfully.');

        // 9. Refresh UI
        await loadActiveBroadcasts();

        // 10. Refresh live timetable if available
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

window.requestClearAll = async function (btnElement, evt) {
    if (evt) { evt.preventDefault(); evt.stopPropagation(); }
    const confirmed = confirm('Are you sure you want to clear ALL announcements and exam alerts? All scheduled exams will also be removed from Student and Faculty timetables.');
    if (!confirmed) return;

    const sb = _getMasterHubSupabase();
    if (!sb) return;

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Clearing...';
    }

    try {
        await sb.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await sb.from('academic_alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await sb.from('pending_tests').update({ status: 'rejected' }).eq('status', 'approved');
        await _purgeOrphanedTestPaperClasses(sb);

        try {
            await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'announcement_deleted', payload: { all: true } });
            await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'exam_deleted', payload: { all: true } });
            await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: { all: true } });
            await sb.channel('teacher_classes_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: { all: true } });
        } catch (_) {}

        showBroadcastStatus('All announcements and exam alerts removed successfully.');
        await loadActiveBroadcasts();
        if (typeof window.initLiveAppTimetable === 'function') {
            window.initLiveAppTimetable('hubTimetablePlatform');
            window.initLiveAppTimetable('liveTimetablePlatform');
        }
    } catch (err) {
        alert('Failed to clear: ' + (err.message || err));
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = '<i class="fas fa-broom mr-1"></i> Clear All Announcements';
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
    if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
    }
}

async function forcePullAllFromClouds() {
    if (!confirm('Pull latest student records from Google Sheets and Supabase?')) return;
    if (typeof sb_loadFromCloud === 'function') {
        const res = await sb_loadFromCloud();
        alert(res.msg || 'Data refreshed from cloud.');
        await refreshMasterData();
        testCloudHealth();
    if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
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
    if (!sb) { alert('Supabase client not ready. Please refresh.'); return; }

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
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
                <div class="modal-header bg-primary text-white py-3 px-4">
                    <h5 class="modal-title font-weight-bold d-flex align-items-center mb-0">
                        <i class="fas fa-edit mr-2"></i> Review, Edit & Schedule Exam Paper
                    </h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" onclick="window.closeEditApprovalModal()">
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
                                    <option value="Class 6">Class 6</option>
                                    <option value="Class 7">Class 7</option>
                                    <option value="Class 8">Class 8</option>
                                    <option value="Class 9">Class 9</option>
                                    <option value="Class 10">Class 10</option>
                                    <option value="Class 11">Class 11</option>
                                    <option value="Class 12">Class 12</option>
                                    <option value="All Classes">All Classes</option>
                                </select>
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">Subject</label>
                                <input type="text" class="form-control" id="edit_approval_subject" placeholder="e.g. Mathematics" required />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="font-weight-bold small text-secondary">Exam / Alert Title</label>
                            <input type="text" class="form-control font-weight-bold" id="edit_approval_title" placeholder="e.g. Unit 1: Algebra" required />
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
                            <textarea class="form-control" id="edit_approval_syllabus" rows="2" placeholder="e.g. Real Numbers, Polynomials"></textarea>
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
                            <input type="text" class="form-control" id="edit_approval_author" placeholder="e.g. Ms. Devi" />
                        </div>

                        <div class="modal-footer px-0 pb-0 pt-3 border-top mt-3">
                            <button type="button" class="btn btn-secondary px-3" data-dismiss="modal" onclick="window.closeEditApprovalModal()">Cancel</button>
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
    const classMatch = rawTitle.match(/\[(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i)
                    || rawTitle.match(/\[PENDING APPROVAL\s*-\s*(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i);
    const subMatch = rawTitle.match(/\(([^)]+)\)/) || desc.match(/Subject:\s*([^\n|]+)/i);
    const cleanTitle = cleanApprovedTitle(rawTitle).replace(/^\[[^\]]+\]\s*/g, '').replace(/\([^)]+\)/g, '').trim();

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

    // Class selection with dynamic option support
    const targetClass = classMatch ? classMatch[1] : 'Class 10';
    const classSelect = document.getElementById('edit_approval_class');
    if (classSelect) {
        let found = false;
        for (let i = 0; i < classSelect.options.length; i++) {
            if (classSelect.options[i].value.toLowerCase() === targetClass.toLowerCase()) {
                classSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            const opt = document.createElement('option');
            opt.value = targetClass;
            opt.textContent = targetClass;
            opt.selected = true;
            classSelect.appendChild(opt);
        }
    }

    document.getElementById('edit_approval_subject').value = subMatch ? subMatch[1].trim() : 'Mathematics';
    document.getElementById('edit_approval_title').value = cleanTitle || 'Test Paper';
    document.getElementById('edit_approval_exam_date').value = examDateIso;
    document.getElementById('edit_approval_time').value = timeMatch ? timeMatch[1].trim() : '11:30 AM - 12:00 PM';
    document.getElementById('edit_approval_venue').value = venueMatch ? venueMatch[1].trim() : 'Exam Hall 1';
    document.getElementById('edit_approval_marks').value = marksMatch ? parseInt(marksMatch[1].trim(), 10) || 100 : 100;
    document.getElementById('edit_approval_syllabus').value = syllabusMatch ? syllabusMatch[1].trim() : '';
    document.getElementById('edit_approval_show_from').value = showFromIso;
    document.getElementById('edit_approval_stop_date').value = stopDateIso;
    document.getElementById('edit_approval_author').value = authorMatch ? authorMatch[1].trim() : 'Faculty Member';

    // Show modal using jQuery or Vanilla JS
    if (typeof $ !== 'undefined' && typeof $('#editApprovalModal').modal === 'function') {
        $('#editApprovalModal').modal('show');
    } else {
        const m = document.getElementById('editApprovalModal');
        if (m) {
            m.style.display = 'block';
            m.classList.add('show');
            document.body.classList.add('modal-open');
            let backdrop = document.getElementById('editApprovalBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'editApprovalBackdrop';
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    }
};

window.closeEditApprovalModal = function() {
    if (typeof $ !== 'undefined' && typeof $('#editApprovalModal').modal === 'function') {
        $('#editApprovalModal').modal('hide');
    }
    const m = document.getElementById('editApprovalModal');
    if (m) {
        m.style.display = 'none';
        m.classList.remove('show');
    }
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('editApprovalBackdrop');
    if (backdrop) backdrop.remove();
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

        // Format friendly exam date (e.g. Sun, Oct 4, 2026)
        let friendlyExamDate = examDate;
        try {
            const parts = examDate.split('-');
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            friendlyExamDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } catch (_) {}

        // 1. Update announcement with edited metadata without [PENDING APPROVAL]
        const fullTitle = `[${targetClass}] [Test Alert] ${title} (${subject})`;
        const fullDesc = `Exam Date: ${friendlyExamDate}\nSubject: ${subject}\nMax Marks: ${maxMarks}\nVenue: ${venue}\nSyllabus: ${syllabus}\nShow From: ${showFrom}\nValid Until: ${stopDate}\nSubmitted by: ${author}`;

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
        window.closeEditApprovalModal();

        showBroadcastStatus('✅ Exam "' + title + '" successfully approved and synced to Timetable! Students will see it on their portal.');
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



// ── FACULTY OPINIONS MANAGEMENT (ADMIN FULL CONTROL) ───────────────
window._allAdminOpinions = [];

async function loadAdminOpinions(retryCount = 0) {
    const container = document.getElementById('adminOpinionsContainer');
    if (!container) return;

    if (!container.innerHTML.includes('table') && !container.innerHTML.includes('table-responsive')) {
        container.innerHTML = '<p class="text-muted"><i class="fas fa-spinner fa-spin mr-1"></i>Fetching faculty opinions from cloud...</p>';
    }

    const sb = (typeof _getUniversalSupabaseClient === 'function' ? _getUniversalSupabaseClient() : null) ||
               (typeof _getMasterHubSupabase === 'function' ? _getMasterHubSupabase() : null) ||
               (typeof _getSafeAdminSupabase === 'function' ? _getSafeAdminSupabase() : null) ||
               (typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null);

    if (!sb) {
        if (retryCount < 4) {
            setTimeout(() => loadAdminOpinions(retryCount + 1), 600);
            return;
        }
        container.innerHTML = '<div class="alert alert-danger py-2"><i class="fas fa-exclamation-circle mr-1"></i>Database connection unavailable. Please refresh the page.</div>';
        return;
    }

    try {
        const { data, error } = await sb
            .from('notifications')
            .select('*')
            .eq('type', 'teacher_opinion')
            .order('created_at', { ascending: false });

        if (error) {
            container.innerHTML = '<div class="alert alert-danger py-2"><i class="fas fa-exclamation-triangle mr-1"></i>Error loading opinions: ' + (error.message || error) + '</div>';
            return;
        }

        const opinions = [];
        (data || []).forEach(row => {
            try {
                const parsed = JSON.parse(row.message);
                opinions.push({
                    ...parsed,
                    supabaseRowId: row.id,
                    id: parsed.id || row.id,
                    rollNo: parsed.rollNo || row.roll_no || '',
                    studentName: parsed.studentName || 'Student',
                    teacher: parsed.teacher || row.title || 'Faculty',
                    subject: parsed.subject || 'General',
                    remark: parsed.remark || row.message,
                    status: parsed.status || 'approved',
                    submittedAt: parsed.submittedAt || row.time_label || (row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : 'Recent'),
                    dbCreatedAt: row.created_at
                });
            } catch {
                opinions.push({
                    id: row.id,
                    supabaseRowId: row.id,
                    rollNo: row.roll_no,
                    studentName: 'Student',
                    teacher: row.title || 'Faculty',
                    subject: 'General',
                    remark: row.message,
                    status: 'approved',
                    submittedAt: row.time_label || (row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : 'Recent'),
                    dbCreatedAt: row.created_at
                });
            }
        });

        window._allAdminOpinions = opinions;
        renderFilteredAdminOpinions(opinions);
    } catch (e) {
        console.error('[loadAdminOpinions]', e);
        container.innerHTML = '<div class="alert alert-danger py-2"><i class="fas fa-bug mr-1"></i>Exception: ' + e.message + '</div>';
    }
}
window.loadAdminOpinions = loadAdminOpinions;

function renderFilteredAdminOpinions(opinions) {
    const container = document.getElementById('adminOpinionsContainer');
    if (!container) return;

    if (!opinions || opinions.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-muted bg-light rounded border"><i class="fas fa-comment-slash fa-2x mb-2 text-secondary"></i><br>No faculty opinions or student remarks recorded yet.</div>';
        return;
    }

    let html = '<div class="table-responsive"><table class="table table-bordered table-hover bg-white mb-0" style="font-size:0.88rem;">' +
        '<thead class="thead-light"><tr>' +
        '<th>Student Profile</th>' +
        '<th>Faculty Member & Subject</th>' +
        '<th>Academic Remark / Opinion</th>' +
        '<th style="width:120px;text-align:center;">Status</th>' +
        '<th style="width:110px;">Submitted</th>' +
        '<th style="width:130px;text-align:center;">Actions</th>' +
        '</tr></thead><tbody>';

    opinions.forEach(op => {
        const isApproved = op.status === 'approved';
        const statusBadge = isApproved
            ? '<span class="badge badge-success px-2 py-1"><i class="fas fa-check-circle mr-1"></i>Approved</span>'
            : '<span class="badge badge-warning px-2 py-1 text-dark"><i class="fas fa-clock mr-1"></i>Pending Review</span>';

        const cleanRemark = String(op.remark || '').replace(/"/g, '&quot;');
        const safeStudent = String(op.studentName || op.rollNo || 'Student').replace(/'/g, "\\'");
        const safeRowId = String(op.supabaseRowId || op.id || '').replace(/'/g, "\\'");
        const safeJsonId = String(op.id || op.supabaseRowId || '').replace(/'/g, "\\'");
        const safeRoll = String(op.rollNo || '').replace(/'/g, "\\'");
        const safeStudentId = String(op.studentId || '').replace(/'/g, "\\'");
        const safeTeacher = String(op.teacher || 'Faculty').replace(/'/g, "\\'");
        const safeSubject = String(op.subject || 'Subject').replace(/'/g, "\\'");
        const trRowId = 'admin-op-row-' + (op.supabaseRowId || op.id);

        html += '<tr id="' + trRowId + '">' +
            '<td>' +
            '<a href="javascript:void(0)" onclick="openStudentProfileModal(\'' + safeStudentId + '\',\'' + safeRoll + '\')" class="font-weight-bold text-primary" style="text-decoration:none;">' + (op.studentName || 'Student') + ' <i class="fas fa-external-link-alt fa-xs ml-1"></i></a><br>' +
            '<small class="badge badge-light border text-muted"><i class="fas fa-id-badge mr-1"></i>' + (op.rollNo || '-') + '</small>' +
            '</td>' +
            '<td><strong>' + (op.teacher || 'Faculty') + '</strong><br><span class="badge badge-info">' + (op.subject || 'Subject') + '</span></td>' +
            '<td><div style="max-height:85px;overflow-y:auto;line-height:1.45;color:#2d3748;" class="p-1 rounded bg-light border-left">' + cleanRemark + '</div></td>' +
            '<td style="text-align:center;vertical-align:middle;">' + statusBadge + '</td>' +
            '<td style="vertical-align:middle;"><small class="text-muted"><i class="fas fa-calendar-alt mr-1"></i>' + (op.submittedAt || 'Recent') + '</small></td>' +
            '<td style="text-align:center;vertical-align:middle;">' +
            '<div class="d-flex justify-content-center" style="gap:4px;">' +
            '<button type="button" class="btn btn-sm btn-outline-primary" style="border-radius:6px;font-size:0.75rem;padding:3px 7px;" onclick="openStudentProfileModal(\'' + safeStudentId + '\',\'' + safeRoll + '\')" title="Open Student Profile & All Opinions">' +
            '<i class="fas fa-user-graduate mr-1"></i>Profile' +
            '</button>' +
            '<button type="button" class="btn btn-sm btn-outline-danger delete-admin-opinion-btn" style="border-radius:6px;font-size:0.75rem;padding:3px 7px;" data-row-id="' + safeRowId + '" data-json-id="' + safeJsonId + '" data-roll="' + safeRoll + '" data-student="' + safeStudent + '" data-teacher="' + safeTeacher + '" data-subject="' + safeSubject + '" onclick="deleteAdminOpinion(\'' + safeRowId + '\',\'' + safeJsonId + '\',\'' + safeRoll + '\',\'' + safeStudent + '\',\'' + safeTeacher + '\',\'' + safeSubject + '\')" title="Delete this opinion/remark">\n<i class="fas fa-trash-alt mr-1" style="pointer-events:none;"></i>Delete\n</button>' +
            '</div>' +
            '</td>' +
            '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}
window.renderFilteredAdminOpinions = renderFilteredAdminOpinions;

window.filterAdminOpinions = function() {
    const searchInput = document.getElementById('adminOpinionSearchInput');
    const statusSelect = document.getElementById('adminOpinionStatusFilter');

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusFilter = statusSelect ? statusSelect.value : 'all';

    const all = window._allAdminOpinions || [];
    const filtered = all.filter(op => {
        const matchesQuery = !query ||
            (op.studentName && op.studentName.toLowerCase().includes(query)) ||
            (op.rollNo && op.rollNo.toLowerCase().includes(query)) ||
            (op.teacher && op.teacher.toLowerCase().includes(query)) ||
            (op.subject && op.subject.toLowerCase().includes(query)) ||
            (op.remark && op.remark.toLowerCase().includes(query));

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'approved' && op.status === 'approved') ||
            (statusFilter === 'pending' && op.status !== 'approved');

        return matchesQuery && matchesStatus;
    });

    renderFilteredAdminOpinions(filtered);
};

// --- FACULTY OPINIONS CONFIRMATION MODAL & DELETION SYSTEM ---
window._pendingDeleteOpinion = null;

function ensureDeleteOpinionModalInDOM() {
    if (document.getElementById('deleteOpinionConfirmModal')) return;
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = `
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
    </div>`;
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
                await sb.from('notifications').delete().eq('type', 'teacher_opinion').ilike('message', `%"id":"${jsonId}"%`);
            }
            if (rollNo && jsonId) {
                await sb.from('notifications').delete().eq('type', 'teacher_opinion').eq('roll_no', rollNo).ilike('message', `%"id":"${jsonId}"%`);
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
            await fetch(`${su}/rest/v1/notifications?id=eq.${encodeURIComponent(rowId)}`, {
                method: 'DELETE',
                headers
            });
        }
        if (jsonId) {
            await fetch(`${su}/rest/v1/notifications?type=eq.teacher_opinion&message=ilike.*${encodeURIComponent(jsonId)}*`, {
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
});

// Auto-run if DOM ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(loadAdminOpinions, 350);
}


// ─── ACTIVE ANNOUNCEMENT & LIVE ALERT EDIT CONTROLLER ────────────────────────

window.ensureEditAnnouncementModalInDOM = function () {
    if (document.getElementById('editAnnouncementModal')) return;

    const modalHtml = `
    <div class="modal fade" id="editAnnouncementModal" tabindex="-1" role="dialog" aria-labelledby="editAnnouncementModalLabel" aria-hidden="true" style="z-index: 1065;">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 14px; overflow: hidden;">
                <div class="modal-header bg-primary text-white py-3">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-edit fa-lg mr-2"></i>
                        <div>
                            <h5 class="modal-title font-weight-bold mb-0" id="editAnnouncementModalLabel">Edit Active Announcement & Live Alert</h5>
                            <small class="text-white-50">Modify existing alert details and broadcast updates live to students and faculty</small>
                        </div>
                    </div>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" onclick="window.closeEditAnnouncementModal()" style="opacity: 0.9; outline: none;">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form id="editAnnouncementForm" onsubmit="window.handleSaveEditedAnnouncement(event)">
                    <div class="modal-body p-4" style="max-height: 75vh; overflow-y: auto;">
                        <input type="hidden" id="edit_ann_id" />

                        <!-- Section 1: Classification & Target Scope -->
                        <div class="card p-3 mb-3 border-0" style="background: #f8fafc; border-radius: 10px; border-left: 4px solid #3b82f6 !important;">
                            <h6 class="font-weight-bold text-dark mb-2"><i class="fas fa-bullseye mr-1 text-primary"></i> Target Audience & Classification</h6>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-secondary">Priority / Alert Type</label>
                                    <select class="form-control" id="edit_ann_type" onchange="window.toggleEditAnnTypeFields()">
                                        <option value="exam">📅 Academic Exam / Test Alert</option>
                                        <option value="urgent">🚨 Urgent Alert</option>
                                        <option value="notice">📢 General Notice</option>
                                        <option value="holiday">🌴 Holiday / Reschedule</option>
                                        <option value="event">🏆 Event / Celebration</option>
                                    </select>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-secondary">Target Class / Student Scope</label>
                                    <select class="form-control" id="edit_ann_class">
                                        <option value="All">All Students & Teachers</option>
                                        <option value="Class 12">Class 12</option>
                                        <option value="Class 11">Class 11</option>
                                        <option value="Class 10">Class 10</option>
                                        <option value="Class 9">Class 9</option>
                                        <option value="Class 8">Class 8</option>
                                        <option value="Class 7">Class 7</option>
                                        <option value="Class 6">Class 6</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group mb-0">
                                    <label class="font-weight-bold small text-secondary">Syllabus Stream Scope</label>
                                    <select class="form-control" id="edit_ann_syllabus_stream">
                                        <option value="Both">Both (State Syllabus & CBSE)</option>
                                        <option value="State Syllabus">State Syllabus Only</option>
                                        <option value="CBSE">CBSE Only</option>
                                    </select>
                                </div>
                                <div class="col-md-6 form-group mb-0">
                                    <label class="font-weight-bold small text-secondary">Subject (Optional)</label>
                                    <input type="text" class="form-control" id="edit_ann_subject" placeholder="e.g. Computer Science, Physics, Mathematics" />
                                </div>
                            </div>
                        </div>

                        <!-- Section 2: Alert Title & Content -->
                        <div class="form-group">
                            <label class="font-weight-bold small text-secondary">Alert Title <span class="text-danger">*</span></label>
                            <input type="text" class="form-control font-weight-bold" id="edit_ann_title" placeholder="e.g. Unit 6 Revision / Physics Test" required />
                        </div>

                        <div class="form-group" id="edit_ann_msg_group">
                            <label class="font-weight-bold small text-secondary">Message / Details Content</label>
                            <textarea class="form-control" id="edit_ann_msg" rows="3" placeholder="Enter full announcement details to be shown on student and faculty dashboards..."></textarea>
                        </div>

                        <!-- Section 3: Academic Exam Specific Details -->
                        <div id="edit_ann_exam_section" class="card p-3 mb-3 border-0" style="background: #fef2f2; border-radius: 10px; border-left: 4px solid #ef4444 !important;">
                            <h6 class="font-weight-bold text-danger mb-2"><i class="fas fa-file-signature mr-1"></i> Academic Test & Exam Information</h6>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">📅 Exam Date</label>
                                    <input type="date" class="form-control" id="edit_ann_exam_date" />
                                </div>
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">🎯 Max Marks</label>
                                    <input type="number" class="form-control" id="edit_ann_max_marks" placeholder="100" />
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">📍 Venue / Room</label>
                                    <input type="text" class="form-control" id="edit_ann_venue" placeholder="e.g. Exam Hall 1, Room 204" />
                                </div>
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">👨‍🏫 Faculty / Submitted By</label>
                                    <input type="text" class="form-control" id="edit_ann_author" placeholder="e.g. Faculty Member / Center Admin" />
                                </div>
                            </div>
                            <div class="form-group mb-0">
                                <label class="font-weight-bold small text-dark">📚 Prescribed Syllabus (Chapters / Portion)</label>
                                <textarea class="form-control" id="edit_ann_syllabus" rows="2" placeholder="e.g. Unit 6: Object Oriented Programming&#10;Unit 7: Data Structures"></textarea>
                            </div>
                        </div>

                        <!-- Section 4: Schedule, Timing & Visibility Dates -->
                        <div class="card p-3 mb-3 border-0 shadow-sm" style="background: #eff6ff; border-radius: 10px; border-left: 4px solid #2563eb !important;">
                            <h6 class="font-weight-bold text-primary mb-2">
                                <i class="fas fa-calendar-alt mr-1"></i> Schedule & Alert Visibility Dates
                            </h6>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">Show From Date (Start Date)</label>
                                    <input type="date" class="form-control" id="edit_ann_start_date" />
                                    <small class="text-muted">Alert appears on student devices from this date onwards.</small>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">Valid Until Date (End Date / Expiry)</label>
                                    <input type="date" class="form-control" id="edit_ann_end_date" />
                                    <small class="text-muted">Alert automatically disappears after this date passes.</small>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group mb-0">
                                    <label class="font-weight-bold small text-dark">⏰ Start Time</label>
                                    <input type="text" class="form-control" id="edit_ann_start_time" placeholder="e.g. 11:30 AM" />
                                </div>
                                <div class="col-md-6 form-group mb-0">
                                    <label class="font-weight-bold small text-dark">⏰ End Time</label>
                                    <input type="text" class="form-control" id="edit_ann_end_time" placeholder="e.g. 1:00 PM" />
                                </div>
                            </div>
                        </div>

                        <!-- Section 5: Display Settings -->
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">Display Badge / Time Label</label>
                                <input type="text" class="form-control" id="edit_ann_time_label" placeholder="e.g. Just now, Exam: Sat, Oct 10, 2026" />
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">Display Icon</label>
                                <select class="form-control" id="edit_ann_icon">
                                    <option value="calendar">📅 Calendar (Exam / Date)</option>
                                    <option value="megaphone">📢 Megaphone (Notice / Broadcast)</option>
                                    <option value="trophy">🏆 Trophy (Event / Award)</option>
                                    <option value="bell">🔔 Bell (Alert)</option>
                                </select>
                            </div>
                        </div>

                        <div class="custom-control custom-switch mt-2">
                            <input type="checkbox" class="custom-control-input" id="edit_ann_important">
                            <label class="custom-control-label font-weight-bold text-dark" for="edit_ann_important">
                                Mark as High Priority / Highlighted Alert Banner
                            </label>
                            <small class="d-block text-muted">Pins this announcement at the top of the mobile home screen.</small>
                        </div>
                    </div>
                    <div class="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                        <button type="button" class="btn btn-secondary px-3" data-dismiss="modal" onclick="window.closeEditAnnouncementModal()">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary font-weight-bold px-4 shadow-sm" id="saveEditAnnBtn">
                            <i class="fas fa-save mr-1"></i> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);
};

window.toggleEditAnnTypeFields = function () {
    const type = document.getElementById('edit_ann_type')?.value || 'notice';
    const examSection = document.getElementById('edit_ann_exam_section');
    const iconSelect = document.getElementById('edit_ann_icon');
    const importantCheck = document.getElementById('edit_ann_important');

    if (examSection) {
        if (type === 'exam') {
            examSection.style.display = 'block';
            if (iconSelect && (!iconSelect.value || iconSelect.value === 'megaphone')) {
                iconSelect.value = 'calendar';
            }
        } else {
            // Keep accessible or slightly faded for non-exams
            examSection.style.display = 'none';
        }
    }
};

window.openEditAnnouncementModal = async function (id, btn, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (!id) return;

    window.ensureEditAnnouncementModalInDOM();

    const sb = _getMasterHubSupabase();
    let item = null;

    if (window._allLoadedAnnouncements && Array.isArray(window._allLoadedAnnouncements)) {
        item = window._allLoadedAnnouncements.find(a => String(a.id) === String(id));
    }

    if (!item && sb) {
        try {
            const { data, error } = await sb.from('announcements').select('*').eq('id', id).maybeSingle();
            if (!error && data) item = data;
        } catch (fetchErr) {
            console.warn('[MasterHub] Error fetching announcement for edit:', fetchErr);
        }
    }

    if (!item) {
        alert('Could not find announcement details. Please refresh the page.');
        return;
    }

    const rawTitle = item.title || '';
    const desc = item.description || '';

    // Helpers to parse date to YYYY-MM-DD
    function toIso(dateInput) {
        if (!dateInput) return '';
        const clean = String(dateInput).trim();
        const isoM = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (isoM) {
            return isoM[1] + '-' + isoM[2].padStart(2, '0') + '-' + isoM[3].padStart(2, '0');
        }
        const d = new Date(clean);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return y + '-' + m + '-' + day;
        }
        return '';
    }

    // 1. Determine Type
    let type = 'notice';
    const isExam = /exam|test|unit\s*test|paper/i.test(rawTitle)
        || /exam\s*date|max\s*marks|syllabus/i.test(desc)
        || item.icon === 'calendar';
    if (isExam) type = 'exam';
    else if (item.important || /urgent/i.test(rawTitle)) type = 'urgent';
    else if (item.icon === 'calendar' || /holiday/i.test(rawTitle)) type = 'holiday';
    else if (item.icon === 'trophy' || /event/i.test(rawTitle)) type = 'event';

    // 2. Class Scope
    let targetClass = 'All';
    const clsMatch = rawTitle.match(/\[(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i)
        || rawTitle.match(/\[Exam Alert\s*-\s*(Class\s*\d{1,2})\]/i)
        || desc.match(/(?:Class|Grade):\s*([^\n\r|,]+)/i);
    if (clsMatch) {
        targetClass = clsMatch[1].trim();
        if (targetClass === 'All Classes') targetClass = 'All';
    }

    // 3. Syllabus Stream Scope
    let syllabusStream = 'Both';
    const sylStreamMatch = rawTitle.match(/\[(State Syllabus|CBSE|Both)\]/i)
        || desc.match(/(?:Syllabus Stream|Stream):\s*(State Syllabus|CBSE|Both)/i);
    if (sylStreamMatch) {
        syllabusStream = sylStreamMatch[1];
    } else if (/State Syllabus/i.test(desc) && !desc.match(/Syllabus:\s*(?!State Syllabus)/i)) {
        syllabusStream = 'State Syllabus';
    } else if (/CBSE/i.test(desc) && !desc.match(/Syllabus:\s*(?!CBSE)/i)) {
        syllabusStream = 'CBSE';
    }

    // 4. Subject
    let subject = '';
    const subMatch = rawTitle.match(/\(([^)]+)\)$/)
        || desc.match(/Subject:\s*([^\n\r|]+)/i);
    if (subMatch) {
        subject = subMatch[1].trim();
    }

    // 5. Clean Title
    let cleanTitle = rawTitle
        .replace(/\[PENDING APPROVAL[^\]]*\]/gi, '')
        .replace(/\[Exam Alert[^\]]*\]/gi, '')
        .replace(/\[Test Alert\]/gi, '')
        .replace(/\[Class\s*[^\]]+\]/gi, '')
        .replace(/\[State Syllabus\]/gi, '')
        .replace(/\[CBSE\]/gi, '')
        .replace(/\[Both\]/gi, '')
        .replace(/\[REJECTED[^\]]*\]/gi, '')
        .trim();
    if (subject && cleanTitle.endsWith('(' + subject + ')')) {
        cleanTitle = cleanTitle.slice(0, -(subject.length + 2)).trim();
    }

    // 6. Dates
    const examDateMatch = desc.match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r|]+)/i);
    const examDateIso = examDateMatch ? toIso(examDateMatch[1].trim()) : '';

    const showFromMatch = desc.match(/(?:Show From|Start Date|Visible From)\s*:\s*([^\n\r|]+)/i);
    const showFromIso = showFromMatch ? toIso(showFromMatch[1].trim()) : '';

    const stopDateMatch = desc.match(/(?:Valid Until|Stop Date|Expiry Date|Expiry)\s*:\s*([^\n\r|]+)/i);
    const stopDateIso = stopDateMatch ? toIso(stopDateMatch[1].trim()) : (examDateIso || '');

    // 7. Times
    let startTime = '';
    let endTime = '';
    const timeMatch = desc.match(/(?:Time|Exam Time):\s*([^\n\r|]+)/i);
    if (timeMatch) {
        const timeSlot = timeMatch[1].trim();
        const parts = timeSlot.split(/\s*[-–]\s*/);
        if (parts.length >= 1) startTime = parts[0].trim();
        if (parts.length >= 2) endTime = parts[1].trim();
    }

    // 8. Venue & Marks & Author & Syllabus
    const marksMatch = desc.match(/(?:Max|Total)\s*Marks:\s*([^\n\r|]+)/i);
    const maxMarks = marksMatch ? parseInt(marksMatch[1].trim(), 10) || 100 : 100;

    const venueMatch = desc.match(/(?:Venue|Room):\s*([^\n\r|]+)/i);
    const venue = venueMatch ? venueMatch[1].trim() : 'Exam Hall 1';

    const authorMatch = desc.match(/(?:Submitted by|Faculty|Author|Teacher|By):\s*([^\n\r|]+)/i);
    const author = authorMatch ? authorMatch[1].trim() : (item.author || 'Center Admin');

    const sylMatch = desc.match(/Syllabus:\s*([^\n\r]+)/i);
    let syllabusText = sylMatch ? sylMatch[1].trim() : '';
    if (syllabusText === 'State Syllabus' || syllabusText === 'CBSE' || syllabusText === 'Both') {
        // If syllabus field only mirrored the stream name, preserve stream and let chapters be editable
        if (!sylStreamMatch) syllabusStream = syllabusText;
    }

    // 9. Clean Message
    const metaRegex = /(?:Exam\s*Date|Subject|Max\s*Marks|Venue|Syllabus|Show\s*From|Valid\s*Until|Time|Submitted\s*by):[^\n\r]*/gi;
    let cleanMsg = desc.replace(metaRegex, '').replace(/\|/g, '').trim();

    // Fill form
    document.getElementById('edit_ann_id').value = item.id;
    document.getElementById('edit_ann_type').value = type;

    // Target Class dropdown
    const classSelect = document.getElementById('edit_ann_class');
    if (classSelect) {
        let found = false;
        for (let i = 0; i < classSelect.options.length; i++) {
            if (classSelect.options[i].value.toLowerCase() === targetClass.toLowerCase()) {
                classSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            const opt = document.createElement('option');
            opt.value = targetClass;
            opt.textContent = targetClass;
            opt.selected = true;
            classSelect.appendChild(opt);
        }
    }

    document.getElementById('edit_ann_syllabus_stream').value = syllabusStream;
    document.getElementById('edit_ann_subject').value = subject;
    document.getElementById('edit_ann_title').value = cleanTitle || rawTitle;
    document.getElementById('edit_ann_msg').value = cleanMsg;

    document.getElementById('edit_ann_exam_date').value = examDateIso;
    document.getElementById('edit_ann_max_marks').value = maxMarks;
    document.getElementById('edit_ann_venue').value = venue;
    document.getElementById('edit_ann_author').value = author;
    document.getElementById('edit_ann_syllabus').value = syllabusText;
    const instrMatch = desc.match(/Instructions?:\s*([^\n\r]+)/i);
    const instrEl = document.getElementById('edit_ann_instructions');
    if (instrEl) instrEl.value = instrMatch ? instrMatch[1].trim() : '';

    document.getElementById('edit_ann_start_date').value = showFromIso;
    document.getElementById('edit_ann_end_date').value = stopDateIso;
    document.getElementById('edit_ann_start_time').value = startTime;
    document.getElementById('edit_ann_end_time').value = endTime;

    document.getElementById('edit_ann_time_label').value = item.time_label || 'Just now';
    document.getElementById('edit_ann_icon').value = item.icon || (type === 'exam' ? 'calendar' : 'megaphone');
    document.getElementById('edit_ann_important').checked = !!item.important;

    window.toggleEditAnnTypeFields();

    // Show modal using jQuery / Bootstrap or Vanilla fallback
    if (typeof $ !== 'undefined' && typeof $('#editAnnouncementModal').modal === 'function') {
        $('#editAnnouncementModal').modal('show');
    } else {
        const m = document.getElementById('editAnnouncementModal');
        if (m) {
            m.style.display = 'block';
            m.classList.add('show');
            document.body.classList.add('modal-open');
            let backdrop = document.getElementById('editAnnBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'editAnnBackdrop';
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    }
};

window.closeEditAnnouncementModal = function () {
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
};

window.handleSaveEditedAnnouncement = async function (e) {
    if (e) e.preventDefault();

    const id = document.getElementById('edit_ann_id').value;
    const type = document.getElementById('edit_ann_type').value;
    const targetClass = document.getElementById('edit_ann_class').value;
    const syllabusStream = document.getElementById('edit_ann_syllabus_stream').value;
    const subject = document.getElementById('edit_ann_subject').value.trim();
    const title = document.getElementById('edit_ann_title').value.trim();
    const message = document.getElementById('edit_ann_msg').value.trim();

    const examDate = document.getElementById('edit_ann_exam_date').value;
    const maxMarks = document.getElementById('edit_ann_max_marks').value || '100';
    const venue = document.getElementById('edit_ann_venue').value.trim() || 'Exam Hall 1';
    const author = document.getElementById('edit_ann_author').value.trim() || 'Center Admin';
    const syllabus = document.getElementById('edit_ann_syllabus').value.trim();
    const instructions = document.getElementById('edit_ann_instructions') ? document.getElementById('edit_ann_instructions').value.trim() : '';

    const startDate = document.getElementById('edit_ann_start_date').value;
    const endDate = document.getElementById('edit_ann_end_date').value;
    const startTime = document.getElementById('edit_ann_start_time').value.trim();
    const endTime = document.getElementById('edit_ann_end_time').value.trim();

    const timeLabelInput = document.getElementById('edit_ann_time_label').value.trim();
    const iconInput = document.getElementById('edit_ann_icon').value;
    const isImportant = document.getElementById('edit_ann_important').checked;

    if (!id) {
        alert('Missing announcement ID. Please try again.');
        return;
    }
    if (!title) {
        alert('Please enter an Announcement / Alert Title.');
        return;
    }

    const saveBtn = document.getElementById('saveEditAnnBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving Changes...';
    }

    try {
        const sb = _getMasterHubSupabase();
        if (!sb) throw new Error('Supabase client not initialized. Please refresh.');

        // Format friendly exam date (e.g. Sat, Oct 10, 2026)
        let friendlyExamDate = examDate;
        if (examDate) {
            try {
                const parts = examDate.split('-');
                const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                friendlyExamDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            } catch (_) {}
        }

        // Construct combined time slot if both start & end exist
        let timeSlot = '';
        if (startTime && endTime) {
            timeSlot = startTime + ' - ' + endTime;
        } else if (startTime) {
            timeSlot = startTime;
        }

        // Build Title
        let fullTitle = '';
        if (type === 'exam') {
            const classPrefix = targetClass !== 'All' ? '[' + targetClass + ']' : '[All Classes]';
            const syllabusPrefix = syllabusStream && syllabusStream !== 'Both' ? '[' + syllabusStream + '] ' : '';
            const subjectSuffix = subject ? ' (' + subject + ')' : '';
            fullTitle = classPrefix + ' [Test Alert] ' + syllabusPrefix + title + subjectSuffix;
        } else {
            const classPrefix = targetClass !== 'All' ? '[' + targetClass + '] ' : '';
            const syllabusPrefix = syllabusStream && syllabusStream !== 'Both' ? '[' + syllabusStream + '] ' : '';
            fullTitle = classPrefix + syllabusPrefix + title;
        }

        // Build Description
        let fullDesc = '';
        if (type === 'exam') {
            const lines = [];
            if (friendlyExamDate) lines.push('Exam Date: ' + friendlyExamDate);
            if (subject) lines.push('Subject: ' + subject);
            lines.push('Max Marks: ' + maxMarks);
            if (venue) lines.push('Venue: ' + venue);
            const sylContent = syllabus || (syllabusStream !== 'Both' ? syllabusStream : 'Full Syllabus');
            lines.push('Syllabus: ' + sylContent);
            if (instructions) lines.push('Instructions: ' + instructions);
            if (startDate) lines.push('Show From: ' + startDate);
            if (endDate) lines.push('Valid Until: ' + endDate);
            if (timeSlot) lines.push('Time: ' + timeSlot);
            if (message) lines.push(message);
            if (author) lines.push('Submitted by: ' + author);
            fullDesc = lines.join('\n');
        } else {
            const lines = [];
            if (message) lines.push(message);
            if (startDate) lines.push('Show From: ' + startDate);
            if (endDate) lines.push('Valid Until: ' + endDate);
            if (timeSlot) lines.push('Time: ' + timeSlot);
            fullDesc = lines.join('\n');
        }

        // Build Icons & Badge
        let icon = iconInput || 'megaphone';
        let iconBg = '#F8FAFC';
        let iconColor = '#475467';
        let timeLabel = timeLabelInput || 'Just now';

        if (type === 'exam') {
            icon = 'calendar';
            iconBg = '#EFF6FF';
            iconColor = '#1A56DB';
            if (!timeLabelInput && friendlyExamDate) {
                timeLabel = 'Exam: ' + friendlyExamDate;
            }
        } else if (type === 'urgent') {
            icon = 'megaphone';
            iconBg = '#FEF3F2';
            iconColor = '#F04438';
            if (!timeLabelInput) timeLabel = 'Urgent Alert';
        } else if (type === 'holiday') {
            icon = 'calendar';
            iconBg = '#ECFDF5';
            iconColor = '#10B981';
            if (!timeLabelInput) timeLabel = 'Notice';
        } else if (type === 'event') {
            icon = 'trophy';
            iconBg = '#EFF6FF';
            iconColor = '#3B82F6';
            if (!timeLabelInput) timeLabel = 'Event';
        }

        const updatePayload = {
            title: fullTitle,
            description: fullDesc,
            time_label: timeLabel,
            icon: icon,
            icon_bg: iconBg,
            icon_color: iconColor,
            important: isImportant
        };
        // 1. Update announcement in Supabase
        const { error: updateErr } = await sb.from('announcements').update(updatePayload).eq('id', id);
        if (updateErr) throw updateErr;

        // 2. If it's an Exam / Test alert, sync to timetable 'classes' table
        if (type === 'exam' && examDate) {
            try {
                const classTag = targetClass !== 'All' ? targetClass : 'Class 10';
                const subTag = subject || 'General';
                const examTimeStr = timeSlot || '11:30 AM - 12:00 PM';

                // Remove previous slot if matching
                await sb.from('classes')
                    .delete()
                    .eq('class_grade', classTag)
                    .eq('class_date', examDate)
                    .eq('subject', subTag);

                // Insert updated Test Paper slot
                await sb.from('classes').insert({
                    roll_no: classTag,
                    class_grade: classTag,
                    subject: subTag,
                    class_date: examDate,
                    time: examTimeStr + ' • Test Paper • ' + author,
                    status: 'upcoming:TP',
                    published: true
                });
            } catch (clsErr) {
                console.warn('[MasterHub] Error updating classes slot for edited test:', clsErr);
            }
        }

        // 3. Send Supabase Realtime broadcast
        try {
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'announcement_updated',
                payload: { id, title: fullTitle, updated_at: new Date().toISOString() }
            });
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'exam_updated',
                payload: { id, title: fullTitle, updated_at: new Date().toISOString() }
            });
        } catch (be) {
            console.warn('[MasterHub] Realtime broadcast error:', be);
        }

        // Close modal
        window.closeEditAnnouncementModal();

        // Show confirmation message
        showBroadcastStatus('✅ Announcement "' + title + '" updated successfully! Changes immediately reflect across all student & faculty portals.');

        // Refresh feed
        await loadActiveBroadcasts();

        // Refresh live timetable if available
        if (typeof window.initLiveAppTimetable === 'function') {
            window.initLiveAppTimetable('hubTimetablePlatform');
            window.initLiveAppTimetable('liveTimetablePlatform');
        }
    } catch (err) {
        console.error('[MasterHub] Error updating announcement:', err);
        showBroadcastStatus('Failed to update announcement: ' + (err.message || err), true);
        alert('Failed to save announcement: ' + (err.message || err));
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Save Changes';
        }
    }
};

// Global click delegation for Edit buttons
document.addEventListener('click', function (evt) {
    const editBtn = evt.target.closest('.btn-edit-ann');
    if (editBtn) {
        const annId = editBtn.getAttribute('data-id');
        if (annId) {
            window.openEditAnnouncementModal(annId, editBtn, evt);
        }
    }
});


// ─── ACTIVE ANNOUNCEMENT & LIVE ALERT VIEW CONTROLLER ────────────────────────

window._currentlyViewedAnnouncementId = null;

window.openViewAnnouncementModal = async function (id, btn, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (!id) return;

    window._currentlyViewedAnnouncementId = id;

    const sb = _getMasterHubSupabase();
    let item = null;
    if (window._allLoadedAnnouncements && Array.isArray(window._allLoadedAnnouncements)) {
        item = window._allLoadedAnnouncements.find(a => String(a.id) === String(id));
    }
    if (!item && sb) {
        try {
            const { data } = await sb.from('announcements').select('*').eq('id', id).maybeSingle();
            if (data) item = data;
        } catch (_) {}
    }
    if (!item) {
        alert('Could not load announcement details. Please refresh the page.');
        return;
    }

    const rawTitle = item.title || '';
    const desc = item.description || '';

    // Determine type
    const isExam = /exam|test|test alert|exam alert|test paper/i.test(rawTitle)
        || /exam\s*date|max\s*marks|syllabus/i.test(desc)
        || item.icon === 'calendar';

    // Parse class scope
    let classTag = 'All Classes';
    const clsMatch = rawTitle.match(/\[(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i)
        || rawTitle.match(/\[Exam Alert\s*-\s*(Class\s*\d{1,2})\]/i)
        || desc.match(/(?:Class|Grade):\s*([^\n\r|,]+)/i);
    if (clsMatch) classTag = clsMatch[1].trim();

    // Parse syllabus stream
    let streamTag = 'Both Streams';
    const sylStreamMatch = rawTitle.match(/\[(State Syllabus|CBSE|Both)\]/i)
        || desc.match(/(?:Syllabus Stream|Stream):\s*(State Syllabus|CBSE|Both)/i);
    if (sylStreamMatch) streamTag = sylStreamMatch[1];

    // Parse subject
    let subject = '';
    const subMatch = rawTitle.match(/\(([^)]+)\)$/)
        || desc.match(/Subject:\s*([^\n\r|]+)/i);
    if (subMatch) subject = subMatch[1].trim();

    // Clean title
    let cleanTitle = rawTitle
        .replace(/\[PENDING APPROVAL[^\]]*\]/gi, '')
        .replace(/\[Exam Alert[^\]]*\]/gi, '')
        .replace(/\[Test Alert\]/gi, '')
        .replace(/\[Class\s*[^\]]+\]/gi, '')
        .replace(/\[State Syllabus\]/gi, '')
        .replace(/\[CBSE\]/gi, '')
        .replace(/\[Both\]/gi, '')
        .replace(/\[REJECTED[^\]]*\]/gi, '')
        .trim();

    // Author
    const authorMatch = desc.match(/(?:Submitted by|Faculty|Author|Teacher|By):\s*([^\n\r|]+)/i);
    const author = authorMatch ? authorMatch[1].trim() : (item.author || 'Super Admin');

    // Dates & Times
    const examDateMatch = desc.match(/(?:Exam\s*Date|ExamDate|Date)\s*:\s*([^\n\r|]+)/i);
    const examDate = examDateMatch ? examDateMatch[1].trim() : '-';

    const marksMatch = desc.match(/(?:Max|Total)\s*Marks:\s*([^\n\r|]+)/i);
    const maxMarks = marksMatch ? marksMatch[1].trim() : '100';

    const venueMatch = desc.match(/(?:Venue|Room):\s*([^\n\r|]+)/i);
    const venue = venueMatch ? venueMatch[1].trim() : 'Exam Hall 1';

    const timeMatch = desc.match(/(?:Time|Exam Time):\s*([^\n\r|]+)/i);
    const timeSlot = timeMatch ? timeMatch[1].trim() : '-';

    const sylMatch = desc.match(/Syllabus:\s*([^\n\r]+)/i);
    const syllabus = sylMatch ? sylMatch[1].trim() : streamTag;

    const instrMatch = desc.match(/Instructions?:\s*([^\n\r]+)/i);

    // Populate modal DOM elements
    const titleEl = document.getElementById('view_ann_title');
    if (titleEl) titleEl.textContent = cleanTitle || rawTitle;

    const authorEl = document.getElementById('view_ann_author');
    if (authorEl) authorEl.textContent = author;

    const updatedEl = document.getElementById('view_ann_updated_at');
    if (updatedEl) updatedEl.textContent = item.time_label || (item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now');

    const typeBadge = document.getElementById('view_ann_type_badge');
    if (typeBadge) {
        if (isExam) {
            typeBadge.className = 'badge badge-danger font-weight-bold';
            typeBadge.innerHTML = '<i class="fas fa-calendar-alt mr-1"></i>Academic Exam Alert';
        } else {
            typeBadge.className = 'badge badge-primary font-weight-bold';
            typeBadge.innerHTML = '<i class="fas fa-bullhorn mr-1"></i>Global Broadcast';
        }
    }

    const scopeBadge = document.getElementById('view_ann_scope_badge');
    if (scopeBadge) scopeBadge.textContent = classTag;

    const streamBadge = document.getElementById('view_ann_stream_badge');
    if (streamBadge) streamBadge.textContent = streamTag;

    // Exam section
    const examSec = document.getElementById('view_ann_exam_details');
    if (examSec) {
        if (isExam) {
            examSec.style.display = 'block';
            const edEl = document.getElementById('view_ann_exam_date');
            if (edEl) edEl.textContent = examDate;
            const esEl = document.getElementById('view_ann_subject');
            if (esEl) esEl.textContent = subject || 'General';
            const emEl = document.getElementById('view_ann_max_marks');
            if (emEl) emEl.textContent = maxMarks;
            const evEl = document.getElementById('view_ann_venue');
            if (evEl) evEl.textContent = venue;
            const etEl = document.getElementById('view_ann_time_slot');
            if (etEl) etEl.textContent = timeSlot;
            const eyEl = document.getElementById('view_ann_syllabus');
            if (eyEl) eyEl.textContent = syllabus;

            const instrBox = document.getElementById('view_ann_instructions_box');
            if (instrBox) {
                if (instrMatch) {
                    instrBox.style.display = 'block';
                    const inEl = document.getElementById('view_ann_instructions');
                    if (inEl) inEl.textContent = instrMatch[1].trim();
                } else {
                    instrBox.style.display = 'none';
                }
            }
        } else {
            examSec.style.display = 'none';
        }
    }

    // Clean Message
    const metaRegex = /(?:Exam\s*Date|Subject|Max\s*Marks|Venue|Syllabus|Show\s*From|Valid\s*Until|Time|Submitted\s*by|Instructions?):[^\n\r]*/gi;
    let cleanMsg = desc.replace(metaRegex, '').replace(/\|/g, '').trim();
    const msgEl = document.getElementById('view_ann_message');
    if (msgEl) {
        msgEl.textContent = cleanMsg || (isExam ? 'This academic exam is scheduled and active for students.' : 'General announcement broadcasted to students and teachers.');
    }

    // Show modal using Bootstrap or Vanilla fallback
    if (typeof $ !== 'undefined' && typeof $('#viewAnnouncementModal').modal === 'function') {
        $('#viewAnnouncementModal').modal('show');
    } else {
        const m = document.getElementById('viewAnnouncementModal');
        if (m) {
            m.style.display = 'block';
            m.classList.add('show');
            document.body.classList.add('modal-open');
            let backdrop = document.getElementById('viewAnnBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'viewAnnBackdrop';
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    }
};

window.closeViewAnnouncementModal = function () {
    if (typeof $ !== 'undefined' && typeof $('#viewAnnouncementModal').modal === 'function') {
        $('#viewAnnouncementModal').modal('hide');
    }
    const m = document.getElementById('viewAnnouncementModal');
    if (m) {
        m.style.display = 'none';
        m.classList.remove('show');
    }
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('viewAnnBackdrop');
    if (backdrop) backdrop.remove();
};

window.switchToEditFromViewModal = function () {
    const id = window._currentlyViewedAnnouncementId;
    window.closeViewAnnouncementModal();
    if (id) {
        setTimeout(function() {
            window.openEditAnnouncementModal(id);
        }, 200);
    }
};
