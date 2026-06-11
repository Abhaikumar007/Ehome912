// ════════════════════════════════════════════════════════════════
//  supabase-client.js  —  Edu Home Cloud Sync Layer
//  Offline-safe: if Supabase CDN fails to load (no internet),
//  _sb is null and all functions fall back gracefully.
//  localStorage data is always used as the source of truth offline.
// ════════════════════════════════════════════════════════════════

// Safe init — won't crash if CDN didn't load
let _sb = null;
try {
    if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
        _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('[Supabase] CDN or config not loaded — running in offline/local mode.');
    }
} catch (e) {
    console.warn('[Supabase] Init failed (offline?):', e.message);
}

/** Returns true if Supabase is available (online + CDN loaded) */
function _sbReady() { return _sb !== null; }

// ── DEBUG ─────────────────────────────────────────────────────────

/**
 * Full diagnostic: logs every step to console AND returns an object
 * with all findings so the UI can display them.
 */
window.sb_debug = async function () {
    const out = [];

    // 1. Check config values loaded
    out.push('📌 SUPABASE_URL = ' + (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '❌ UNDEFINED'));
    out.push('📌 ANON_KEY starts with = ' + (typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY.slice(0, 30) + '...' : '❌ UNDEFINED'));

    // 2. Raw REST ping — does the URL even respond?
    try {
        const pingRes = await fetch(SUPABASE_URL + '/rest/v1/', {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });
        out.push('🌐 REST ping status: ' + pingRes.status + ' ' + pingRes.statusText);
        const pingText = await pingRes.text();
        out.push('🌐 REST ping body: ' + pingText.slice(0, 200));
    } catch (e) {
        out.push('❌ REST ping failed: ' + e.message);
    }

    // 3. Try to query students table via raw fetch
    try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/students?select=id&limit=1', {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });
        out.push('📋 students raw fetch status: ' + res.status);
        const body = await res.text();
        out.push('📋 students raw response: ' + body.slice(0, 300));
    } catch (e) {
        out.push('❌ students raw fetch failed: ' + e.message);
    }

    // 4. Try via supabase-js client
    if (_sbReady()) {
        const { data, error } = await _sb.from('students').select('id').limit(1);
        if (error) {
            out.push('❌ supabase-js error: ' + JSON.stringify(error));
        } else {
            out.push('✅ supabase-js OK, rows returned: ' + data.length);
        }
    } else {
        out.push('❌ supabase-js client is null (Offline or CDN blocked)');
    }

    // 5. localStorage status
    const lsStudents = JSON.parse(localStorage.getItem('students')) || [];
    out.push('💾 localStorage students count: ' + lsStudents.length);

    console.log('[Supabase Debug]\n' + out.join('\n'));
    return out;
};

// ── LOAD FROM CLOUD (run on every page load) ──────────────────────

/**
 * Fetches all students + fees from Supabase and writes them into localStorage.
 * This keeps every device in sync automatically on page open.
 * Returns: { ok, students, fees } or { ok: false, msg }
 */
window.sb_loadFromCloud = async function () {
    if (!_sbReady()) return { ok: false, msg: 'App is running offline' };

    try {
        // 1. Fetch students
        const { data: stuData, error: stuErr } = await _sb.from('students').select('*');
        if (stuErr) {
            console.warn('[Cloud Load] Could not load students:', stuErr.message);
            return { ok: false, msg: stuErr.message };
        }

        // 2. Fetch fees
        const { data: feeData, error: feeErr } = await _sb.from('fees').select('*');
        if (feeErr) {
            console.warn('[Cloud Load] Could not load fees:', feeErr.message);
            return { ok: false, msg: feeErr.message };
        }

        // 3. Convert to localStorage shapes
        const students = stuData.map(function (row) {
            return {
                id:          row.id,
                name:        row.name,
                class:       row.class,
                school:      row.school      || '',
                phone:       row.phone,
                joiningDate: row.joining_date || '',
                amount:      row.monthly_fee != null ? String(row.monthly_fee) : '',
                subjects:    row.subjects    || []
            };
        });

        const fees = {};
        feeData.forEach(function (row) {
            if (row.status === 'Paid') {
                fees[row.student_id + '_' + row.subject + '_' + row.month + '_' + row.year] = 'Paid';
            }
        });

        // 4. Write to localStorage
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('fees', JSON.stringify(fees));

        console.log('[Cloud Load] Loaded ' + students.length + ' students, ' + feeData.length + ' fee records from Supabase.');
        return { ok: true, students: students, fees: fees };

    } catch (e) {
        console.warn('[Cloud Load] Error:', e.message);
        return { ok: false, msg: e.message };
    }
};

// ── helpers ──────────────────────────────────────────────────────

/** Convert localStorage student object → Supabase row */
function _toDbStudent(s) {
    return {
        id:           s.id,
        name:         s.name,
        class:        s.class,
        school:       s.school  || null,
        phone:        s.phone,
        joining_date: s.joiningDate || null,
        monthly_fee:  s.amount ? Number(s.amount) : null,
        subjects:     s.subjects || []
    };
}

