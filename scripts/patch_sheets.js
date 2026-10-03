const fs = require('fs');

const FILE_PATH = 'C:/Users/madhu/code_test/private/js/sheets-client.js';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// 1. Remove duplicate if (feeError)
const badFeeError = "if (feeError) console.warn('[DualSync] Supabase fees error:', feeError.message);";
const firstIdx = content.indexOf(badFeeError);
if (firstIdx !== -1) {
    const secondIdx = content.indexOf(badFeeError, firstIdx + badFeeError.length);
    if (secondIdx !== -1) {
        content = content.slice(0, secondIdx) + content.slice(secondIdx + badFeeError.length);
        console.log('✓ Removed duplicate feeError on line 429');
    }
}

// 2. Replace sb_loadFromCloud
const loadStart = content.indexOf('window.sb_loadFromCloud = async function () {');
const loadEnd = content.indexOf('// ─── STUDENTS (DUAL SYNC) ────────────────────────────────────────────────────');

if (loadStart !== -1 && loadEnd !== -1) {
    const newSbLoad = `window.sb_loadFromCloud = async function () {
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

        const canonicalRoll = master ? (master.rollNo || master.id) : (rawRoll && !rawRoll.match(/^\\d{13}$/) ? rawRoll : normName);
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
};\n\n`;

    content = content.slice(0, loadStart) + newSbLoad + content.slice(loadEnd);
    console.log('✓ Successfully replaced sb_loadFromCloud');
} else {
    console.error('Could not find sb_loadFromCloud markers');
}

// 3. Replace sb_toggleFee
const toggleStart = content.indexOf('window.sb_toggleFee = async function (studentId, subject, month, year, newStatus) {');
const toggleEnd = content.indexOf('// ─── ATTENDANCE (DUAL SYNC) ──────────────────────────────────────────────────');

if (toggleStart !== -1 && toggleEnd !== -1) {
    const newToggle = `window.sb_toggleFee = async function (studentId, subject, month, year, newStatus) {
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
};\n\n`;

    content = content.slice(0, toggleStart) + newToggle + content.slice(toggleEnd);
    console.log('✓ Successfully replaced sb_toggleFee');
} else {
    console.error('Could not find sb_toggleFee markers');
}

// 4. Upgrade sb_migrateFromLocalStorage
const migrateStart = content.indexOf('window.sb_migrateFromLocalStorage = async function () {');
if (migrateStart !== -1) {
    const newMigrate = `window.sb_migrateFromLocalStorage = async function () {
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
`;
    content = content.slice(0, migrateStart) + newMigrate;
    console.log('✓ Successfully replaced sb_migrateFromLocalStorage');
}

fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log('Saved updated sheets-client.js ✓');
