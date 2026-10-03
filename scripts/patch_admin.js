const fs = require('fs');

const FILE_PATH = 'C:/Users/madhu/code_test/private/js/admin.js';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// 1. Add window.loadSupabaseFeesData before _getSafeAdminSupabase
if (!content.includes('window.loadSupabaseFeesData')) {
    const safeMarker = 'function _getSafeAdminSupabase()';
    const safeIdx = content.indexOf(safeMarker);
    if (safeIdx !== -1) {
        const loadSupabaseCode = `/**
 * Direct Supabase Fees & Students Loader
 * Keeps fees.html in real-time sync with Supabase and EduHome mobile app
 */
window.loadSupabaseFeesData = async function() {
    const statusEl = document.getElementById('manualSyncStatus');
    const sb = _getSafeAdminSupabase();
    if (!sb) {
        console.warn('[SupabaseFees] Supabase client not available');
        return { ok: false, msg: 'Supabase client unavailable' };
    }

    try {
        if (statusEl) statusEl.innerHTML = '<span class="text-muted"><i class="fas fa-spinner fa-spin mr-1"></i> Connecting directly to Supabase cloud fees...</span>';

        const [feeRes, stuRes] = await Promise.all([
            sb.from('fees_records').select('*'),
            sb.from('students').select('*')
        ]);

        if (feeRes.error) throw feeRes.error;

        const feeRecords = feeRes.data || [];
        const feeMap = new Map();
        feeRecords.forEach(r => {
            if (r.roll_no) feeMap.set(String(r.roll_no).toUpperCase().trim(), r);
        });
        window._supabaseFeeMap = feeMap;

        // If students exist in Supabase, ensure local cache is up to date
        if (stuRes.data && stuRes.data.length > 0) {
            const cloudStudents = stuRes.data;
            const localStudents = typeof getStudents === 'function' ? getStudents() : [];
            const localMap = new Map(localStudents.map(s => [String(s.rollNo || s.id).toUpperCase().trim(), s]));

            const merged = cloudStudents.map(cs => {
                const roll = String(cs.roll_no || cs.id).toUpperCase().trim();
                const loc = localMap.get(roll);
                const feeRec = feeMap.get(roll);
                return {
                    id: cs.roll_no || cs.id,
                    rollNo: cs.roll_no || cs.id,
                    name: cs.name || loc?.name || 'Student',
                    class: String(cs.class_name || loc?.class || '10').replace('Class ', '').trim(),
                    school: cs.school || loc?.school || 'EduHome Campus',
                    phone: cs.phone || loc?.phone || '',
                    joiningDate: cs.joining_date || loc?.joiningDate || '2026-01-15',
                    amount: (feeRec && feeRec.monthly_fee) ? String(feeRec.monthly_fee) : (loc?.amount || '4000'),
                    subjects: (loc && Array.isArray(loc.subjects) && loc.subjects.length > 0) ? loc.subjects : ['General']
                };
            });
            localStorage.setItem('students', JSON.stringify(merged));
        }

        // Populate local fees cache with verified payments from Supabase
        const feesCache = typeof getFees === 'function' ? getFees() : {};
        const allStudents = typeof getStudents === 'function' ? getStudents() : [];

        feeRecords.forEach(fr => {
            const roll = fr.roll_no;
            const stu = allStudents.find(s => String(s.rollNo || s.id).toUpperCase().trim() === String(roll).toUpperCase().trim());
            const subjects = (stu && Array.isArray(stu.subjects) && stu.subjects.length > 0) ? stu.subjects : ['General'];
            const payments = Array.isArray(fr.recent_payments) ? fr.recent_payments : [];
            const isCleared = (Number(fr.current_due) === 0 || fr.due_date === 'All Cleared' || fr.status === 'paid');

            payments.forEach(p => {
                if (p.status !== 'pending_verification') {
                    const mName = p.fullMonth ? p.fullMonth.split(' ')[0] : (p.month === 'OCT' ? 'October' : (p.month === 'SEP' ? 'September' : p.month));
                    const y = p.fullMonth ? (p.fullMonth.split(' ')[1] || '2026') : '2026';
                    subjects.forEach(sub => {
                        feesCache[roll + '_' + sub + '_' + mName + '_' + y] = 'Paid';
                        feesCache[roll + '_' + sub + '_' + mName + ' ' + y] = 'Paid';
                        if (stu && stu.id) {
                            feesCache[stu.id + '_' + sub + '_' + mName + '_' + y] = 'Paid';
                            feesCache[stu.id + '_' + sub + '_' + mName + ' ' + y] = 'Paid';
                        }
                    });
                }
            });

            if (isCleared) {
                subjects.forEach(sub => {
                    feesCache[roll + '_' + sub + '_October_2026'] = 'Paid';
                    feesCache[roll + '_' + sub + '_October 2026'] = 'Paid';
                    if (stu && stu.id) {
                        feesCache[stu.id + '_' + sub + '_October_2026'] = 'Paid';
                        feesCache[stu.id + '_' + sub + '_October 2026'] = 'Paid';
                    }
                });
            }
        });

        localStorage.setItem('fees', JSON.stringify(feesCache));

        // Setup realtime subscription if not already active
        if (!window._supabaseFeesRealtimeSubscribed) {
            try {
                sb.channel('admin_fees_live_channel')
                  .on('postgres_changes', { event: '*', schema: 'public', table: 'fees_records' }, (payload) => {
                      console.log('[SupabaseRealtime] fees_records updated live:', payload);
                      if (payload.new && payload.new.roll_no) {
                          if (!window._supabaseFeeMap) window._supabaseFeeMap = new Map();
                          window._supabaseFeeMap.set(String(payload.new.roll_no).toUpperCase().trim(), payload.new);
                      }
                      if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
                      if (typeof window.loadPendingVerifications === 'function') window.loadPendingVerifications();
                  })
                  .subscribe();
                window._supabaseFeesRealtimeSubscribed = true;
            } catch (rtErr) {
                console.warn('[SupabaseRealtime] Subscription error:', rtErr);
            }
        }

        if (statusEl) {
            statusEl.innerHTML = '<span class="text-success" style="font-size:0.85rem;"><i class="fas fa-check-circle mr-1"></i> Connected to Supabase Cloud (' + feeRecords.length + ' student records live)</span>';
            setTimeout(() => { if (statusEl) statusEl.innerHTML = ''; }, 4000);
        }

        if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
        if (typeof window.loadPendingVerifications === 'function') window.loadPendingVerifications();

        return { ok: true, count: feeRecords.length };
    } catch (err) {
        console.error('[SupabaseFees] Error loading Supabase fees:', err);
        if (statusEl) {
            statusEl.innerHTML = '<span class="text-danger" style="font-size:0.85rem;"><i class="fas fa-exclamation-triangle mr-1"></i> Supabase fees error: ' + (err.message || err) + '</span>';
        }
        return { ok: false, msg: err.message || err };
    }
};\n\n`;
        content = content.slice(0, safeIdx) + loadSupabaseCode + content.slice(safeIdx);
        console.log('✓ Added window.loadSupabaseFeesData to admin.js');
    }
}

