const fs = require('fs');
const adminJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
if (!fs.existsSync(adminJsPath)) { console.log('admin.js not found - skipping.'); process.exit(0); }
let js = fs.readFileSync(adminJsPath, 'utf8');
if (js.includes('// --- PENDING FEE VERIFICATION QUEUE')) {
  js = js.split('// --- PENDING FEE VERIFICATION QUEUE')[0].trimEnd();
}
const feeBlock = `
// --- PENDING FEE VERIFICATION QUEUE (MOBILE APP APPROVAL) ---
window.loadPendingVerifications = async function() {
    const tbody = document.getElementById('pendingVerificationBody');
    if (!tbody) return;
    const sb = _getSupabaseClient();
    if (!sb) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">Database not initialized.</td></tr>'; return; }
    try {
        const { data, error } = await sb.from('fees_records').select('*');
        if (error) throw error;
        const pending = [];
        (data || []).forEach(record => {
            const payments = Array.isArray(record.recent_payments) ? record.recent_payments : [];
            const pItem = payments.find(p => p.status === 'pending_verification');
            if (pItem) pending.push({ record, payment: pItem });
        });
        if (pending.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-success py-3"><i class="fas fa-check-circle mr-1"></i> All fees cleared!</td></tr>'; return; }
        tbody.innerHTML = '';
        pending.forEach(({ record, payment }) => {
            const tr = document.createElement('tr');
            const studentName = payment.studentName || record.roll_no;
            const rollNo = record.roll_no || '';
            const amount = payment.amount || record.current_due || 4000;
            const utr = payment.utr || 'UPI-APP';
            const submittedAt = payment.submittedAt ? new Date(payment.submittedAt).toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Today';
            const studentClass = payment.studentClass || record.student_class || '';
            const hasScreenshot = payment.screenshot && (payment.screenshot.startsWith('data:image') || payment.screenshot.startsWith('http'));
            const screenshotHtml = hasScreenshot ? '<img src="' + payment.screenshot + '" style="width:52px;height:52px;object-fit:cover;border-radius:6px;border:1.5px solid #e5e7eb;cursor:pointer" onclick="window.open(this.src,\\'_blank\\')" title="View receipt" />' : '<span class="text-muted small">No screenshot</span>';
            const classBadge = studentClass ? ('<span class="badge badge-info">' + studentClass + '</span> ') : '';
            tr.innerHTML = '<td><strong>' + studentName + '</strong></td>' +
                '<td>' + classBadge + '<small class="text-muted">' + rollNo + '</small></td>' +
                '<td><strong class="text-primary">&#8377;' + amount.toLocaleString('en-IN') + '</strong></td>' +
                '<td><code>' + utr + '</code></td>' +
                '<td>' + screenshotHtml + '</td>' +
                '<td><small class="text-muted">' + submittedAt + '</small></td>' +
                '<td><button class="btn btn-sm btn-success shadow-sm mr-1" onclick="approveStudentFee(\\'' + rollNo + '\\',\\'' + studentName + '\\',' + amount + ',\\'' + utr + '\\')"><i class="fas fa-check-circle mr-1"></i> Approve</button><button class="btn btn-sm btn-outline-danger shadow-sm" onclick="rejectStudentFee(\\'' + rollNo + '\\',' + amount + ')"><i class="fas fa-times"></i></button></td>';
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-3">Failed to load.</td></tr>'; }
};

window.approveStudentFee = async function(rollNo, studentName, amount, utr) {
    if (!confirm('Approve Rs.' + amount + ' from ' + studentName + '? This marks the student as PAID.')) return;
    const sb = _getSupabaseClient();
    if (!sb) return;
    try {
        const now = new Date();
        const paidOnStr = now.toLocaleDateString('en-US', {day:'numeric',month:'short',year:'numeric'});
        const mNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const paymentEntry = { month: mNames[now.getMonth()], fullMonth: now.toLocaleDateString('en-US',{month:'long',year:'numeric'}), paidOn: paidOnStr, amount: amount, onTime: true, status: 'Verified by Center Admin', receiptNo: 'REC-' + now.getFullYear() + '-' + mNames[now.getMonth()] + '-' + Math.floor(1000 + Math.random() * 9000), utr: utr };
        const { data: rec } = await sb.from('fees_records').select('recent_payments').eq('roll_no', rollNo).maybeSingle();
        const cur = Array.isArray(rec && rec.recent_payments) ? rec.recent_payments : [];
        const updated = [paymentEntry, ...cur.filter(p => p.status !== 'pending_verification')];
        const { error } = await sb.from('fees_records').update({ current_due: 0, recent_payments: updated, updated_at: now.toISOString() }).eq('roll_no', rollNo);
        if (error) throw error;
        try { await sb.channel('fee_realtime_broadcast').send({ type: 'broadcast', event: 'fee_approved', payload: { rollNo, approvedAt: now.toISOString() } }); } catch(be) { console.warn('Broadcast:', be); }
        if (typeof getFees === 'function' && typeof getStudents === 'function') { const fees = getFees(); const students = getStudents(); const matched = students.find(s => s.id === rollNo || s.phone === rollNo); if (matched && Array.isArray(matched.subjects)) { matched.subjects.forEach(sub => { fees[matched.id + '_' + sub + '_' + paymentEntry.fullMonth] = 'Paid'; }); if (typeof saveFees === 'function') saveFees(fees); if (typeof window.loadFeeTable === 'function') window.loadFeeTable(); } }
        alert('Payment Verified! ' + studentName + ' marked as Paid.');
        window.loadPendingVerifications();
    } catch (e) { alert('Failed to approve: ' + (e.message || e)); }
};

window.rejectStudentFee = async function(rollNo, pendingAmount) {
    if (!confirm('Reject payment for ' + rollNo + '? Status will revert to Due.')) return;
    const sb = _getSupabaseClient();
    if (!sb) return;
    try {
        const { data: rec } = await sb.from('fees_records').select('recent_payments, current_due').eq('roll_no', rollNo).maybeSingle();
        const cur = Array.isArray(rec && rec.recent_payments) ? rec.recent_payments : [];
        const updated = cur.filter(p => p.status !== 'pending_verification');
        const restoreAmount = pendingAmount || (rec && rec.current_due) || 4000;
        await sb.from('fees_records').update({ current_due: restoreAmount, recent_payments: updated, updated_at: new Date().toISOString() }).eq('roll_no', rollNo);
        try { await sb.channel('fee_realtime_broadcast').send({ type: 'broadcast', event: 'fee_rejected', payload: { rollNo, rejectedAt: new Date().toISOString() } }); } catch(be) { console.warn('Broadcast:', be); }
        alert('Payment rejected. Student status set to Due.');
        window.loadPendingVerifications();
    } catch (e) { alert('Failed to reject: ' + (e.message || e)); }
};
`;
js = js.trimEnd() + '\n' + feeBlock;
fs.writeFileSync(adminJsPath, js, 'utf8');
console.log('admin.js patched: screenshot, realtime broadcast, correct amounts.');
