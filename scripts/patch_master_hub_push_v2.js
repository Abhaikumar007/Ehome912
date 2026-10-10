const fs = require('fs');
const p = 'C:\\Users\\madhu\\code_test\\private\\js\\master_hub.js';
let c = fs.readFileSync(p, 'utf8');

// Replace sendExpoPushNotification with robust logging and return count
const oldFuncRegex = /\/\/ ─── PUSH NOTIFICATION DISPATCHER[\s\S]*?function cleanApprovedTitle/;

const newFunc = `// ─── PUSH NOTIFICATION DISPATCHER (EXPO PUSH API) ───────────────────────────
async function sendExpoPushNotification({ title, message, targetClass = 'All' }) {
    try {
        let sb = typeof _getMasterHubSupabase === 'function' ? _getMasterHubSupabase() : null;
        if (!sb && typeof _getSupabaseClient === 'function') sb = _getSupabaseClient();
        if (!sb && typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
            sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        if (!sb) {
            console.warn('[Push] Supabase client unavailable for push tokens query.');
            return 0;
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
            return 0;
        }
        if (!rows || rows.length === 0) {
            console.log('[Push] No registered push tokens found for target:', targetClass);
            return 0;
        }

        // Deduplicate tokens
        const uniqueTokens = Array.from(new Set(rows.map(r => r.push_token).filter(Boolean)));
        if (uniqueTokens.length === 0) return 0;

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

        // Send in chunks of 100 using CORS-safe text/plain transport
        const chunkSize = 100;
        for (let i = 0; i < messages.length; i += chunkSize) {
            const chunk = messages.slice(i, i + chunkSize);
            try {
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: JSON.stringify(chunk),
                });
                console.log('[Push] Dispatched payload chunk to', chunk.length, 'devices.');
            } catch (postErr) {
                console.warn('[Push] Fetch dispatch error:', postErr);
            }
        }
        return uniqueTokens.length;
    } catch (pushErr) {
        console.warn('[Push] Push dispatch note:', pushErr);
        return 0;
    }
}

function cleanApprovedTitle`;

if (oldFuncRegex.test(c)) {
    c = c.replace(oldFuncRegex, newFunc);
    console.log('✓ Successfully updated sendExpoPushNotification function');
} else {
    console.log('Regex did not match oldFuncRegex');
}

// Update handlePublishAnnouncement to await sendExpoPushNotification and show count
const oldCall = `        // Send live lock-screen push notifications to all phones
        sendExpoPushNotification({
            title: (target !== 'All' ? '[' + target + '] ' : '') + title,
            message: msg,
            targetClass: target
        });

        alert('✅ Announcement broadcasted! All student and teacher apps will see it immediately.');`;

const newCall = `        // Send live lock-screen push notifications to all phones
        let pushedCount = 0;
        try {
            pushedCount = await sendExpoPushNotification({
                title: (target !== 'All' ? '[' + target + '] ' : '') + title,
                message: msg,
                targetClass: target
            });
        } catch (_) {}

        const pushSummary = pushedCount > 0 ? (' (Sent push to ' + pushedCount + ' registered phone' + (pushedCount > 1 ? 's' : '') + ')') : '';
        alert('✅ Announcement broadcasted!' + pushSummary + ' All student and teacher apps will see it immediately.');`;

if (c.includes(oldCall)) {
    c = c.replace(oldCall, newCall);
    console.log('✓ Successfully updated handlePublishAnnouncement alert call');
} else {
    console.log('oldCall snippet not found');
}

fs.writeFileSync(p, c, 'utf8');
