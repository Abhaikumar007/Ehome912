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

/**
 * Helper: fetch with a timeout so the UI never hangs forever.
 * Default 15 seconds for normal ops, 60 seconds for migration.
 */
function _fetchWithTimeout(url, options, timeoutMs) {
    timeoutMs = timeoutMs || 15000;
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, timeoutMs);

    options = options || {};
    options.signal = controller.signal;

    return fetch(url, options).finally(function () {
        clearTimeout(timeoutId);
    });
}

/** Helper: make a GET request to the Apps Script web app */
async function _sheetsGet(action, timeoutMs) {
    if (!_sheetsReady()) return null;
    try {
        var url = SHEETS_API_URL + '?action=' + action + '&token=' + encodeURIComponent(SHEETS_SECRET || '');
        var res = await _fetchWithTimeout(url, {}, timeoutMs || 15000);
        if (!res.ok) {
            console.error('[Sheets] GET ' + action + ' failed:', res.status, res.statusText);
            return null;
        }
        var json = await res.json();
        if (!json.ok) {
            console.error('[Sheets] GET ' + action + ' error:', json.error);
            return null;
        }
        return json;
    } catch (e) {
        if (e.name === 'AbortError') {
            console.warn('[Sheets] GET ' + action + ' timed out');
        } else {
            console.warn('[Sheets] GET ' + action + ' network error:', e.message);
        }
        return null;
    }
}

/** Helper: make a POST request to the Apps Script web app */
async function _sheetsPost(body, timeoutMs) {
    if (!_sheetsReady()) return null;
    try {
        body.token = SHEETS_SECRET || '';
        var res = await _fetchWithTimeout(SHEETS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(body)
        }, timeoutMs || 15000);
        if (!res.ok) {
            console.error('[Sheets] POST ' + body.action + ' failed:', res.status, res.statusText);
            return null;
        }
        var json = await res.json();
        if (!json.ok) {
            console.error('[Sheets] POST ' + body.action + ' error:', json.error);
            return null;
        }
        return json;
    } catch (e) {
        if (e.name === 'AbortError') {
            console.warn('[Sheets] POST ' + (body.action || '?') + ' timed out');
        } else {
            console.warn('[Sheets] POST ' + (body.action || '?') + ' network error:', e.message);
        }
        return null;
    }
}

// ── DEBUG ─────────────────────────────────────────────────────────

/**
 * Full diagnostic: logs every step to console AND returns an object
 * with all findings so the UI can display them.
 */
window.sb_debug = async function () {
    var out = [];

    // 1. Check config values loaded
    out.push('📌 SHEETS_API_URL = ' + (typeof SHEETS_API_URL !== 'undefined' ? SHEETS_API_URL : '❌ UNDEFINED'));
    out.push('📌 SHEETS_SECRET = ' + (typeof SHEETS_SECRET !== 'undefined' ? '***' + SHEETS_SECRET.slice(-4) : '❌ UNDEFINED'));

    if (!_sheetsReady()) {
        out.push('❌ Sheets API not configured — SHEETS_API_URL is empty or missing.');
        out.push('💡 Paste your Google Apps Script Web App URL into config.js');
        console.log('[Sheets Debug]\n' + out.join('\n'));
        return out;
    }

    // 2. Ping the API
    try {
        var url = SHEETS_API_URL + '?action=ping&token=' + encodeURIComponent(SHEETS_SECRET || '');
        var res = await _fetchWithTimeout(url, {}, 10000);
        out.push('🌐 Ping status: ' + res.status + ' ' + res.statusText);
        var body = await res.text();
        out.push('🌐 Ping response: ' + body.slice(0, 200));
    } catch (e) {
        if (e.name === 'AbortError') {
            out.push('❌ Ping timed out (>10s). Check your Apps Script URL.');
        } else {
            out.push('❌ Ping failed: ' + e.message);
        }
    }

    // 3. Try to query students
    try {
        var url2 = SHEETS_API_URL + '?action=debug&token=' + encodeURIComponent(SHEETS_SECRET || '');
        var res2 = await _fetchWithTimeout(url2, {}, 10000);
        var body2 = await res2.text();
        out.push('📋 Debug response: ' + body2.slice(0, 300));
    } catch (e) {
        out.push('❌ Debug fetch failed: ' + e.message);
    }

    // 4. Try full getStudents
    var result = await _sheetsGet('getStudents', 10000);
    if (result && result.data) {
        out.push('✅ getStudents OK, rows returned: ' + result.data.length);
    } else {
        out.push('❌ getStudents failed or returned no data');
    }

    // 5. localStorage status
    var lsStudents = JSON.parse(localStorage.getItem('students')) || [];
    out.push('💾 localStorage students count: ' + lsStudents.length);

    console.log('[Sheets Debug]\n' + out.join('\n'));
    return out;
};

// ── LOAD FROM CLOUD (Pull) ────────────────────────────────────────

/**
 * Fetches all students + fees from Google Sheets and writes them into localStorage.
 * This keeps every device in sync automatically on page open.
 * Returns: { ok, students, fees } or { ok: false, msg }
 *
 * Safety: will NOT overwrite localStorage if the cloud returns 0 students
 * but localStorage already has data (protects against empty-sheet accidents).
 */
