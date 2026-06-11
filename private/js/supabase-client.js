// ════════════════════════════════════════════════════════════════
//  supabase-client.js  —  Edu Home Cloud Sync Layer
//  Requires: config.js loaded first, Supabase CDN loaded
// ════════════════════════════════════════════════════════════════

// Initialise Supabase client (global `supabase` from CDN)
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

/** Fetch all students from Supabase */
window.sb_getStudents = async function () {
    const { data, error } = await _sb.from('students').select('*');
    if (error) { console.error('[Supabase] getStudents:', error.message); return null; }
    return data.map(_fromDbStudent);
};

/** Upsert a single student (insert or update by id) */
window.sb_saveStudent = async function (student) {
    const { error } = await _sb
        .from('students')
        .upsert(_toDbStudent(student), { onConflict: 'id' });
    if (error) { console.error('[Supabase] saveStudent:', error.message); return false; }
    return true;
};

/** Delete a student by id (fees cascade automatically) */
window.sb_deleteStudent = async function (id) {
    const { error } = await _sb.from('students').delete().eq('id', id);
    if (error) { console.error('[Supabase] deleteStudent:', error.message); return false; }
    return true;
};

// ── FEES ─────────────────────────────────────────────────────────

/** Fetch all fee records from Supabase as flat object (same shape as localStorage fees) */
window.sb_getFees = async function () {
    const { data, error } = await _sb.from('fees').select('*');
    if (error) { console.error('[Supabase] getFees:', error.message); return null; }
    const feesObj = {};
    data.forEach(row => {
        const key = `${row.student_id}_${row.subject}_${row.month}_${row.year}`;
        feesObj[key] = row.status;
    });
    return feesObj;
};

/** Toggle a fee status in Supabase */
window.sb_toggleFee = async function (studentId, subject, month, year, newStatus) {
    if (newStatus === 'Paid') {
        const { error } = await _sb.from('fees').upsert({
            student_id: studentId,
            subject,
            month,
            year: Number(year),
            status: 'Paid'
        }, { onConflict: 'student_id,subject,month,year' });
        if (error) console.error('[Supabase] toggleFee (paid):', error.message);
    } else {
        // Mark as Pending = delete the row (matches localStorage behaviour)
        const { error } = await _sb.from('fees')
            .delete()
            .match({ student_id: studentId, subject, month, year: Number(year) });
        if (error) console.error('[Supabase] toggleFee (pending):', error.message);
    }
};

// ── ONE-TIME MIGRATION ────────────────────────────────────────────

/**
 * Push everything from localStorage → Supabase.
 * Safe to run multiple times (upsert won't create duplicates).
 */
window.sb_migrateFromLocalStorage = async function () {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const fees     = JSON.parse(localStorage.getItem('fees'))     || {};

    if (students.length === 0) {
        return { ok: false, msg: 'No students found in localStorage to migrate.' };
    }

    // 1. Upsert all students
    const studentRows = students.map(_toDbStudent);
    const { error: stuErr } = await _sb
        .from('students')
        .upsert(studentRows, { onConflict: 'id' });
    if (stuErr) return { ok: false, msg: 'Students error: ' + stuErr.message };

    // 2. Upsert all fee records
    const feeRows = [];
    Object.keys(fees).forEach(key => {
        // key format: studentId_Subject_Month_Year
        const parts = key.split('_');
        if (parts.length < 4) return;
        // year is last, month is second-to-last, subject is everything between
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
        if (feeErr) return { ok: false, msg: 'Fees error: ' + feeErr.message };
    }

    return {
        ok: true,
        msg: `✅ Migrated ${students.length} students and ${feeRows.length} paid fee records to Supabase!`
    };
};