// 2. Upgrade loadFeeTable
const loadTableStart = content.indexOf('function loadFeeTable() {');
const loadTableEnd = content.indexOf('function getPendingDues(student, fees) {');

if (loadTableStart !== -1 && loadTableEnd !== -1) {
    const newLoadTable = `function loadFeeTable() {
        if (!classSelect) return;

        const selectedClass = classSelect.value;
        const fees = getFees();

        // Month handling
        const selectedMonth = document.getElementById('feeMonthSelect') ? document.getElementById('feeMonthSelect').value : new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();

        if (displayMonth) displayMonth.textContent = selectedMonth + ' ' + currentYear;

        feeTableBody.innerHTML = '';

        // Month indexing
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = monthNames.indexOf(selectedMonth);
        const now = new Date();
        const currentMonthIndex = now.getMonth();
        const realCurrentYear = now.getFullYear();

        // Filter Students by Class (or All) AND Date of Joining
        let students = getStudents();
        let filteredStudents = students.filter(s => {
            // Class Check
            if (selectedClass && selectedClass !== 'all' && String(s.class || '').replace('Class ', '').trim() !== String(selectedClass).replace('Class ', '').trim()) {
                return false;
            }

            // Date of Joining Check
            if (s.joiningDate) {
                const joinDate = new Date(s.joiningDate);
                const viewMonthStart = new Date(currentYear, monthIndex, 1);
                const joinMonthStart = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);

                if (viewMonthStart < joinMonthStart) {
                    return false; // Student joined after this month
                }
            }
            return true;
        });

        if (filteredStudents.length === 0) {
            const msg = selectedClass ? ('No active students found for this class in ' + selectedMonth + '.') : 'Select Class to view student fees.';
            feeTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">' + msg + '</td></tr>';
            return;
        }

        filteredStudents.forEach(student => {
            const tr = document.createElement('tr');
            const rollUpper = String(student.rollNo || student.id).toUpperCase().trim();
            const fRec = window._supabaseFeeMap ? window._supabaseFeeMap.get(rollUpper) : null;

            let subjectsHtml = '';
            (Array.isArray(student.subjects) && student.subjects.length > 0 ? student.subjects : ['General']).forEach(sub => {
                // Check all fee key variants
                const k1 = student.id + '_' + sub + '_' + selectedMonth + '_' + currentYear;
                const k2 = student.id + '_' + sub + '_' + selectedMonth + ' ' + currentYear;
                const k3 = student.rollNo + '_' + sub + '_' + selectedMonth + '_' + currentYear;
                const k4 = student.rollNo + '_' + sub + '_' + selectedMonth + ' ' + currentYear;

                let isPaid = (fees[k1] === 'Paid' || fees[k2] === 'Paid' || fees[k3] === 'Paid' || fees[k4] === 'Paid');
                let isPendingVerification = false;

                // Also check live Supabase fee record
                if (fRec) {
                    const pmts = Array.isArray(fRec.recent_payments) ? fRec.recent_payments : [];
                    const mShort = selectedMonth.slice(0, 3).toUpperCase();

                    const approvedReceipt = pmts.find(p => 
                        (p.month === mShort || (p.fullMonth && p.fullMonth.includes(selectedMonth))) &&
                        p.status !== 'pending_verification'
                    );
                    if (approvedReceipt) isPaid = true;

                    const pendingReceipt = pmts.find(p => 
                        (p.month === mShort || (p.fullMonth && p.fullMonth.includes(selectedMonth))) &&
                        p.status === 'pending_verification'
                    );
                    if (pendingReceipt) isPendingVerification = true;

                    // If October (or active month) is marked all cleared or current_due === 0
                    if (selectedMonth === 'October' && (Number(fRec.current_due) === 0 || fRec.due_date === 'All Cleared' || fRec.status === 'paid')) {
                        isPaid = true;
                    }
                }

                let status = 'Pending';
                let statusClass = 'fee-pending';
                let canToggle = true;

                if (isPaid) {
                    status = 'Paid';
                    statusClass = 'fee-paid';
                } else if (isPendingVerification) {
                    status = 'Verification Pending';
                    statusClass = 'fee-upcoming';
                } else if (student.joiningDate) {
                    const joinDate = new Date(student.joiningDate);
                    const joinDay = joinDate.getDate();
                    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
                    const dueDay = Math.min(joinDay, daysInMonth);
                    const dueDate = new Date(currentYear, monthIndex, dueDay);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (currentYear === realCurrentYear && monthIndex === currentMonthIndex) {
                        if (today < dueDate) {
                            status = 'Upcoming (Due: ' + dueDay + ')';
                            statusClass = 'fee-upcoming';
                        } else {
                            statusClass = 'fee-pending';
                        }
                    } else if (currentYear < realCurrentYear || (currentYear === realCurrentYear && monthIndex < currentMonthIndex)) {
                        statusClass = 'fee-pending';
                    } else {
                        statusClass = 'fee-upcoming';
                    }
                }

                // Reminder Check
                let reminderBtn = '';
                if (statusClass === 'fee-pending') {
                    const pendingInfo = getPendingDues(student, fees);
                    const pendingMonths = pendingInfo.months.join(', ');
                    const pendingSubjects = pendingInfo.subjects.join(', ');
                    const amountMsg = student.amount ? ('Amount per month: ₹' + student.amount) : 'Amount: Not Set';

                    const msg = 'Dear Parent, fee for student *' + student.name + '* (Class ' + student.class + ') is pending.\\n\\n' +
                        '*Pending Months:* ' + (pendingMonths || selectedMonth) + '\\n' +
                        '*Subjects:* ' + pendingSubjects + '\\n' +
                        '*' + amountMsg + '*\\n\\n' +
                        'Please pay at the earliest.';

                    const whatsappUrl = 'https://wa.me/91' + student.phone + '?text=' + encodeURIComponent(msg);
                    reminderBtn = '<a href="' + whatsappUrl + '" target="_blank" class="btn btn-sm btn-warning shadow-sm" style="font-weight:bold; margin-top: 5px;"><i class="fab fa-whatsapp"></i> Share Reminder</a>';
                }

                subjectsHtml += '<div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 8px;">' +
                    '<span style="font-weight: 500; margin-top: 4px;">' + sub + '</span>' +
                    '<div style="display: flex; flex-direction: column; align-items: flex-end;">' +
                    '<span class="fee-status ' + statusClass + '" onclick="toggleFee(\\'' + student.id + '\\', \\'' + sub + '\\', \\'' + selectedMonth + '\\', \\'' + currentYear + '\\')" style="min-width: 90px; text-align: center; cursor: pointer;">' +
                    status +
                    '</span>' +
                    reminderBtn +
                    '</div>' +
                    '</div>';
            });

            tr.innerHTML = '<td>' +
                '<strong>' + student.name + '</strong>' +
                (student.class ? ('<br><span class="badge badge-light border">Class ' + student.class + '</span>') : '') +
                (student.joiningDate ? ('<small class="text-muted ml-1" style="font-size:0.75rem;">Joined: ' + new Date(student.joiningDate).toLocaleDateString() + '</small>') : '') +
                '</td>' +
                '<td>' + student.phone + '</td>' +
                '<td>' + subjectsHtml + '</td>';
            feeTableBody.appendChild(tr);
        });
    }\n\n    `;
    content = content.slice(0, loadTableStart) + newLoadTable + content.slice(loadTableEnd);
    console.log('✓ Successfully upgraded loadFeeTable in admin.js');
}

