// ════════════════════════════════════════════════════════════════
//  supabase-client.js  —  Edu Home Cloud Sync Layer
//  Requires: config.js loaded first, Supabase CDN loaded
// ════════════════════════════════════════════════════════════════

// Initialise Supabase client (global `supabase` from CDN)
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const { data, error } = await _sb.from('students').select('id').limit(1);
    if (error) {
        out.push('❌ supabase-js error: ' + JSON.stringify(error));
    } else {
        out.push('✅ supabase-js OK, rows returned: ' + data.length);
    }

    // 5. localStorage status
    const lsStudents = JSON.parse(localStorage.getItem('students')) || [];
    out.push('💾 localStorage students count: ' + lsStudents.length);

    console.log('[Supabase Debug]\n' + out.join('\n'));
    return out;
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
    const { data, error } = await _sb.from('students').select('*');
    if (error) { console.error('[Supabase] getStudents:', error); return null; }
    return data.map(_fromDbStudent);
};

window.sb_saveStudent = async function (student) {
    const { error } = await _sb
        .from('students')
        .upsert(_toDbStudent(student), { onConflict: 'id' });
    if (error) { console.error('[Supabase] saveStudent:', error); return false; }
    return true;
};

window.sb_deleteStudent = async function (id) {
    const { error } = await _sb.from('students').delete().eq('id', id);
    if (error) { console.error('[Supabase] deleteStudent:', error); return false; }
    return true;
};

// ── FEES ─────────────────────────────────────────────────────────

window.sb_getFees = async function () {
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

    // 2. Upsert fees
    const feeRows = [];
    Object.keys(fees).forEach(key => {
        const parts = key.split('_');
        if (parts.length < 4) return;
        const studentId = parts[0];
        const year      = Number(parts[parts.length - 1]);
        const month     = parts[parts.length - 2];
        const subject   = parts.slice(1, parts.length - 2).join('_');
        if (fees[key] === 'Paid') {
            feeRows.push({ student_id: studentId, subject, month, year, status: 'Paid' });
        }
    });

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
        msg: `✅ Migrated ${students.length} students and ${feeRows.length} paid fee records to Supabase!`
    };
};
