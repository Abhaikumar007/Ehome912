// ════════════════════════════════════════════════════════════════
//  sheets-client.js  —  Edu Home Cloud Sync Layer (Google Sheets)
//  Drop-in replacement for supabase-client.js.
//  Uses Google Apps Script web app as the API backend.
//  Offline-safe: if network is unavailable, all functions return
//  gracefully and localStorage data continues to work.
// ════════════════════════════════════════════════════════════════

/** Returns true if Sheets API config is available */
function _sheetsReady() {
    return typeof SHEETS_API_URL !== 'undefined' && SHEETS_API_URL && SHEETS_API_URL !== '';
}

/** Helper: make a GET request to the Apps Script web app */
async function _sheetsGet(action) {
    if (!_sheetsReady()) return null;
    try {
        const url = SHEETS_API_URL + '?action=' + action + '&token=' + encodeURIComponent(SHEETS_SECRET || '');
        const res = await fetch(url);
        if (!res.ok) {
            console.error('[Sheets] GET ' + action + ' failed:', res.status, res.statusText);
            return null;
        }
        const json = await res.json();
        if (!json.ok) {
            console.error('[Sheets] GET ' + action + ' error:', json.error);
            return null;
        }
        return json;
    } catch (e) {
        console.warn('[Sheets] GET ' + action + ' network error:', e.message);
        return null;
    }
}

/** Helper: make a POST request to the Apps Script web app */
async function _sheetsPost(body) {
    if (!_sheetsReady()) return null;
    try {
        body.token = SHEETS_SECRET || '';
        const res = await fetch(SHEETS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            console.error('[Sheets] POST ' + body.action + ' failed:', res.status, res.statusText);
            return null;
        }
        const json = await res.json();
        if (!json.ok) {
            console.error('[Sheets] POST ' + body.action + ' error:', json.error);
            return null;
        }
        return json;
    } catch (e) {
        console.warn('[Sheets] POST ' + (body.action || '?') + ' network error:', e.message);
        return null;
    }
}

// ── DEBUG ─────────────────────────────────────────────────────────

/**
 * Full diagnostic: logs every step to console AND returns an object
 * with all findings so the UI can display them.
 */
window.sb_debug = async function () {
    const out = [];

    // 1. Check config values loaded
    out.push('📌 SHEETS_API_URL = ' + (typeof SHEETS_API_URL !== 'undefined' ? SHEETS_API_URL : '❌ UNDEFINED'));
    out.push('📌 SHEETS_SECRET = ' + (typeof SHEETS_SECRET !== 'undefined' ? '***' + SHEETS_SECRET.slice(-4) : '❌ UNDEFINED'));

    // 2. Ping the API
    try {
        const url = SHEETS_API_URL + '?action=ping&token=' + encodeURIComponent(SHEETS_SECRET || '');
        const res = await fetch(url);
        out.push('🌐 Ping status: ' + res.status + ' ' + res.statusText);
        const body = await res.text();
        out.push('🌐 Ping response: ' + body.slice(0, 200));
    } catch (e) {
        out.push('❌ Ping failed: ' + e.message);
    }

    // 3. Try to query students
    try {
        const url = SHEETS_API_URL + '?action=debug&token=' + encodeURIComponent(SHEETS_SECRET || '');
        const res = await fetch(url);
        const body = await res.text();
        out.push('📋 Debug response: ' + body.slice(0, 300));
    } catch (e) {
        out.push('❌ Debug fetch failed: ' + e.message);
    }

    // 4. Try full getStudents
    if (_sheetsReady()) {
        const result = await _sheetsGet('getStudents');
        if (result && result.data) {
            out.push('✅ getStudents OK, rows returned: ' + result.data.length);
        } else {
            out.push('❌ getStudents failed or returned no data');
        }
    } else {
        out.push('❌ Sheets API not configured (SHEETS_API_URL missing)');
    }

    // 5. localStorage status
    const lsStudents = JSON.parse(localStorage.getItem('students')) || [];
    out.push('💾 localStorage students count: ' + lsStudents.length);

    console.log('[Sheets Debug]\n' + out.join('\n'));
    return out;
};

// ── LOAD FROM CLOUD (run on every page load) ──────────────────────

/**
 * Fetches all students + fees from Google Sheets and writes them into localStorage.
 * This keeps every device in sync automatically on page open.
 * Returns: { ok, students, fees } or { ok: false, msg }
 */
window.sb_loadFromCloud = async function () {
    if (!_sheetsReady()) return { ok: false, msg: 'App is running offline (no Sheets API configured)' };

    try {
        // 1. Fetch students
        const stuResult = await _sheetsGet('getStudents');
        if (!stuResult || !stuResult.data) {
            return { ok: false, msg: 'Could not load students from Google Sheets' };
        }

        // 2. Fetch fees
        const feeResult = await _sheetsGet('getFees');
        if (!feeResult || !feeResult.data) {
            return { ok: false, msg: 'Could not load fees from Google Sheets' };
        }

        // 3. Convert to localStorage shapes
        const students = stuResult.data.map(function (row) {
            return {
                id:          String(row.id),
                name:        row.name || '',
                class:       String(row['class'] || ''),
                school:      row.school      || '',
                phone:       String(row.phone || ''),
                joiningDate: row.joining_date || '',
                amount:      row.monthly_fee != null ? String(row.monthly_fee) : '',
                subjects:    row.subjects    || []
            };
        });

        const fees = {};
        feeResult.data.forEach(function (row) {
            if (row.status === 'Paid') {
                fees[row.student_id + '_' + row.subject + '_' + row.month + '_' + row.year] = 'Paid';
            }
        });

        // 4. Write to localStorage
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('fees', JSON.stringify(fees));

        console.log('[Cloud Load] Loaded ' + students.length + ' students, ' + feeResult.data.length + ' fee records from Google Sheets.');
        return { ok: true, students: students, fees: fees };

    } catch (e) {
        console.warn('[Cloud Load] Error:', e.message);
        return { ok: false, msg: e.message };
    }
};

