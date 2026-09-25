const fs = require('fs');
const path = require('path');

const adminJsPath = 'C:/Users/madhu/code_test/private/js/admin.js';
let content = fs.readFileSync(adminJsPath, 'utf8');

const newCode = `// --- PENDING FEE VERIFICATION QUEUE (BULLETPROOF APPROVAL FOR MOBILE APP) ---
window._pendingFeeRegistry = {};

function _getSafeAdminSupabase() {
    if (typeof _getSupabaseClient === 'function') {
        const c = _getSupabaseClient();
        if (c) return c;
    }
    if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) {
        try {
            return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn('[Admin] Direct Supabase init error:', e);
        }
    }
    return null;
}

window.loadPendingVerifications = async function() {
    const tbodyList = document.querySelectorAll('#pendingVerificationBody');
    if (!tbodyList || tbodyList.length === 0) return;

    const sb = _getSafeAdminSupabase();
    if (!sb) {
        tbodyList.forEach(tb => {
            tb.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Database client not initialized. Please refresh.</td></tr>';
        });
        return;
    }

    try {
        const { data, error } = await sb
            .from('fees_records')
            .select('*');

        if (error) throw error;

        const pending = [];
        window._pendingFeeRegistry = {};

        (data || []).forEach(record => {
            const payments = Array.isArray(record.recent_payments) ? record.recent_payments : [];
            const pItem = payments.find(p => p.status === 'pending_verification');
            if (pItem) {
                const rollNo = record.roll_no || '';
                const studentName = pItem.studentName || record.roll_no || 'Student';
                const amount = Number(pItem.amount) || Number(record.current_due) || 2500;
                const utr = pItem.utr || 'UPI-APP';
                const studentClass = pItem.class || record.class || 'Student';
                const submittedAt = pItem.submittedAt ? new Date(pItem.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently';

                window._pendingFeeRegistry[rollNo] = {
                    record,
                    payment: pItem,
                    rollNo,
                    studentName,
                    amount,
                    utr,
                    studentClass,
                    submittedAt,
                };

                pending.push(window._pendingFeeRegistry[rollNo]);
            }
        });

        tbodyList.forEach(tbody => {
            if (pending.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-success py-3 font-weight-bold"><i class="fas fa-check-circle mr-1"></i> No pending verification requests. All mobile student fees are cleared!</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            pending.forEach(item => {
                const tr = document.createElement('tr');
                const safeId = item.rollNo.replace(/[^a-zA-Z0-9_-]/g, '_');
                tr.id = 'pendingRow_' + safeId;
                tr.innerHTML = \`
                    <td><strong>\${item.studentName}</strong></td>
                    <td><span class="badge badge-info">\${item.studentClass}</span> <small class="text-muted">\${item.rollNo}</small></td>
                    <td><strong class="text-primary">₹\${item.amount.toLocaleString('en-IN')}</strong></td>
                    <td><code>\${item.utr}</code></td>
                    <td><small class="text-muted">\${item.submittedAt}</small></td>
                    <td>
                        <button class="btn btn-sm btn-success shadow-sm mr-1 btn-approve-fee" id="btnApprove_\${safeId}" onclick="window.requestApproveFee('\${item.rollNo}', this)">
                            <i class="fas fa-check-circle mr-1"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-outline-danger shadow-sm btn-reject-fee" id="btnReject_\${safeId}" onclick="window.requestRejectFee('\${item.rollNo}', this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                \`;
                tbody.appendChild(tr);
            });
        });

        // Update badge counters if present
        const badgeCount = document.getElementById('pendingFeeBadgeCount');
        if (badgeCount) {
            badgeCount.innerText = pending.length;
            badgeCount.style.display = pending.length > 0 ? 'inline-block' : 'none';
        }
    } catch (e) {
        console.error('Error loading pending verifications:', e);
        tbodyList.forEach(tb => {
            tb.innerHTML = \`<tr><td colspan="6" class="text-center text-danger py-3">Failed to load pending payments: \${e.message || e}</td></tr>\`;
        });
    }
};

window.requestApproveFee = function(rollNo, btn) {
    if (!btn) return;

    if (btn.getAttribute('data-step') === 'confirm') {
        window.executeApproveFee(rollNo, btn);
    } else {
        btn.setAttribute('data-step', 'confirm');
        btn.className = 'btn btn-sm btn-warning shadow-sm font-weight-bold mr-1';
        btn.innerHTML = '<i class="fas fa-check-double mr-1"></i> Really Approve?';

        setTimeout(() => {
            if (btn && btn.getAttribute('data-step') === 'confirm') {
                btn.setAttribute('data-step', 'initial');
                btn.className = 'btn btn-sm btn-success shadow-sm mr-1';
                btn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Approve';
            }
        }, 5000);
    }
};

window.executeApproveFee = async function(rollNo, btn) {
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Approving...';
    }

    const sb = _getSafeAdminSupabase();
    if (!sb) {
        alert('Database connection not available. Please refresh the page.');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Approve';
            btn.setAttribute('data-step', 'initial');
        }
        return;
    }

    const item = window._pendingFeeRegistry[rollNo] || { rollNo, amount: 2500, studentName: rollNo, utr: 'UPI-APP' };

    try {
        const now = new Date();
        const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const paymentEntry = {
            month: 'SEP',
            fullMonth: 'September 2026',
            paidOn: paidOnStr,
            amount: item.amount,
            onTime: true,
            status: 'Verified by Center Admin',
            receiptNo: 'REC-2026-SEP-' + Math.floor(1000 + Math.random() * 9000),
            utr: item.utr,
        };

        const { data: currentRecord } = await sb
            .from('fees_records')
            .select('recent_payments')
            .eq('roll_no', rollNo)
            .maybeSingle();

        const currentPayments = Array.isArray(currentRecord?.recent_payments) ? currentRecord.recent_payments : [];
        const updatedPayments = [paymentEntry, ...currentPayments.filter(p => p.status !== 'pending_verification')];

        const { error } = await sb
            .from('fees_records')
            .update({
                current_due: 0,
                recent_payments: updatedPayments,
                updated_at: now.toISOString(),
            })
            .eq('roll_no', rollNo);

        if (error) throw error;

        // Also update local storage fees if matching
        try {
            if (typeof getFees === 'function' && typeof getStudents === 'function') {
                const fees = getFees();
                const students = getStudents();
                const matched = students.find(s => s.id === rollNo || s.phone === rollNo);
                if (matched && Array.isArray(matched.subjects)) {
                    matched.subjects.forEach(sub => {
                        fees[\`\${matched.id}_\${sub}_September_2026\`] = 'Paid';
                    });
                    if (typeof saveFees === 'function') saveFees(fees);
                    if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
                }
            }
        } catch (localErr) {
            console.warn('Local fee sync notice:', localErr);
        }

        window.showPendingFeeNotice(\`✓ Payment of ₹\${item.amount.toLocaleString('en-IN')} from \${item.studentName} APPROVED and marked as PAID!\`, 'success');
        await window.loadPendingVerifications();
    } catch (e) {
        console.error('Error approving student fee:', e);
        window.showPendingFeeNotice('Failed to approve fee: ' + (e.message || e), 'danger');
        if (btn) {
            btn.disabled = false;
            btn.className = 'btn btn-sm btn-success shadow-sm mr-1';
            btn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Approve';
            btn.setAttribute('data-step', 'initial');
        }
    }
};

window.requestRejectFee = function(rollNo, btn) {
    if (!btn) return;
    if (btn.getAttribute('data-step') === 'confirm') {
        window.executeRejectFee(rollNo, btn);
    } else {
        btn.setAttribute('data-step', 'confirm');
        btn.className = 'btn btn-sm btn-danger shadow-sm font-weight-bold';
        btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i> Really Reject?';

        setTimeout(() => {
            if (btn && btn.getAttribute('data-step') === 'confirm') {
                btn.setAttribute('data-step', 'initial');
                btn.className = 'btn btn-sm btn-outline-danger shadow-sm';
                btn.innerHTML = '<i class="fas fa-times"></i>';
            }
        }, 5000);
    }
};

window.executeRejectFee = async function(rollNo, btn) {
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    const sb = _getSafeAdminSupabase();
    if (!sb) return;

    try {
        const { data: currentRecord } = await sb
            .from('fees_records')
            .select('recent_payments')
            .eq('roll_no', rollNo)
            .maybeSingle();

        const currentPayments = Array.isArray(currentRecord?.recent_payments) ? currentRecord.recent_payments : [];
        const updatedPayments = currentPayments.filter(p => p.status !== 'pending_verification');

        await sb
            .from('fees_records')
            .update({
                current_due: 2500,
                recent_payments: updatedPayments,
                updated_at: new Date().toISOString(),
            })
            .eq('roll_no', rollNo);

        window.showPendingFeeNotice(\`Verification rejected for roll \${rollNo}. Student status reverted to Due.\`, 'warning');
        await window.loadPendingVerifications();
    } catch (e) {
        window.showPendingFeeNotice('Failed to reject fee: ' + (e.message || e), 'danger');
        if (btn) {
            btn.disabled = false;
            btn.className = 'btn btn-sm btn-outline-danger shadow-sm';
            btn.innerHTML = '<i class="fas fa-times"></i>';
            btn.setAttribute('data-step', 'initial');
        }
    }
};

window.showPendingFeeNotice = function(msg, type) {
    type = type || 'success';
    const alertBoxes = document.querySelectorAll('.pending-fee-notice-area');
    if (alertBoxes.length > 0) {
        alertBoxes.forEach(box => {
            box.innerHTML = \`<div class="alert alert-\${type} alert-dismissible fade show mb-3 shadow-sm" role="alert">
                <i class="fas \${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
                \${msg}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>\`;
            setTimeout(() => { box.innerHTML = ''; }, 6000);
        });
    } else {
        alert(msg);
    }
};

// Aliases for compatibility
window.approveStudentFee = function(rollNo, studentName, amount, utr) {
    const safeId = (rollNo || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    window.requestApproveFee(rollNo, document.getElementById('btnApprove_' + safeId));
};
window.rejectStudentFee = function(rollNo) {
    const safeId = (rollNo || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    window.requestRejectFee(rollNo, document.getElementById('btnReject_' + safeId));
};
`;

const marker = '// --- PENDING FEE VERIFICATION QUEUE';
const idx = content.indexOf(marker);
if (idx !== -1) {
    content = content.substring(0, idx) + newCode;
    fs.writeFileSync(adminJsPath, content, 'utf8');
    console.log('Successfully updated admin.js!');
} else {
    console.log('Marker not found in admin.js!');
}
