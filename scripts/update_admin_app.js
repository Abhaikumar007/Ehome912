const fs = require('fs');
const path = require('path');

const adminDir = 'C:\\Users\\madhu\\code_test\\private';

// 1. Update timetable.html
const timetablePath = path.join(adminDir, 'timetable.html');
if (fs.existsSync(timetablePath)) {
  let html = fs.readFileSync(timetablePath, 'utf8');
  if (!html.includes('shareAppBtn')) {
    const target = `<button class="btn btn-primary btn-lg" id="shareWhatsappBtn">
                        <i class="fab fa-whatsapp"></i> Download Schedule
                    </button>`;
    const replacement = `<button class="btn btn-primary btn-lg" id="shareWhatsappBtn">
                        <i class="fab fa-whatsapp"></i> Download Schedule
                    </button>
                    <button class="btn btn-success btn-lg ml-2" id="shareAppBtn" onclick="shareTimetableToApp()">
                        <i class="fas fa-paper-plane mr-1"></i> 🚀 Share Timetable to Mobile App
                    </button>`;
    if (html.includes('id="shareWhatsappBtn"')) {
      html = html.replace(/<button class="btn btn-primary btn-lg" id="shareWhatsappBtn">[\s\S]*?<\/button>/, replacement);
      fs.writeFileSync(timetablePath, html, 'utf8');
      console.log('✓ timetable.html updated with Share Timetable to Mobile App button.');
    }
  } else {
    console.log('timetable.html already contains shareAppBtn.');
  }
}

// 2. Update fees.html to add Pending Verification Queue
const feesPath = path.join(adminDir, 'fees.html');
if (fs.existsSync(feesPath)) {
  let html = fs.readFileSync(feesPath, 'utf8');
  if (!html.includes('pendingVerificationSection')) {
    const queueHtml = `
        <!-- Pending Verification Queue for Mobile App Student Payments -->
        <div class="card mb-4 border-warning shadow-sm" id="pendingVerificationSection" style="border-left: 5px solid #f59e0b; border-radius: 12px; overflow: hidden;">
            <div class="card-header bg-white d-flex justify-content-between align-items-center" style="padding: 14px 20px;">
                <h5 class="mb-0 text-warning" style="font-weight: 700;">
                    <i class="fas fa-clock mr-2"></i> Pending Student Fee Verifications (Mobile App)
                </h5>
                <button class="btn btn-sm btn-outline-warning" onclick="loadPendingVerifications()" style="border-radius: 20px; font-weight: 600;">
                    <i class="fas fa-sync-alt mr-1"></i> Refresh Queue
                </button>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0" style="font-size: 0.92rem;">
                        <thead class="thead-light">
                            <tr>
                                <th>Student</th>
                                <th>Class & Roll</th>
                                <th>Amount</th>
                                <th>Transaction / UTR</th>
                                <th>Submitted On</th>
                                <th style="width: 200px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="pendingVerificationBody">
                            <tr>
                                <td colspan="6" class="text-center text-muted py-3">Checking for pending mobile payments...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
`;
    // Insert right before `<div class="row mb-4">`
    if (html.includes('<div class="row mb-4">')) {
      html = html.replace('<div class="row mb-4">', queueHtml + '\n        <div class="row mb-4">');
      
      // Also add auto-load in DOMContentLoaded
      if (!html.includes('loadPendingVerifications()')) {
        html = html.replace(
          "if (typeof window.loadFeeTable === 'function') {",
          "if (typeof window.loadPendingVerifications === 'function') { window.loadPendingVerifications(); }\n                    if (typeof window.loadFeeTable === 'function') {"
        );
      }

      fs.writeFileSync(feesPath, html, 'utf8');
      console.log('✓ fees.html updated with Pending Student Fee Verification section.');
    }
  } else {
    console.log('fees.html already contains pendingVerificationSection.');
  }
}