// ── helpers ──────────────────────────────────────────────────────

/** Convert localStorage student object → Sheets row format */
function _toSheetStudent(s) {
    return {
        id:           s.id,
        name:         s.name,
        'class':      s.class,
        school:       s.school  || '',
        phone:        s.phone,
        joining_date: s.joiningDate || '',
        monthly_fee:  s.amount ? Number(s.amount) : '',
        subjects:     s.subjects || []
    };
}

/** Convert Sheets row → localStorage student shape */
function _fromSheetStudent(row) {
    return {
        id:          String(row.id),
        name:        row.name || '',
        class:       String(row['class'] || ''),
        school:      row.school      || '',
        phone:       String(row.phone || ''),
        joiningDate: row.joining_date || '',
        amount:      row.monthly_fee != null && row.monthly_fee !== '' ? String(row.monthly_fee) : '',
        subjects:    row.subjects    || []
    };
}

// ── STUDENTS ─────────────────────────────────────────────────────

window.sb_getStudents = async function () {
    if (!_sheetsReady()) return null;
    const result = await _sheetsGet('getStudents');
    if (!result || !result.data) return null;
    return result.data.map(_fromSheetStudent);
};

window.sb_saveStudent = async function (student) {
    if (!_sheetsReady()) return false;
    const result = await _sheetsPost({
        action: 'saveStudent',
        student: _toSheetStudent(student)
    });
    if (!result) { console.error('[Sheets] saveStudent failed'); return false; }
    return true;
};

window.sb_deleteStudent = async function (id) {
    if (!_sheetsReady()) return false;
    const result = await _sheetsPost({
        action: 'deleteStudent',
        id: id
    });
    if (!result) { console.error('[Sheets] deleteStudent failed'); return false; }
    return true;
};

// ── FEES ─────────────────────────────────────────────────────────

window.sb_getFees = async function () {
    if (!_sheetsReady()) return null;
    const result = await _sheetsGet('getFees');
    if (!result || !result.data) return null;
    const feesObj = {};
    result.data.forEach(function (row) {
        var key = row.student_id + '_' + row.subject + '_' + row.month + '_' + row.year;
        feesObj[key] = row.status;
    });
    return feesObj;
};

window.sb_toggleFee = async function (studentId, subject, month, year, newStatus) {
    if (!_sheetsReady()) return;
    await _sheetsPost({
        action: 'toggleFee',
        fee: {
            student_id: studentId,
            subject: subject,
            month: month,
            year: Number(year),
            status: newStatus
        }
    });
};

// ── ONE-TIME MIGRATION ────────────────────────────────────────────

window.sb_migrateFromLocalStorage = async function () {
    if (!_sheetsReady()) return { ok: false, msg: 'App is offline, cannot sync to cloud.' };

    const students = JSON.parse(localStorage.getItem('students')) || [];
    const feesRaw  = JSON.parse(localStorage.getItem('fees'))     || {};

    if (students.length === 0) {
        return { ok: false, msg: 'No students found in localStorage to migrate.' };
    }

    // Convert students to sheet format
    var studentRows = students.map(_toSheetStudent);

    // Convert fees object to array of rows
    var validStudentIds = {};
    students.forEach(function (s) { validStudentIds[s.id] = true; });

    var feeRows = [];
    var orphanCount = 0;

    Object.keys(feesRaw).forEach(function (key) {
        var parts = key.split('_');
        if (parts.length < 4) return;
        var studentId = parts[0];
        var year      = Number(parts[parts.length - 1]);
        var month     = parts[parts.length - 2];
        var subject   = parts.slice(1, parts.length - 2).join('_');

        if (!validStudentIds[studentId]) {
            orphanCount++;
            return;
        }

        if (feesRaw[key] === 'Paid') {
            feeRows.push({
                student_id: studentId,
                subject: subject,
                month: month,
                year: year,
                status: 'Paid'
            });
        }
    });

    if (orphanCount > 0) {
        console.warn('[Migrate] Skipped ' + orphanCount + ' orphaned fee records (student was deleted).');
    }

    // Send to Google Sheets
    var result = await _sheetsPost({
        action: 'migrate',
        students: studentRows,
        fees: feeRows
    });

    if (!result) {
        return { ok: false, msg: 'Network error — could not reach Google Sheets API.' };
    }

    return {
        ok: true,
        msg: '✅ ' + result.msg + (orphanCount > 0 ? ' (' + orphanCount + ' orphaned fee records skipped)' : '')
    };
};
