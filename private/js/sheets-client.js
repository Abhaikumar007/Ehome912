// ==============================================================================
//  sheets-client.js — Edu Home Dual Cloud Sync Layer (Google Sheets + Supabase)
//  Synchronizes all Admin Web App actions to BOTH Google Sheets and Supabase!
//  - When students are added/edited/deleted, both Sheets and Supabase are updated.
//  - When fees are toggled (Paid/Pending), both Sheets and Supabase are updated.
//  - When attendance is saved, it updates both Sheets and Supabase.
//  - The mobile app (Student & Faculty) reads from Supabase and gets real-time updates!
// ==============================================================================

/** Returns true if Sheets API config is available */
function _sheetsReady() {
    return typeof SHEETS_API_URL !== 'undefined' && SHEETS_API_URL && SHEETS_API_URL !== '';
}

/** Supabase Client Singleton */
let _supabaseClient = null;
function _getSupabaseClient() {
    if (_supabaseClient) return _supabaseClient;
    if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) {
        try {
            _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[DualSync] Supabase client initialized.');
        } catch (e) {
            console.warn('[DualSync] Failed to initialize Supabase client:', e);
        }
    }
    return _supabaseClient;
}
window._getSupabaseClient = _getSupabaseClient;

/**
 * Helper: fetch with a timeout so the UI never hangs forever.
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

// ─── DIAGNOSTICS & DEBUG ──────────────────────────────────────────────────────

window.sb_debug = async function () {
    var out = [];

    // 1. Google Sheets Config
    out.push('📊 SHEETS_API_URL = ' + (typeof SHEETS_API_URL !== 'undefined' ? SHEETS_API_URL : '❌ UNDEFINED'));
    out.push('🔑 SHEETS_SECRET  = ' + (typeof SHEETS_SECRET !== 'undefined' ? '***' + SHEETS_SECRET.slice(-4) : '❌ UNDEFINED'));

    // 2. Supabase Config
    out.push('⚡ SUPABASE_URL    = ' + (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '❌ UNDEFINED'));
    out.push('⚡ SUPABASE_SDK    = ' + (typeof window.supabase !== 'undefined' ? '✅ Available' : '❌ Missing CDN'));

    // 3. Test Sheets Ping
    if (_sheetsReady()) {
        try {
            var url = SHEETS_API_URL + '?action=ping&token=' + encodeURIComponent(SHEETS_SECRET || '');
            var res = await _fetchWithTimeout(url, {}, 10000);
            out.push('📡 Sheets Ping: ' + res.status + ' ' + res.statusText);
        } catch (e) {
            out.push('❌ Sheets Ping Failed: ' + e.message);
        }
    } else {
        out.push('⚠️ Google Sheets not configured.');
    }

    // 4. Test Supabase Ping
    const sb = _getSupabaseClient();
    if (sb) {
        try {
            const { data, error } = await sb.from('students').select('count', { count: 'exact', head: true });
            if (!error) {
                out.push('✅ Supabase Connection: OK (Table students accessible)');
            } else {
                out.push('⚠️ Supabase Error: ' + error.message);
            }
        } catch (e) {
            out.push('❌ Supabase Test Failed: ' + e.message);
        }
    } else {
        out.push('⚠️ Supabase client not initialized.');
    }

    // 5. Local Storage Status
    var lsStudents = JSON.parse(localStorage.getItem('students')) || [];
    out.push('💾 LocalStorage students count: ' + lsStudents.length);

    console.log('[DualSync Debug]\n' + out.join('\n'));
    return out;
};

// ─── DATA SHAPE CONVERTERS ───────────────────────────────────────────────────

function _toSheetStudent(s) {
    return {
        id:           String(s.id || s.roll_no || s.rollNo || ''),
        name:         String(s.name || ''),
        class:        String(s.class || s.class_name || ''),
        school:       String(s.school || ''),
        phone:        String(s.phone || ''),
        joining_date: String(s.joiningDate || s.joining_date || ''),
        monthly_fee:  (s.amount != null && s.amount !== '') ? Number(s.amount) : '',
        subjects:     Array.isArray(s.subjects) ? s.subjects : (s.subjects ? [s.subjects] : [])
    };
}

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

function _cleanPhone(p) {
    let clean = String(p || '').replace(/[^0-9]/g, '');
    if (clean.length > 10 && clean.startsWith('91')) clean = clean.slice(2);
    clean = clean.slice(-10);
    while (clean.length < 10) clean = '9' + clean;
    return clean;
}

function _getRollNo(s) {
    if (s.rollNo && String(s.rollNo).trim()) return String(s.rollNo).trim();
    if (s.roll_no && String(s.roll_no).trim()) return String(s.roll_no).trim();
    if (s.id && String(s.id).trim() && !String(s.id).match(/^\d{13}$/)) return String(s.id).trim();

    // Generate clean roll number if none exists
    const rawClass = String(s.class || s.class_name || '10').replace(/[^0-9]/g, '');
    const prefix = rawClass ? 'EDU-C' + rawClass : 'EDU';
    const num = (s.id ? String(s.id).slice(-3) : Math.floor(100 + Math.random() * 900));
    return prefix + '-' + num;
}

// ─── LOAD FROM CLOUD (PULL) ──────────────────────────────────────────────────

window.sb_loadFromCloud = async function () {
    let loadedStudents = null;
    let loadedFees = null;
    const sb = _getSupabaseClient();

    // 1. PRIMARY SOURCE: Supabase Live Database
    if (sb) {
        try {
            console.log('[DualSync] Pulling live students and fees directly from Supabase...');
            const [stuRes, feeRes] = await Promise.all([
                sb.from('students').select('*'),
                sb.from('fees_records').select('*')
            ]);

            if (!stuRes.error && Array.isArray(stuRes.data) && stuRes.data.length > 0) {
                const localStudents = (typeof getStudents === 'function') ? getStudents() : (JSON.parse(localStorage.getItem('students')) || []);
                const localMap = new Map((localStudents || []).map(l => [String(l.id || l.rollNo).toUpperCase().trim(), l]));

                loadedStudents = stuRes.data.map(r => {
                    const roll = String(r.roll_no || r.id).trim();
                    const local = localMap.get(roll.toUpperCase());
                    return {
                        id: roll,
                        rollNo: roll,
                        name: r.name || (local ? local.name : 'Student'),
                        class: String(r.class_name || (local ? local.class : '10')).replace('Class ', '').trim(),
                        school: r.school || (local ? local.school : 'EduHome Campus'),
                        phone: r.phone || (local ? local.phone : ''),
                        joiningDate: r.joining_date || (local ? local.joiningDate : '2026-01-15'),
                        amount: (local && local.amount) ? String(local.amount) : '',
                        subjects: (local && Array.isArray(local.subjects) && local.subjects.length > 0) ? local.subjects : []
                    };
                });
            }

            if (!feeRes.error && Array.isArray(feeRes.data) && loadedStudents) {
                const feesObj = {};
                const feeRows = feeRes.data;
                const feeMap = new Map();
                feeRows.forEach(f => { if (f.roll_no) feeMap.set(String(f.roll_no).toUpperCase().trim(), f); });
                window._supabaseFeeMap = feeMap;

                loadedStudents.forEach(st => {
                    const rollKey = String(st.rollNo || st.id).toUpperCase().trim();
                    const fr = feeMap.get(rollKey);
                    if (fr) {
                        st.amount = fr.monthly_fee ? String(fr.monthly_fee) : (st.amount || '');
                        if (fr.subjects) {
                            st.subjects = fr.subjects.split(',').map(s => s.trim());
                        }
                        const payments = Array.isArray(fr.recent_payments) ? fr.recent_payments : [];
                        const subs = (Array.isArray(st.subjects) && st.subjects.length > 0) ? st.subjects : ['General'];
                        const isCleared = (Number(fr.current_due) === 0 || fr.due_date === 'All Cleared' || fr.status === 'paid');

                        // Map all approved payments
                        payments.forEach(p => {
                            if (p.status !== 'pending_verification') {
                                const m = p.fullMonth ? p.fullMonth.split(' ')[0] : (p.month === 'OCT' ? 'October' : (p.month === 'SEP' ? 'September' : p.month));
                                const y = p.fullMonth ? (p.fullMonth.split(' ')[1] || '2026') : '2026';
                                subs.forEach(sub => {
                                    feesObj[st.id + '_' + sub + '_' + m + '_' + y] = 'Paid';
                                    feesObj[st.id + '_' + sub + '_' + m + ' ' + y] = 'Paid';
                                    if (st.rollNo) {
                                        feesObj[st.rollNo + '_' + sub + '_' + m + '_' + y] = 'Paid';
                                        feesObj[st.rollNo + '_' + sub + '_' + m + ' ' + y] = 'Paid';
                                    }
                                });
                            }
                        });

                        // If current cycle (October) is marked all cleared or current_due === 0
                        if (isCleared) {
                            subs.forEach(sub => {
                                feesObj[st.id + '_' + sub + '_October_2026'] = 'Paid';
                                feesObj[st.id + '_' + sub + '_October 2026'] = 'Paid';
                                if (st.rollNo) {
                                    feesObj[st.rollNo + '_' + sub + '_October_2026'] = 'Paid';
                                    feesObj[st.rollNo + '_' + sub + '_October 2026'] = 'Paid';
                                }
                            });
                        }
                    }
                });
                loadedFees = feesObj;
                console.log('[DualSync] Successfully mapped ' + Object.keys(feesObj).length + ' fee entries from Supabase ✓');
            }
        } catch (sbErr) {
            console.warn('[DualSync] Supabase pull warning:', sbErr);
        }
    }

    // 2. FALLBACK ONLY: Google Sheets (if Supabase had no students)
    if ((!loadedStudents || loadedStudents.length === 0) && _sheetsReady()) {
        try {
            var stuResult = await _sheetsGet('getStudents');
            var feeResult = await _sheetsGet('getFees');
            if (stuResult && stuResult.data && stuResult.data.length > 0) {
                loadedStudents = stuResult.data.map(_fromSheetStudent);
            }
            if (feeResult && feeResult.data && (!loadedFees || Object.keys(loadedFees).length === 0)) {
                var sFeesObj = {};
                feeResult.data.forEach(function (row) {
                    var key = String(row.student_id) + '_' + row.subject + '_' + row.month + '_' + row.year;
                    sFeesObj[key] = row.status;
                });
                if (Object.keys(sFeesObj).length > 0) {
                    loadedFees = sFeesObj;
                }
            }
        } catch (e) {
            console.warn('[Sheets] Fallback pull failed:', e);
        }
    }

    if (!loadedStudents || loadedStudents.length === 0) {
        return { ok: false, msg: 'No remote student records found.' };
    }

    // Deduplicate and consolidate loaded students by canonical rollNo or name
    const masterMapByName = new Map();
    const masterMapByRoll = new Map();
    if (typeof MASTER_STUDENTS_ROSTER !== 'undefined' && Array.isArray(MASTER_STUDENTS_ROSTER)) {
        MASTER_STUDENTS_ROSTER.forEach(m => {
            if (m.name) masterMapByName.set(m.name.toLowerCase().trim(), m);
            if (m.rollNo) masterMapByRoll.set(m.rollNo.toUpperCase().trim(), m);
            if (m.id) masterMapByRoll.set(m.id.toUpperCase().trim(), m);
        });
    }

    const dedupMap = new Map();
    loadedStudents.forEach(st => {
        const normName = (st.name || '').toLowerCase().trim();
        const rawRoll = (st.rollNo || st.roll_no || st.id || '').toUpperCase().trim();
        const master = masterMapByRoll.get(rawRoll) || masterMapByName.get(normName);

        const canonicalRoll = master ? (master.rollNo || master.id) : (rawRoll && !rawRoll.match(/^\d{13}$/) ? rawRoll : normName);
        if (!canonicalRoll) return;

        if (!dedupMap.has(canonicalRoll)) {
            dedupMap.set(canonicalRoll, {
                id: st.id || (master ? (master.rollNo || master.id) : canonicalRoll),
                rollNo: st.rollNo || st.roll_no || (master ? master.rollNo : canonicalRoll),
                name: (st.name || (master ? master.name : 'Student')).trim(),
                class: String(st.class || (master ? master.class : '10')).replace('Class ', '').trim(),
                school: st.school || (master ? master.school : 'EduHome Campus'),
                phone: st.phone || (master ? master.phone : ''),
                joiningDate: st.joiningDate || (master ? master.joiningDate : '2026-01-15'),
                amount: (st.amount && st.amount !== '') ? String(st.amount) : (master ? String(master.amount) : '3000'),
                subjects: (st.subjects && Array.isArray(st.subjects) && st.subjects.length > 0)
                    ? st.subjects
                    : (master && master.subjects ? master.subjects : ['General Tuition'])
            });
        } else {
            const existing = dedupMap.get(canonicalRoll);
            if ((!existing.amount || existing.amount === '-') && st.amount) existing.amount = String(st.amount);
            if ((!existing.subjects || existing.subjects.length === 0) && st.subjects && st.subjects.length > 0) existing.subjects = st.subjects;
            if (!existing.phone && st.phone) existing.phone = st.phone;
        }
    });

    loadedStudents = Array.from(dedupMap.values());

    // Save to LocalStorage
    localStorage.setItem('students', JSON.stringify(loadedStudents));
    if (loadedFees && Object.keys(loadedFees).length > 0) {
        localStorage.setItem('fees', JSON.stringify(loadedFees));
    }

    return {
        ok: true,
        students: loadedStudents,
        fees: loadedFees || (JSON.parse(localStorage.getItem('fees')) || {}),
        msg: 'Synced ' + loadedStudents.length + ' students from Supabase cloud.'
    };
};

// ─── STUDENTS (DUAL SYNC) ────────────────────────────────────────────────────

window.sb_getStudents = async function () {
    const result = await window.sb_loadFromCloud();
    if (result && result.ok) return result.students;
    return JSON.parse(localStorage.getItem('students')) || [];
};

window.sb_saveStudent = async function (student) {
    let sheetsSuccess = false;
    let supabaseSuccess = false;

    // 1. Google Sheets Sync
    if (_sheetsReady()) {
        try {
            var result = await _sheetsPost({
                action: 'saveStudent',
                student: _toSheetStudent(student)
            });
            sheetsSuccess = !!result;
            if (sheetsSuccess) console.log('[DualSync] Student saved to Google Sheets ✓');
        } catch (e) {
            console.warn('[DualSync] Sheets saveStudent error:', e);
        }
    }

    // 2. Supabase Sync
    const sb = _getSupabaseClient();
    if (sb) {
        try {
            const rollNo = _getRollNo(student);
            const rawClass = String(student.class || student.class_name || '10').trim();
            const className = rawClass.toLowerCase().startsWith('class') ? rawClass : 'Class ' + rawClass;
            const name = (student.name || 'Student').trim();
            const nameParts = name.split(' ');
            const avatar = (nameParts.length > 1 ? nameParts[0][0] + nameParts[1][0] : name.slice(0, 2)).toUpperCase();
            const phone = _cleanPhone(student.phone);
            const monthlyFee = Number(student.amount) || 0;
            const subjectsList = Array.isArray(student.subjects) ? student.subjects : (student.subjects ? [student.subjects] : []);
            const subjectsStr = subjectsList.join(', ');
            const joiningDate = student.joiningDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            // A. Upsert into students table
            const { error: stuError } = await sb.from('students').upsert({
                roll_no: rollNo,
                name: name,
                class_name: className,
                batch: student.batch || className,
                avatar: avatar,
                phone: phone,
                pin: student.pin || '1234',
                streak: student.streak || 0,
                accuracy: student.accuracy || 0,
                tests_completed: student.tests_completed || 0,
                top_percent: student.top_percent || 0
            }, { onConflict: 'roll_no' });

            if (stuError) {
                console.warn('[DualSync] Supabase students error:', stuError.message);
            } else {
                console.log('[DualSync] Student upserted in Supabase ✓:', rollNo);
            }

            // B. Upsert into fees_records (preserve existing payments & dues!)
            const { data: existingFee } = await sb.from('fees_records').select('*').eq('roll_no', rollNo).maybeSingle();
            if (!existingFee) {
                const { error: feeError } = await sb.from('fees_records').upsert({
                    roll_no: rollNo,
                    current_due: monthlyFee,
                    due_date: '25th of month',
                    days_left: 5,
                    months_paid_on_time: 0,
                    loyalty_months: [],
                    recent_payments: []
                }, { onConflict: 'roll_no' });
                if (feeError) console.warn('[DualSync] Supabase fees error:', feeError.message);
            }

            

            // C. Attendance record with enrolled subjects
            const { error: attError } = await sb.from('attendance_records').upsert({
                roll_no: rollNo,
                overall: 0,
                attended: 0,
                total: 0,
                today_subjects: subjectsList,
                history: []
            }, { onConflict: 'roll_no' });

            if (attError) console.warn('[DualSync] Supabase attendance error:', attError.message);

            // D. Blank progress record
            await sb.from('progress_records').upsert({
                roll_no: rollNo,
                tests_attended: 0,
                highest_score: 0,
                top_percent: 0,
                total_students: 0,
                improvement: 0,
                accuracy: 0,
                incorrect: 0
            }, { onConflict: 'roll_no', ignoreDuplicates: true });

            if (!stuError) {
                supabaseSuccess = true;
                console.log('[DualSync] Student & companions synced to Supabase ✓');
            }
        } catch (e) {
            console.warn('[DualSync] Supabase saveStudent error:', e);
        }
    }

    return sheetsSuccess || supabaseSuccess;
};

window.sb_deleteStudent = async function (id) {
    let sheetsSuccess = false;
    let supabaseSuccess = false;

    // 1. Delete from Sheets
    if (_sheetsReady()) {
        try {
            var result = await _sheetsPost({
                action: 'deleteStudent',
                id: String(id)
            });
            sheetsSuccess = !!result;
        } catch (e) {
            console.warn('[DualSync] Sheets deleteStudent error:', e);
        }
    }

    // 2. Delete from Supabase
    const sb = _getSupabaseClient();
    if (sb) {
        try {
            const sid = String(id);
            const { error } = await sb.from('students').delete().or('roll_no.eq.' + sid + ',id.eq.' + sid);
            if (!error) {
                supabaseSuccess = true;
                console.log('[DualSync] Student deleted from Supabase ✓:', sid);
            } else {
                console.warn('[DualSync] Supabase delete error:', error.message);
            }
        } catch (e) {
            console.warn('[DualSync] Supabase deleteStudent error:', e);
        }
    }

    return sheetsSuccess || supabaseSuccess;
};

// ─── FEES (DUAL SYNC) ────────────────────────────────────────────────────────

window.sb_getFees = async function () {
    if (_sheetsReady()) {
        var result = await _sheetsGet('getFees');
        if (result && result.data) {
            var feesObj = {};
            var feeRows = Array.isArray(result.data) ? result.data : [];
            feeRows.forEach(function (row) {
                var key = String(row.student_id) + '_' + row.subject + '_' + row.month + '_' + row.year;
                feesObj[key] = row.status;
            });
            return feesObj;
        }
    }
    return JSON.parse(localStorage.getItem('fees')) || {};
};

window.sb_toggleFee = async function (studentId, subject, month, year, newStatus) {
    const sb = _getSafeAdminSupabase ? _getSafeAdminSupabase() : _getSupabaseClient();

    // 1. PRIMARY: Update Supabase Live Table FIRST
    if (sb) {
        try {
            const sid = String(studentId);
            const localStudents = (typeof getStudents === 'function') ? getStudents() : [];
            const student = localStudents.find(s => s.id === sid || s.rollNo === sid || s.roll_no === sid || s.phone === sid) || null;
            const rollNo = student?.rollNo || student?.roll_no || student?.id || sid;
            const studentFee = Number(student?.amount || student?.fee) || (student?.class ? (typeof getStandardClassFee === 'function' ? getStandardClassFee(student.class) : 4000) : 4000);

            // Fetch current fee record from Supabase
            const { data: feeRecord, error: fErr } = await sb.from('fees_records')
                .select('*')
                .eq('roll_no', rollNo)
                .maybeSingle();

            if (fErr) console.warn('[DualSync] Pre-fetch feeRecord error:', fErr);

            const mShort = (month || 'OCT').slice(0, 3).toUpperCase();
            const fullMonthStr = month + ' ' + year;

            let fees = {};
            try {
                fees = (typeof getFees === 'function') ? getFees() : (JSON.parse(localStorage.getItem('fees')) || {});
            } catch (e) {}

            const studentSubjects = (Array.isArray(student?.subjects) && student.subjects.length > 0) ? student.subjects : [subject];
            let isMonthFullyPaid = (newStatus === 'Paid');
            if (isMonthFullyPaid) {
                for (const sub of studentSubjects) {
                    const k1 = studentId + '_' + sub + '_' + month + '_' + year;
                    const k2 = rollNo + '_' + sub + '_' + month + '_' + year;
                    const k3 = studentId + '_' + sub + '_' + month + ' ' + year;
                    const k4 = rollNo + '_' + sub + '_' + month + ' ' + year;
                    if (fees[k1] !== 'Paid' && fees[k2] !== 'Paid' && fees[k3] !== 'Paid' && fees[k4] !== 'Paid') {
                        isMonthFullyPaid = false;
                        break;
                    }
                }
            }

            const now = new Date();
            let currentDue = feeRecord?.current_due ?? studentFee;
            let dueDate = feeRecord?.due_date || ('25 ' + month + ' ' + year);
            let daysLeft = feeRecord?.days_left ?? 22;
            let status = 'due';
            let updatedPayments = Array.isArray(feeRecord?.recent_payments) ? [...feeRecord.recent_payments] : [];
            let updatedLoyalty = Array.isArray(feeRecord?.loyalty_months) ? [...feeRecord.loyalty_months] : [];

            if (isMonthFullyPaid) {
                const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                const paymentEntry = {
                    month: mShort,
                    fullMonth: fullMonthStr,
                    paidOn: paidOnStr,
                    amount: studentFee,
                    onTime: true,
                    status: 'Verified by Center Admin',
                    receiptNo: 'REC-' + year + '-' + mShort + '-' + Math.floor(1000 + Math.random() * 9000),
                    utr: 'ADMIN-VERIFIED'
                };

                const pIdx = updatedPayments.findIndex(p => p.fullMonth === fullMonthStr || p.month === mShort);
                if (pIdx >= 0) updatedPayments[pIdx] = paymentEntry;
                else updatedPayments.push(paymentEntry);

                if (!updatedLoyalty.some(l => l.label === month || l.label === fullMonthStr)) {
                    updatedLoyalty.push({ label: month, earned: true });
                }

                if (month === 'October') {
                    currentDue = 0;
                    dueDate = 'All Cleared';
                    daysLeft = 0;
                    status = 'paid';
                }
            } else {
                // Pending / Not Paid — remove receipt & loyalty badge for this month
                updatedPayments = updatedPayments.filter(p => !(p.month === mShort && (p.fullMonth?.includes(String(year)) || !p.fullMonth)));
                updatedLoyalty = updatedLoyalty.filter(l => l.label !== month && l.label !== fullMonthStr);

                if (month === 'October') {
                    currentDue = studentFee;
                    dueDate = '25 October 2026';
                    daysLeft = 22;
                    status = 'due';
                }
            }

            const { error: upErr } = await sb.from('fees_records').upsert({
                roll_no: rollNo,
                monthly_fee: studentFee,
                current_due: currentDue,
                due_date: dueDate,
                days_left: daysLeft,
                status: status,
                months_paid_on_time: updatedLoyalty.length,
                loyalty_months: updatedLoyalty,
                recent_payments: updatedPayments,
                updated_at: now.toISOString()
            }, { onConflict: 'roll_no' });

            if (upErr) {
                console.error('[DualSync] Supabase fee update error:', upErr);
            } else {
                console.log('[DualSync] Supabase fee ' + newStatus + ' synced for ' + rollNo + ' (' + month + '): Due = ₹' + currentDue + ', Amount = ₹' + studentFee + ' ✓');

                // Update in-memory feeMap
                if (window._supabaseFeeMap) {
                    window._supabaseFeeMap.set(String(rollNo).toUpperCase().trim(), {
                        roll_no: rollNo,
                        monthly_fee: studentFee,
                        current_due: currentDue,
                        due_date: dueDate,
                        days_left: daysLeft,
                        status: status,
                        loyalty_months: updatedLoyalty,
                        recent_payments: updatedPayments,
                        updated_at: now.toISOString()
                    });
                }

                // Realtime broadcast to student mobile app
                try {
                    const channel = sb.channel('admin_fee_broadcast');
                    channel.subscribe((subStatus) => {
                        if (subStatus === 'SUBSCRIBED') {
                            channel.send({
                                type: 'broadcast',
                                event: 'fee_record_changed',
                                payload: {
                                    rollNo: rollNo,
                                    month: month,
                                    status: newStatus,
                                    currentDue: currentDue,
                                    dueDate: dueDate,
                                    timestamp: now.toISOString()
                                }
                            });
                        }
                    });
                } catch (rtErr) {
                    console.warn('[DualSync] Realtime broadcast warning:', rtErr);
                }
            }
        } catch (sbErr) {
            console.warn('[DualSync] Supabase toggleFee exception:', sbErr);
        }
    }

    // 2. Google Sheets sync (background non-blocking)
    if (_sheetsReady()) {
        _sheetsPost({
            action: 'toggleFee',
            fee: {
                student_id: String(studentId),
                subject: subject,
                month: month,
                year: Number(year),
                status: newStatus
            }
        }).catch(e => console.warn('[DualSync] Sheets background toggle error:', e));
    }
};

// ─── ATTENDANCE (DUAL SYNC) ──────────────────────────────────────────────────

window.sb_saveAttendance = async function (attData) {
    // attData = { date, subject, className, records: [{ studentId, name, rollNo, status: 'present'|'absent', lateMinutes }] }
    console.log('[DualSync] Saving attendance...', attData);

    // 1. Save to Google Sheets if supported
    if (_sheetsReady()) {
        try {
            await _sheetsPost({
                action: 'saveAttendance',
                attendance: attData
            });
            console.log('[DualSync] Attendance sent to Google Sheets ✓');
        } catch (e) {}
    }

    // 2. Save to Supabase (classes table and attendance_records table)
    const sb = _getSupabaseClient();
    if (sb && attData.records && attData.records.length > 0) {
        try {
            for (const r of attData.records) {
                const rollNo = r.rollNo || r.studentId;
                const isPresent = r.status === 'present';

                // (Attendance is tracked in attendance_records, keeping classes table strictly for timetables)

                // Upsert student's attendance_records (creates row if none exists yet)
                const { data: curAtt } = await sb.from('attendance_records')
                    .select('*')
                    .eq('roll_no', rollNo)
                    .maybeSingle();

                const newAttended = isPresent ? ((curAtt?.attended || 0) + 1) : (curAtt?.attended || 0);
                const newTotal = (curAtt?.total || 0) + 1;
                const newOverall = newTotal > 0 ? Math.round((newAttended / newTotal) * 100) : (isPresent ? 100 : 0);

                const todaySubjects = Array.isArray(curAtt?.today_subjects) ? [...curAtt.today_subjects] : [];
                todaySubjects.push({
                    name: attData.subject,
                    status: isPresent ? 'present' : 'absent',
                    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                });

                await sb.from('attendance_records').upsert({
                    roll_no: rollNo,
                    attended: newAttended,
                    total: newTotal,
                    overall: newOverall,
                    today_subjects: todaySubjects,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'roll_no' });
            }
            console.log('[DualSync] Attendance synced to Supabase student records ✓');
            return true;
        } catch (e) {
            console.warn('[DualSync] Supabase saveAttendance error:', e);
        }
    }
    return true;
};

// ─── BULK MIGRATION (PUSH TO BOTH CLOUDS) ─────────────────────────────────────

window.sb_migrateFromLocalStorage = async function () {
    var students = JSON.parse(localStorage.getItem('students')) || [];
    var feesRaw  = JSON.parse(localStorage.getItem('fees'))     || {};

    if (students.length === 0) {
        return { ok: false, msg: 'No students found in localStorage to migrate.' };
    }

    var msgs = [];
    const sb = _getSafeAdminSupabase ? _getSafeAdminSupabase() : _getSupabaseClient();

    // 1. Direct Push to Supabase students and fees_records
    if (sb) {
        try {
            let stuCount = 0;
            for (const s of students) {
                await window.sb_saveStudent(s);
                stuCount++;
            }

            // Also upsert fee records
            const feeRecordsToUpsert = [];
            const now = new Date();
            students.forEach(s => {
                const roll = s.rollNo || s.id;
                if (!roll) return;
                const subs = (Array.isArray(s.subjects) && s.subjects.length > 0) ? s.subjects : ['General'];
                const isOctPaid = subs.every(sub => 
                    feesRaw[s.id + '_' + sub + '_October_2026'] === 'Paid' || 
                    feesRaw[roll + '_' + sub + '_October_2026'] === 'Paid' ||
                    feesRaw[s.id + '_' + sub + '_October 2026'] === 'Paid' || 
                    feesRaw[roll + '_' + sub + '_October 2026'] === 'Paid'
                );
                const monthlyFee = Number(s.amount) || 4000;

                feeRecordsToUpsert.push({
                    roll_no: roll,
                    monthly_fee: monthlyFee,
                    current_due: isOctPaid ? 0 : monthlyFee,
                    due_date: isOctPaid ? 'All Cleared' : '25 October 2026',
                    days_left: isOctPaid ? 0 : 22,
                    status: isOctPaid ? 'paid' : 'due',
                    updated_at: now.toISOString()
                });
            });

            if (feeRecordsToUpsert.length > 0) {
                await sb.from('fees_records').upsert(feeRecordsToUpsert, { onConflict: 'roll_no' });
            }

            msgs.push('Supabase (' + stuCount + ' students & fees)');
        } catch (e) {
            console.warn('[DualSync] Supabase migration error:', e);
        }
    }

    // 2. Push to Google Sheets (if configured)
    if (_sheetsReady()) {
        try {
            var studentRows = students.map(_toSheetStudent);
            var validStudentIds = {};
            students.forEach(function (s) { validStudentIds[s.id] = true; });

            var feeRows = [];
            Object.keys(feesRaw).forEach(function (key) {
                var parts = key.split('_');
                if (parts.length < 4) return;
                var studentId = parts[0];
                var year      = Number(parts[parts.length - 1]);
                var month     = parts[parts.length - 2];
                var subject   = parts.slice(1, parts.length - 2).join('_');

                if (validStudentIds[studentId] && feesRaw[key] === 'Paid') {
                    feeRows.push({
                        student_id: String(studentId),
                        subject: subject,
                        month: month,
                        year: year,
                        status: 'Paid'
                    });
                }
            });

            var result = await _sheetsPost({
                action: 'migrate',
                students: studentRows,
                fees: feeRows
            }, 60000);

            if (result && result.ok) msgs.push('Google Sheets (' + students.length + ' students)');
        } catch (e) {
            console.warn('[DualSync] Sheets migration error:', e);
        }
    }

    if (msgs.length === 0) {
        return { ok: false, msg: 'Failed to sync to clouds. Check internet and credentials.' };
    }

    return {
        ok: true,
        msg: '✅ Synced to: ' + msgs.join(' and ')
    };
};