/** Convert Supabase row → localStorage student shape */
function _fromDbStudent(row) {
    return {
        id:          row.id,
        name:        row.name,
        class:       row.class,
        school:      row.school      || '',
        phone:       row.phone,
        joiningDate: row.joining_date || '',
        amount:      row.monthly_fee != null ? String(row.monthly_fee) : '',
        subjects:    row.subjects    || []
    };
}

// ── STUDENTS ─────────────────────────────────────────────────────

window.sb_getStudents = async function () {
    if (!_sbReady()) return null;
    const { data, error } = await _sb.from('students').select('*');
    if (error) { console.error('[Supabase] getStudents:', error); return null; }
    return data.map(_fromDbStudent);
};

window.sb_saveStudent = async function (student) {
    if (!_sbReady()) return false;
    const { error } = await _sb
        .from('students')
        .upsert(_toDbStudent(student), { onConflict: 'id' });
    if (error) { console.error('[Supabase] saveStudent:', error); return false; }
    return true;
};

window.sb_deleteStudent = async function (id) {
    if (!_sbReady()) return false;
    const { error } = await _sb.from('students').delete().eq('id', id);
    if (error) { console.error('[Supabase] deleteStudent:', error); return false; }
    return true;
};

// ── FEES ─────────────────────────────────────────────────────────

window.sb_getFees = async function () {
    if (!_sbReady()) return null;
    const { data, error } = await _sb.from('fees').select('*');
    if (error) { console.error('[Supabase] getFees:', error); return null; }
    const feesObj = {};
    data.forEach(row => {
        const key = `${row.student_id}_${row.subject}_${row.month}_${row.year}`;
        feesObj[key] = row.status;
    });
    return feesObj;
};

window.sb_toggleFee = async function (studentId, subject, month, year, newStatus) {
    if (!_sbReady()) return;
    
    if (newStatus === 'Paid') {
        const { error } = await _sb.from('fees').upsert({
            student_id: studentId, subject, month,
            year: Number(year), status: 'Paid'
        }, { onConflict: 'student_id,subject,month,year' });
        if (error) console.error('[Supabase] toggleFee (paid):', error);
    } else {
        const { error } = await _sb.from('fees')
            .delete()
            .match({ student_id: studentId, subject, month, year: Number(year) });
        if (error) console.error('[Supabase] toggleFee (pending):', error);
    }
};

// ── ONE-TIME MIGRATION ────────────────────────────────────────────

window.sb_migrateFromLocalStorage = async function () {
    if (!_sbReady()) return { ok: false, msg: 'App is offline, cannot sync to cloud.' };

    const students = JSON.parse(localStorage.getItem('students')) || [];
    const fees     = JSON.parse(localStorage.getItem('fees'))     || {};

    if (students.length === 0) {
        return { ok: false, msg: 'No students found in localStorage to migrate.' };
    }

    // 1. Upsert students
    const studentRows = students.map(_toDbStudent);
    console.log('[Migrate] Sending student rows:', JSON.stringify(studentRows[0])); // log first row

    const { data: stuData, error: stuErr } = await _sb
        .from('students')
        .upsert(studentRows, { onConflict: 'id' })
        .select();

    if (stuErr) {
        console.error('[Migrate] students full error:', stuErr);
        return {
            ok: false,
            msg: `Students error: ${stuErr.message} | code: ${stuErr.code} | hint: ${stuErr.hint || 'none'} | details: ${stuErr.details || 'none'}`
        };
    }

    // 2. Upsert fees — only for students that actually exist (skip orphaned fee records)
    const validStudentIds = new Set(students.map(s => s.id));
    const feeRows = [];
    let orphanCount = 0;

    Object.keys(fees).forEach(key => {
        const parts = key.split('_');
        if (parts.length < 4) return;
        const studentId = parts[0];
        const year      = Number(parts[parts.length - 1]);
        const month     = parts[parts.length - 2];
        const subject   = parts.slice(1, parts.length - 2).join('_');

        if (!validStudentIds.has(studentId)) {
            orphanCount++;
            return; // skip orphaned fee (student was deleted)
        }

        if (fees[key] === 'Paid') {
            feeRows.push({ student_id: studentId, subject, month, year, status: 'Paid' });
        }
    });

    if (orphanCount > 0) {
        console.warn(`[Migrate] Skipped ${orphanCount} orphaned fee records (student was deleted).`);
    }

    if (feeRows.length > 0) {
        const { error: feeErr } = await _sb
            .from('fees')
            .upsert(feeRows, { onConflict: 'student_id,subject,month,year' });
        if (feeErr) {
            console.error('[Migrate] fees full error:', feeErr);
            return {
                ok: false,
                msg: `Fees error: ${feeErr.message} | code: ${feeErr.code} | hint: ${feeErr.hint || 'none'}`
            };
        }
    }

    return {
        ok: true,
        msg: `✅ Migrated ${students.length} students and ${feeRows.length} paid fee records to Supabase!${orphanCount > 0 ? ` (${orphanCount} orphaned fee records skipped)` : ''}`
    };
};
