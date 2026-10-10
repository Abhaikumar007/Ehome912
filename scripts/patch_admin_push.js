const fs = require('fs');

const adminPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
if (!fs.existsSync(adminPath)) {
    console.error('Target not found:', adminPath);
    process.exit(1);
}

let content = fs.readFileSync(adminPath, 'utf8');

const pushHelper = `
// ─── PUSH NOTIFICATION DISPATCHER (EXPO PUSH API) ───────────────────────────
async function sendExpoPushNotification({ title, message, targetClass = 'All' }) {
    try {
        const sb = _getSupabaseClient();
        if (!sb) return;

        let query = sb.from('push_tokens').select('push_token, class');
        if (targetClass && targetClass !== 'All') {
            const cleanTarget = String(targetClass).replace(/[^0-9]/g, '');
            if (cleanTarget) {
                query = query.or('class.eq.' + cleanTarget + ',class.ilike.%' + targetClass + '%');
            }
        }

        const { data: rows, error: tokenErr } = await query;
        if (tokenErr || !rows || rows.length === 0) return;

        const uniqueTokens = Array.from(new Set(rows.map(r => r.push_token).filter(Boolean)));
        if (uniqueTokens.length === 0) return;

        console.log('[Push] Dispatching push notification to ' + uniqueTokens.length + ' devices...');

        const messages = uniqueTokens.map(tok => ({
            to: tok,
            sound: 'default',
            title: title,
            body: message,
            channelId: 'default',
            priority: 'high',
        }));

        const chunkSize = 100;
        for (let i = 0; i < messages.length; i += chunkSize) {
            const chunk = messages.slice(i, i + chunkSize);
            fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chunk),
            }).catch(() => {});
        }
    } catch (_) {}
}
`;

if (!content.includes('function sendExpoPushNotification(')) {
    content = pushHelper + '\n' + content;
}

// In approvePendingTest, trigger push notification
const testTargetSnippet = "showPendingNotice('Approved and published test alert!', 'success');";
const testPushSnippet = `// Trigger push notification to student mobile devices
        sendExpoPushNotification({
            title: '[' + classTag + '] ' + (ptData?.title || 'Test Paper') + ' (' + subject + ')',
            message: 'Exam Date: ' + examDate + ' | Venue: ' + venueStr + ' | Time: ' + timeStr,
            targetClass: classTag
        });

        showPendingNotice('Approved and published test alert!', 'success');`;

if (content.includes(testTargetSnippet) && !content.includes("targetClass: classTag")) {
    content = content.replace(testTargetSnippet, testPushSnippet);
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✓ Successfully patched admin.js with push notifications on test approval!');