// 3. Upgrade window.toggleFee
const toggleStart = content.indexOf('window.toggleFee = function (studentId, subject, month, year) {');
const toggleEnd = content.indexOf('window.loadFeeTable = loadFeeTable;');

if (toggleStart !== -1 && toggleEnd !== -1) {
    const newToggle = `window.toggleFee = function (studentId, subject, month, year) {
        const k1 = studentId + '_' + subject + '_' + month + '_' + year;
        const k2 = studentId + '_' + subject + '_' + month + ' ' + year;
        const fees = getFees();
        var newStatus;
        if (fees[k1] === 'Paid' || fees[k2] === 'Paid') {
            delete fees[k1];
            delete fees[k2];
            newStatus = 'Pending';
        } else {
            fees[k1] = 'Paid';
            fees[k2] = 'Paid';
            newStatus = 'Paid';
        }
        saveFees(fees);

        // Update in-memory feeMap immediately
        const students = getStudents();
        const student = students.find(s => s.id === studentId || s.rollNo === studentId);
        const roll = student ? (student.rollNo || student.id) : studentId;
        const rollUpper = String(roll).toUpperCase().trim();
        if (window._supabaseFeeMap && window._supabaseFeeMap.has(rollUpper)) {
            const rec = window._supabaseFeeMap.get(rollUpper);
            const pmts = Array.isArray(rec.recent_payments) ? [...rec.recent_payments] : [];
            const mShort = month.slice(0, 3).toUpperCase();
            if (newStatus === 'Paid') {
                if (!pmts.some(p => p.month === mShort || (p.fullMonth && p.fullMonth.includes(month)))) {
                    pmts.push({
                        month: mShort,
                        fullMonth: month + ' ' + year,
                        amount: Number(student?.amount) || 4000,
                        paidOn: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                        status: 'Verified by Center Admin',
                        receiptNo: 'REC-' + year + '-' + mShort + '-' + Math.floor(1000 + Math.random() * 9000),
                        utr: 'ADMIN-DIRECT-TOGGLE'
                    });
                }
                if (month === 'October') {
                    rec.current_due = 0;
                    rec.due_date = 'All Cleared';
                    rec.status = 'paid';
                }
            } else {
                rec.recent_payments = pmts.filter(p => !(p.month === mShort && (p.fullMonth?.includes(String(year)) || !p.fullMonth)));
                if (month === 'October') {
                    rec.current_due = Number(student?.amount) || 4000;
                    rec.due_date = '25 October 2026';
                    rec.status = 'due';
                }
            }
        }

        loadFeeTable(); // Refresh UI immediately

        // ── Auto-sync fee change to Supabase ──
        if (typeof sb_toggleFee === 'function') {
            sb_toggleFee(studentId, subject, month, year, newStatus).then(function () {
                if (typeof _showSyncToast === 'function') _showSyncToast('✅ Synced ' + month + ' fee to Supabase');
            }).catch(function (err) {
                console.warn('[ToggleFee] Sync error:', err);
                if (typeof _showSyncToast === 'function') _showSyncToast('⚠️ Fee sync issue — saved locally', true);
            });
        }
    };\n\n    `;
    content = content.slice(0, toggleStart) + newToggle + content.slice(toggleEnd);
    console.log('✓ Successfully upgraded window.toggleFee in admin.js');
}