window.sb_loadFromCloud = async function () {
    if (!_sheetsReady()) return { ok: false, msg: 'App is running offline (no Sheets API configured)' };

    try {
        // 1. Fetch students
        var stuResult = await _sheetsGet('getStudents');
        if (!stuResult) {
            return { ok: false, msg: 'Could not reach Google Sheets. Check internet connection.' };
        }
        if (!stuResult.data) {
            return { ok: false, msg: 'Google Sheets returned an unexpected response (no data field).' };
        }

        // 2. Fetch fees
        var feeResult = await _sheetsGet('getFees');
        if (!feeResult) {
            return { ok: false, msg: 'Could not load fees from Google Sheets. Check internet connection.' };
        }
        if (!feeResult.data) {
            return { ok: false, msg: 'Google Sheets returned an unexpected response for fees.' };
        }

        // 3. Safety check: don't overwrite local data with empty cloud data
        var localStudents = JSON.parse(localStorage.getItem('students')) || [];
        if (stuResult.data.length === 0 && localStudents.length > 0) {
            return {
                ok: false,
                msg: 'Cloud has 0 students but you have ' + localStudents.length +
                     ' locally. Push your data first to avoid data loss.'
            };
        }

        // 4. Convert to localStorage shapes — force all IDs and phones to strings
        var students = stuResult.data.map(function (row) {
            return {
                id:          String(row.id || ''),
                name:        String(row.name || ''),
                class:       String(row['class'] || ''),
                school:      String(row.school || ''),
                phone:       String(row.phone || ''),
                joiningDate: String(row.joining_date || ''),
                amount:      (row.monthly_fee != null && row.monthly_fee !== '') ? String(row.monthly_fee) : '',
                subjects:    Array.isArray(row.subjects) ? row.subjects : []
            };
        });

        var fees = {};
        feeResult.data.forEach(function (row) {
            if (row.status === 'Paid') {
                var key = String(row.student_id) + '_' + row.subject + '_' + row.month + '_' + row.year;
                fees[key] = 'Paid';
            }
        });

        // 5. Write to localStorage
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('fees', JSON.stringify(fees));

        console.log('[Cloud Load] Loaded ' + students.length + ' students, ' + feeResult.data.length + ' fee records from Google Sheets.');
        return { ok: true, students: students, fees: fees };

    } catch (e) {
        console.warn('[Cloud Load] Error:', e.message);
        return { ok: false, msg: 'Unexpected error: ' + e.message };
    }
};

// ── helpers ──────────────────────────────────────────────────────

/** Convert localStorage student object → Sheets row format */
function _toSheetStudent(s) {
    return {
        id:           String(s.id || ''),
        name:         String(s.name || ''),
        'class':      String(s.class || ''),
        school:       String(s.school || ''),
        phone:        String(s.phone || ''),
        joining_date: String(s.joiningDate || ''),
        monthly_fee:  s.amount ? Number(s.amount) : '',
        subjects:     s.subjects || []
    };
}

/** Convert Sheets row → localStorage student shape */
function _fromSheetStudent(row) {
    return {
        id:          String(row.id || ''),
        name:        String(row.name || ''),
        class:       String(row['class'] || ''),
        school:      String(row.school || ''),
        phone:       String(row.phone || ''),
        joiningDate: String(row.joining_date || ''),
        amount:      (row.monthly_fee != null && row.monthly_fee !== '') ? String(row.monthly_fee) : '',
        subjects:    Array.isArray(row.subjects) ? row.subjects : []
    };
}

// ── STUDENTS ─────────────────────────────────────────────────────

window.sb_getStudents = async function () {
    if (!_sheetsReady()) return null;
    var result = await _sheetsGet('getStudents');
    if (!result || !result.data) return null;
    return result.data.map(_fromSheetStudent);
};

window.sb_saveStudent = async function (student) {
    if (!_sheetsReady()) return false;
    var result = await _sheetsPost({
        action: 'saveStudent',
        student: _toSheetStudent(student)
    });
    if (!result) { console.error('[Sheets] saveStudent failed'); return false; }
    return true;
};

window.sb_deleteStudent = async function (id) {
    if (!_sheetsReady()) return false;
    var result = await _sheetsPost({
        action: 'deleteStudent',
        id: String(id)
    });
    if (!result) { console.error('[Sheets] deleteStudent failed'); return false; }
    return true;
};

// ── FEES ─────────────────────────────────────────────────────────

window.sb_getFees = async function () {
    if (!_sheetsReady()) return null;
    var result = await _sheetsGet('getFees');
    if (!result || !result.data) return null;
    var feesObj = {};
    result.data.forEach(function (row) {
        var key = String(row.student_id) + '_' + row.subject + '_' + row.month + '_' + row.year;
        feesObj[key] = row.status;
    });
    return feesObj;
};

window.sb_toggleFee = async function (studentId, subject, month, year, newStatus) {
    if (!_sheetsReady()) return;
    await _sheetsPost({
        action: 'toggleFee',
        fee: {
            student_id: String(studentId),
            subject: subject,
            month: month,
            year: Number(year),
            status: newStatus
        }
    });
};

// ── ONE-TIME MIGRATION (Push) ─────────────────────────────────────

window.sb_migrateFromLocalStorage = async function () {
    if (!_sheetsReady()) return { ok: false, msg: 'App is offline, cannot sync to cloud.' };

    var students = JSON.parse(localStorage.getItem('students')) || [];
    var feesRaw  = JSON.parse(localStorage.getItem('fees'))     || {};

    if (students.length === 0) {
        return { ok: false, msg: 'No students found in localStorage to migrate.' };
    }

    // Convert students to sheet format — force strings for id/phone
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
                student_id: String(studentId),
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

    // Send to Google Sheets — use longer timeout (60s) for bulk operations
    var result = await _sheetsPost({
        action: 'migrate',
        students: studentRows,
        fees: feeRows
    }, 60000);

    if (!result) {
        return { ok: false, msg: 'Failed to reach Google Sheets. Check your internet connection and try again.' };
    }

    return {
        ok: true,
        msg: '✅ ' + result.msg + (orphanCount > 0 ? ' (' + orphanCount + ' orphaned fee records skipped)' : '')
    };
};
