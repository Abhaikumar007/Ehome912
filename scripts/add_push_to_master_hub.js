const fs = require('fs');
const path = require('path');

const targetJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\master_hub.js';

if (!fs.existsSync(targetJsPath)) {
    console.error('Target file does not exist:', targetJsPath);
    process.exit(1);
}

let content = fs.readFileSync(targetJsPath, 'utf8');

// 1. Define the sendExpoPushNotification helper function
const pushHelperFunction = `
// ─── PUSH NOTIFICATION DISPATCHER (EXPO PUSH API) ───────────────────────────
async function sendExpoPushNotification({ title, message, targetClass = 'All' }) {
    try {
        const sb = _getMasterHubSupabase();
        if (!sb) {
            console.warn('[Push] Supabase client unavailable for push tokens query.');
            return;
        }

        let query = sb.from('push_tokens').select('push_token, class');
        if (targetClass && targetClass !== 'All') {
            const cleanTarget = String(targetClass).replace(/[^0-9]/g, '');
            if (cleanTarget) {
                query = query.or('class.eq.' + cleanTarget + ',class.ilike.%' + targetClass + '%');
            }
        }

        const { data: rows, error: tokenErr } = await query;
        if (tokenErr) {
            console.warn('[Push] Error fetching push tokens:', tokenErr);
            return;
        }
        if (!rows || rows.length === 0) {
            console.log('[Push] No registered push tokens found for target:', targetClass);
            return;
        }

        // Deduplicate tokens
        const uniqueTokens = Array.from(new Set(rows.map(r => r.push_token).filter(Boolean)));
        if (uniqueTokens.length === 0) return;

        console.log('[Push] Dispatching push notification to ' + uniqueTokens.length + ' devices...');

        // Build messages
        const messages = uniqueTokens.map(tok => ({
            to: tok,
            sound: 'default',
            title: title,
            body: message,
            channelId: 'default',
            priority: 'high',
        }));

        // Send in chunks of 100
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
            }).then(res => {
                console.log('[Push] Expo Push API response status:', res.status);
            }).catch(e => {
                console.warn('[Push] Expo Push fetch error:', e);
            });
        }
    } catch (pushErr) {
        console.warn('[Push] Push dispatch note:', pushErr);
    }
}
`;

// Insert helper before handlePublishAnnouncement if not already present
if (!content.includes('function sendExpoPushNotification(')) {
    content = pushHelperFunction + '\n' + content;
}

// 2. Trigger push notification in handlePublishAnnouncement
const oldAnnSuccess = "alert('✅ Announcement broadcasted! All student and teacher apps will see it immediately.');";
const newAnnSuccess = `// Send live lock-screen push notifications to all phones
        sendExpoPushNotification({
            title: (target !== 'All' ? '[' + target + '] ' : '') + title,
            message: msg,
            targetClass: target
        });

        alert('✅ Announcement broadcasted! All student and teacher apps will see it immediately.');`;

if (content.includes(oldAnnSuccess) && !content.includes("targetClass: target")) {
    content = content.replace(oldAnnSuccess, newAnnSuccess);
}

// 3. Trigger push notification in handlePublishTestAlert
const oldTestSuccess = "alert('✅ Academic Exam Alert published! Students in ' + className + ' will see this alert banner on their home screen until ' + expiryDate + '.');";
const newTestSuccess = `// Send live lock-screen push notification to students in this class
        sendExpoPushNotification({
            title: '[Exam Alert - ' + className + '] ' + title,
            message: 'Subject: ' + subject + ' | Date: ' + examDate,
            targetClass: className
        });

        alert('✅ Academic Exam Alert published! Students in ' + className + ' will see this alert banner on their home screen until ' + expiryDate + '.');`;

if (content.includes(oldTestSuccess) && !content.includes("targetClass: className")) {
    content = content.replace(oldTestSuccess, newTestSuccess);
}

fs.writeFileSync(targetJsPath, content, 'utf8');
console.log('✓ Successfully patched master_hub.js with Expo Push Notification dispatch!');