// 4. Upgrade approveStudentFee and rejectStudentFee
const appStart = content.indexOf('window.approveStudentFee = async function(rollNo, studentName, amount, utr) {');
const appEnd = content.indexOf('// --- PENDING TEST APPROVAL (FACULTY SUBMITTED TESTS) ---');

if (appStart !== -1 && appEnd !== -1) {
    const newApproveReject = `window.approveStudentFee = async function(rollNo, studentName, amount, utr) {
    if (!confirm('Approve ₹' + amount + ' from ' + studentName + '? This marks the student as PAID.')) return;
    const sb = _getSafeAdminSupabase ? _getSafeAdminSupabase() : _getSupabaseClient();
    if (!sb) return;
    try {
        const now = new Date();
        const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const mNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const curMonth = mNames[now.getMonth()];
        const fullMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const paymentEntry = {
            month: curMonth,
            fullMonth: fullMonth,
            paidOn: paidOnStr,
            amount: amount,
            onTime: true,
            status: 'Verified by Center Admin',
            receiptNo: 'REC-' + now.getFullYear() + '-' + curMonth + '-' + Math.floor(1000 + Math.random() * 9000),
            utr: utr || 'ADMIN-APPROVED'
        };

        const { data: rec } = await sb.from('fees_records').select('*').eq('roll_no', rollNo).maybeSingle();
        const cur = Array.isArray(rec && rec.recent_payments) ? rec.recent_payments : [];
        const updated = [paymentEntry, ...cur.filter(p => p.status !== 'pending_verification')];

        const existingLoyalty = Array.isArray(rec?.loyalty_months) ? [...rec.loyalty_months] : [];
        const monthLong = now.toLocaleDateString('en-US', { month: 'long' });
        if (!existingLoyalty.some(l => l.label === monthLong || l.label === fullMonth)) {
            existingLoyalty.push({ label: monthLong, earned: true });
        }

        const { error } = await sb.from('fees_records').update({
            current_due: 0,
            due_date: 'All Cleared',
            days_left: 0,
            status: 'paid',
            loyalty_months: existingLoyalty,
            recent_payments: updated,
            updated_at: now.toISOString()
        }).eq('roll_no', rollNo);

        if (error) throw error;

        // Broadcast to mobile app
        try {
            await sb.channel('fee_realtime_broadcast').send({
                type: 'broadcast',
                event: 'fee_approved',
                payload: { rollNo, approvedAt: now.toISOString() }
            });
        } catch (be) { console.warn('Broadcast:', be); }

        // Update local fees cache under both key variants
        if (typeof getFees === 'function' && typeof getStudents === 'function') {
            const fees = getFees();
            const students = getStudents();
            const matched = students.find(s => s.id === rollNo || s.rollNo === rollNo || s.phone === rollNo);
            const subjects = (matched && Array.isArray(matched.subjects) && matched.subjects.length > 0) ? matched.subjects : ['General'];
            subjects.forEach(sub => {
                const y = now.getFullYear();
                fees[rollNo + '_' + sub + '_' + monthLong + '_' + y] = 'Paid';
                fees[rollNo + '_' + sub + '_' + monthLong + ' ' + y] = 'Paid';
                if (matched && matched.id) {
                    fees[matched.id + '_' + sub + '_' + monthLong + '_' + y] = 'Paid';
                    fees[matched.id + '_' + sub + '_' + monthLong + ' ' + y] = 'Paid';
                }
            });
            if (typeof saveFees === 'function') saveFees(fees);
        }

        // Update in-memory feeMap
        if (window._supabaseFeeMap) {
            window._supabaseFeeMap.set(String(rollNo).toUpperCase().trim(), {
                ...(rec || {}),
                current_due: 0,
                due_date: 'All Cleared',
                days_left: 0,
                status: 'paid',
                recent_payments: updated
            });
        }

        alert('Payment Verified! ' + studentName + ' marked as Paid in Supabase.');
        if (typeof window.loadPendingVerifications === 'function') window.loadPendingVerifications();
        if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
    } catch (e) {
        alert('Failed to approve: ' + (e.message || e));
    }
};

window.rejectStudentFee = async function(rollNo, pendingAmount) {
    if (!confirm('Reject payment for ' + rollNo + '? Status will revert to Due.')) return;
    const sb = _getSafeAdminSupabase ? _getSafeAdminSupabase() : _getSupabaseClient();
    if (!sb) return;
    try {
        const { data: rec } = await sb.from('fees_records').select('recent_payments, current_due').eq('roll_no', rollNo).maybeSingle();
        const cur = Array.isArray(rec && rec.recent_payments) ? rec.recent_payments : [];
        const updated = cur.filter(p => p.status !== 'pending_verification');
        const restoreAmount = pendingAmount || (rec && rec.current_due) || 4000;
        await sb.from('fees_records').update({
            current_due: restoreAmount,
            status: 'due',
            recent_payments: updated,
            updated_at: new Date().toISOString()
        }).eq('roll_no', rollNo);

        try {
            await sb.channel('fee_realtime_broadcast').send({
                type: 'broadcast',
                event: 'fee_rejected',
                payload: { rollNo, rejectedAt: new Date().toISOString() }
            });
        } catch (be) { console.warn('Broadcast:', be); }

        alert('Payment rejected. Student status set to Due.');
        if (typeof window.loadPendingVerifications === 'function') window.loadPendingVerifications();
        if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
    } catch (e) {
        alert('Failed to reject: ' + (e.message || e));
    }
};\n\n`;
    content = content.slice(0, appStart) + newApproveReject + content.slice(appEnd);
    console.log('✓ Successfully upgraded approveStudentFee and rejectStudentFee');
}

// 5. Upgrade quickMarkPaidUpToMonth to include status: 'paid'
content = content.replace(
    "current_due: isCurrentCycleCovered ? 0 : monthlyFee,\n                    due_date: isCurrentCycleCovered ? 'All Cleared' : '25 October 2026',",
    "current_due: isCurrentCycleCovered ? 0 : monthlyFee,\n                    due_date: isCurrentCycleCovered ? 'All Cleared' : '25 October 2026',\n                    status: isCurrentCycleCovered ? 'paid' : 'due',"
);
console.log('✓ Upgraded quickMarkPaidUpToMonth payload in admin.js');

fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log('Saved updated admin.js ✓');