// 3. Update js/admin.js with schema-compatible shareTimetableToApp, loadPendingVerifications, approveStudentFee, rejectStudentFee
const adminJsPath = path.join(adminDir, 'js', 'admin.js');
if (fs.existsSync(adminJsPath)) {
  let js = fs.readFileSync(adminJsPath, 'utf8');

  // Strip older version if present
  if (js.includes('// --- SHARE TIMETABLE TO MOBILE APP (STUDENT & FACULTY SYNC) ---')) {
    js = js.split('// --- SHARE TIMETABLE TO MOBILE APP (STUDENT & FACULTY SYNC) ---')[0].trim();
  }

  const additions = `
// --- SHARE TIMETABLE TO MOBILE APP (STUDENT & FACULTY SYNC) ---
window.shareTimetableToApp = async function () {
    if (!timetableEntries || timetableEntries.length === 0) {
        alert("Please add at least one timetable entry to share.");
        return;
    }

    const shareBtn = document.getElementById('shareAppBtn');
    if (shareBtn) {
        shareBtn.disabled = true;
        shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Sharing to App...';
    }

    try {
        const sb = _getSupabaseClient();
        if (!sb) {
            alert("Database connection not ready. Please check your network and try again.");
            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> 🚀 Share Timetable to Mobile App';
            }
            return;
        }

        const rowsToInsert = [];
        const announcementsToInsert = [];

        for (const entry of timetableEntries) {
            let timeStr = '';
            if (entry.startTime && entry.endTime) {
                timeStr = \`\${formatTime12Hour(entry.startTime)} - \${formatTime12Hour(entry.endTime)}\`;
            } else if (entry.startTime) {
                timeStr = formatTime12Hour(entry.startTime);
            } else {
                timeStr = 'Scheduled';
            }

            const rawCls = String(entry.class || '');
            const gradeStr = rawCls.startsWith('Class') ? rawCls : 'Class ' + rawCls;

            rowsToInsert.push({
                class_grade: gradeStr,
                subject: entry.subject,
                time: timeStr,
                status: 'upcoming',
                published: true,
                class_date: entry.date,
            });

            announcementsToInsert.push({
                title: \`📅 Timetable Published: \${gradeStr} (\${entry.subject})\`,
                description: \`Date: \${formatDateFriendly(entry.date)} | Time: \${timeStr} | Venue: \${entry.location || 'In Center'} (\${entry.board || 'Both'} Board). Check your schedule tab.\`,
                author: 'Center Admin',
                tag: 'Timetable',
                important: true,
            });
        }

        // 1. Insert into Supabase classes table
        const { error: classErr } = await sb.from('classes').insert(rowsToInsert);
        if (classErr) {
            console.error('Error inserting classes:', classErr);
            throw classErr;
        }

        // 2. Broadcast announcement so mobile alerts fire instantly
        if (announcementsToInsert.length > 0) {
            await sb.from('announcements').insert(announcementsToInsert);
        }

        alert(\`✓ Timetable Successfully Shared to Mobile App!\\n\\n\${rowsToInsert.length} session(s) published.\\nStudents and faculty will see this schedule on their live dashboard.\`);
    } catch (e) {
        console.error('Failed to share timetable:', e);
        alert("Failed to share timetable to mobile app: " + (e.message || e));
    } finally {
        if (shareBtn) {
            shareBtn.disabled = false;
            shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> 🚀 Share Timetable to Mobile App';
        }
    }
};

// --- PENDING FEE VERIFICATION QUEUE (MOBILE APP APPROVAL) ---
window.loadPendingVerifications = async function() {
    const tbody = document.getElementById('pendingVerificationBody');
    if (!tbody) return;

    const sb = _getSupabaseClient();
    if (!sb) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Database client not initialized.</td></tr>';
        return;
    }

    try {
        const { data, error } = await sb
            .from('fees_records')
            .select('*');

        if (error) throw error;

        const pending = [];
        (data || []).forEach(record => {
            const payments = Array.isArray(record.recent_payments) ? record.recent_payments : [];
            const pItem = payments.find(p => p.status === 'pending_verification');
            if (pItem) {
                pending.push({
                    record,
                    payment: pItem,
                });
            }
        });

        if (pending.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-success py-3"><i class="fas fa-check-circle mr-1"></i> No pending verification requests. All mobile student fees are cleared!</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        pending.forEach(({ record, payment }) => {
            const tr = document.createElement('tr');
            const studentName = payment.studentName || record.roll_no;
            const rollNo = record.roll_no || '';
            const amount = payment.amount || record.current_due || 4000;
            const utr = payment.utr || 'UPI-APP';
            const submittedAt = payment.submittedAt ? new Date(payment.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today';

            tr.innerHTML = \`
                <td><strong>\${studentName}</strong></td>
                <td><span class="badge badge-info">Class 12</span> <small class="text-muted">\${rollNo}</small></td>
                <td><strong class="text-primary">₹\${amount.toLocaleString('en-IN')}</strong></td>
                <td><code>\${utr}</code></td>
                <td><small class="text-muted">\${submittedAt}</small></td>
                <td>
                    <button class="btn btn-sm btn-success shadow-sm mr-1" onclick="approveStudentFee('\${rollNo}', '\${studentName}', \${amount}, '\${utr}')">
                        <i class="fas fa-check-circle mr-1"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-outline-danger shadow-sm" onclick="rejectStudentFee('\${rollNo}')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            \`;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error loading pending verifications:', e);
        tbody.innerHTML = \`<tr><td colspan="6" class="text-center text-danger py-3">Failed to load pending payments: \${e.message || e}</td></tr>\`;
    }
};

window.approveStudentFee = async function(rollNo, studentName, amount, utr) {
    if (!confirm(\`Approve fee payment of ₹\${amount} from \${studentName} (\${rollNo})?\\n\\nThis will immediately mark the student's dashboard and profile as PAID / Cleared.\`)) {
        return;
    }

    const sb = _getSupabaseClient();
    if (!sb) return;

    try {
        const now = new Date();
        const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const paymentEntry = {
            month: 'SEP',
            fullMonth: 'September 2026',
            paidOn: paidOnStr,
            amount: amount,
            onTime: true,
            status: 'Verified by Center Admin',
            receiptNo: 'REC-2026-SEP-' + Math.floor(1000 + Math.random() * 9000),
            utr: utr,
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

        alert(\`✓ Payment Verified!\\n\${studentName}'s fee has been marked as Paid and synchronized to their student portal.\`);
        window.loadPendingVerifications();
    } catch (e) {
        alert("Failed to approve fee: " + (e.message || e));
    }
};

window.rejectStudentFee = async function(rollNo) {
    if (!confirm(\`Reject payment verification for roll \${rollNo}? The student's fee status will revert to Due.\`)) {
        return;
    }

    const sb = _getSupabaseClient();
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
                current_due: 4000,
                recent_payments: updatedPayments,
                updated_at: new Date().toISOString(),
            })
            .eq('roll_no', rollNo);

        alert('Payment request rejected. Student status set to Due.');
        window.loadPendingVerifications();
    } catch (e) {
        alert("Failed to reject fee: " + (e.message || e));
    }
};
`;

  fs.writeFileSync(adminJsPath, js + '\n' + additions, 'utf8');
  console.log('✓ js/admin.js updated with schema-compatible timetable sharing and fee approval handlers.');
}
