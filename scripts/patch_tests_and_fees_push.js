const fs = require('fs');

const adminJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
const masterHubJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\master_hub.js';
const masterHubHtmlPath = 'C:\\Users\\madhu\\code_test\\private\\master_hub.html';

// ─── 1. PATCH admin.js: Wire push into window.approvePendingTest ─────────────
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

const oldApproveSuccess = `alert('Test approved and broadcast to students!');`;
const newApproveSuccess = `// Send live lock-screen push notifications to students of this class
        let pushedCount = 0;
        try {
            if (typeof sendExpoPushNotification === 'function') {
                pushedCount = await sendExpoPushNotification({
                    title: '📝 Test Scheduled: [' + classTag + '] ' + subject,
                    message: 'Date: ' + examDate + ' | Time: ' + timeStr + ' | Venue: ' + venueStr + ' | Max: ' + marks + ' marks',
                    targetClass: classTag
                });
            }
        } catch (_) {}

        const pushSummary = pushedCount > 0 ? (' (Push sent to ' + pushedCount + ' student phones)') : '';
        alert('Test approved and broadcast to students!' + pushSummary);`;

if (adminJs.includes(oldApproveSuccess) && !adminJs.includes("pushedCount = await sendExpoPushNotification")) {
    adminJs = adminJs.replace(oldApproveSuccess, newApproveSuccess);
    fs.writeFileSync(adminJsPath, adminJs, 'utf8');
    console.log('✓ Wired push notifications into admin.js approvePendingTest');
} else {
    console.log('admin.js approvePendingTest pattern note: already present or not found');
}

// ─── 2. PATCH master_hub.js: Add sendFiveDayFeeReminders function ───────────
let masterHubJs = fs.readFileSync(masterHubJsPath, 'utf8');

const feeRemindersFunction = `
// ─── 5-DAY FEE DUE REMINDER DISPATCHER ──────────────────────────────────────
window.sendFiveDayFeeReminders = async function(btnElement) {
    if (!confirm('Scan all student fee records and dispatch push reminders to students whose fee is due within 5 days?')) {
        return;
    }

    const sb = typeof _getMasterHubSupabase === 'function' ? _getMasterHubSupabase() : (typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null);
    if (!sb) {
        alert('Database connection unavailable. Please reload the page.');
        return;
    }

    let origBtnText = '';
    if (btnElement) {
        origBtnText = btnElement.innerHTML;
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Checking & Sending...';
    }

    try {
        // 1. Fetch fees_records with current_due > 0 and days_left <= 5
        const { data: feeRows, error: feeErr } = await sb
            .from('fees_records')
            .select('roll_no, current_due, due_date, days_left, status');

        if (feeErr) throw feeErr;

        if (!feeRows || feeRows.length === 0) {
            alert('No fee records found in Supabase.');
            return;
        }

        // Filter: unpaid and days_left <= 5 (including overdue days_left <= 0)
        const dueSoon = feeRows.filter(r => {
            const due = Number(r.current_due) || 0;
            const days = Number(r.days_left);
            const isDue = (r.status === 'due' || r.status === 'overdue' || due > 0);
            return isDue && !isNaN(days) && days <= 5;
        });

        if (dueSoon.length === 0) {
            alert('ℹ️ All caught up! No students currently have fees due within 5 days.');
            return;
        }

        console.log('[FeeReminder] Found ' + dueSoon.length + ' students with fees due in <= 5 days.');

        // 2. Fetch all push tokens to match roll_no
        const { data: tokenRows, error: tokErr } = await sb
            .from('push_tokens')
            .select('roll_no, push_token');

        if (tokErr) throw tokErr;

        const tokenMap = new Map();
        (tokenRows || []).forEach(t => {
            const r = (t.roll_no || '').toUpperCase().trim();
            if (!tokenMap.has(r)) tokenMap.set(r, []);
            tokenMap.get(r).push(t.push_token);
        });

        const messages = [];
        let studentsWithDevices = 0;

        dueSoon.forEach(record => {
            const r = (record.roll_no || '').toUpperCase().trim();
            const tokens = tokenMap.get(r);
            if (tokens && tokens.length > 0) {
                studentsWithDevices++;
                const dueAmt = record.current_due || 4000;
                const dueDateStr = record.due_date || 'this month';
                const days = record.days_left;
                const timingStr = days < 0 ? (\`(\${Math.abs(days)} days overdue)\`) : (days === 0 ? '(Due today!)' : \`(\${days} days remaining)\`);

                tokens.forEach(tok => {
                    messages.push({
                        to: tok,
                        sound: 'default',
                        title: '⚠️ Tuition Fee Due Reminder',
                        body: \`Your tuition fee of ₹\${dueAmt} is due on \${dueDateStr} \${timingStr}. Please pay via UPI in the app to avoid late fees.\`,
                        channelId: 'default',
                        priority: 'high',
                    });
                });
            }
        });

        if (messages.length === 0) {
            alert('ℹ️ Found ' + dueSoon.length + ' student(s) with upcoming due dates, but none have registered mobile devices in the app yet.');
            return;
        }

        // 3. Dispatch to Expo
        const chunkSize = 100;
        for (let i = 0; i < messages.length; i += chunkSize) {
            const chunk = messages.slice(i, i + chunkSize);
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(chunk)
            });
        }

        alert('✅ Fee reminders dispatched!\\n\\n• Students with fee due in <= 5 days: ' + dueSoon.length + '\\n• Notifications sent to ' + messages.length + ' device(s) (' + studentsWithDevices + ' student accounts).');
    } catch (err) {
        alert('Failed to send fee reminders: ' + (err.message || err));
    } finally {
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = origBtnText;
        }
    }
};
`;

if (!masterHubJs.includes('window.sendFiveDayFeeReminders')) {
    masterHubJs = masterHubJs.trimEnd() + '\n' + feeRemindersFunction;
    fs.writeFileSync(masterHubJsPath, masterHubJs, 'utf8');
    console.log('✓ Added sendFiveDayFeeReminders function to master_hub.js');
} else {
    console.log('sendFiveDayFeeReminders already in master_hub.js');
}

// ─── 3. PATCH master_hub.html: Add the 5-Day Reminder Button ─────────────────
let masterHubHtml = fs.readFileSync(masterHubHtmlPath, 'utf8');

const oldGenBtn = `<button class="btn btn-warning font-weight-bold" onclick="generateMonthlyFeeCycle()">
                                <i class="fas fa-bolt mr-1"></i> Generate Cycle Dues
                            </button>`;

const newGenBtnGroup = `<button class="btn btn-warning font-weight-bold" onclick="generateMonthlyFeeCycle()">
                                <i class="fas fa-bolt mr-1"></i> Generate Cycle Dues
                            </button>
                            <button class="btn btn-danger font-weight-bold ml-2" onclick="sendFiveDayFeeReminders(this)" title="Send lock-screen push reminders to students with dues within 5 days">
                                <i class="fas fa-bell mr-1"></i> Send 5-Day Due Reminders
                            </button>`;

if (masterHubHtml.includes(oldGenBtn) && !masterHubHtml.includes('sendFiveDayFeeReminders(this)')) {
    masterHubHtml = masterHubHtml.replace(oldGenBtn, newGenBtnGroup);
    fs.writeFileSync(masterHubHtmlPath, masterHubHtml, 'utf8');
    console.log('✓ Added 5-Day Due Reminders button to master_hub.html');
} else {
    console.log('master_hub.html button already present or pattern mismatch');
}
