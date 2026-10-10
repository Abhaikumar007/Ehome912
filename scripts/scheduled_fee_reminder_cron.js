/**
 * ─── SCHEDULED 5-DAY FEE DUE REMINDER RUNNER ─────────────────────────────────
 * This standalone script scans all student fee records in Supabase:
 * - Identifies all students with unpaid tuition fees due within 5 days (or overdue).
 * - Matches registered student devices in push_tokens.
 * - Dispatches high-priority lock-screen push notifications to student phones.
 * - Records notification items into Supabase notifications table.
 *
 * Usage:
 *   node scripts/scheduled_fee_reminder_cron.js
 *   node scripts/scheduled_fee_reminder_cron.js --dry-run
 *
 * Can be automated with Windows Task Scheduler or server cron (e.g. daily at 9:00 AM).
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const isDryRun = process.argv.includes('--dry-run');

async function runFeeDueScheduler() {
    console.log(`[FeeDueScheduler] Starting 5-day fee reminder scan (${new Date().toLocaleString('en-IN')})...`);
    if (isDryRun) {
        console.log('[FeeDueScheduler] Running in DRY-RUN mode (no actual push notifications will be sent).');
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. Fetch fees_records
    const { data: records, error: feeErr } = await sb
        .from('fees_records')
        .select('roll_no, current_due, due_date, days_left');

    if (feeErr) {
        console.error('[FeeDueScheduler] Error fetching fees_records:', feeErr);
        process.exit(1);
    }

    if (!records || records.length === 0) {
        console.log('[FeeDueScheduler] No fee records found in database.');
        return;
    }

    // Filter unpaid fees due within 5 days (days_left <= 5)
    const dueStudents = records.filter(r => {
        const due = Number(r.current_due) || 0;
        const days = Number(r.days_left);
        const isUnpaid = due > 0;
        return isUnpaid && !isNaN(days) && days <= 5;
    });

    console.log(`[FeeDueScheduler] Found ${dueStudents.length} student(s) with fee due within 5 days.`);

    if (dueStudents.length === 0) {
        console.log('[FeeDueScheduler] All students are up to date! No reminders needed today.');
        return;
    }

    // 2. Fetch push tokens
    const { data: tokenRows, error: tokErr } = await sb
        .from('push_tokens')
        .select('roll_no, push_token');

    if (tokErr) {
        console.error('[FeeDueScheduler] Error fetching push_tokens:', tokErr);
        process.exit(1);
    }

    const tokenMap = new Map();
    (tokenRows || []).forEach(t => {
        const r = (t.roll_no || '').toUpperCase().trim();
        if (!tokenMap.has(r)) tokenMap.set(r, []);
        tokenMap.get(r).push(t.push_token);
    });

    const messages = [];
    const notifInserts = [];

    dueStudents.forEach(record => {
        const r = (record.roll_no || '').toUpperCase().trim();
        const dueAmt = Number(record.current_due) || Number(record.monthly_fee) || 4000;
        const dueDateStr = record.due_date || 'this month';
        const days = Number(record.days_left);
        const timingStr = days < 0
            ? `(${Math.abs(days)} days overdue)`
            : days === 0
            ? `(Due today!)`
            : `(${days} days remaining)`;

        const title = '⚠️ Tuition Fee Due Reminder';
        const body = `Your tuition fee of ₹${dueAmt.toLocaleString('en-IN')} is due on ${dueDateStr} ${timingStr}. Please pay via UPI in the app to avoid late fees.`;

        // Record in notifications table
        notifInserts.push({
            roll_no: r,
            title: title,
            message: body,
            time_label: 'Due Soon',
            is_read: false,
            type: 'fee',
        });

        const tokens = tokenMap.get(r) || [];
        tokens.forEach(tok => {
            messages.push({
                to: tok,
                sound: 'default',
                title: title,
                body: body,
                channelId: 'default',
                priority: 'high',
                data: { screen: 'fees' },
            });
        });

        console.log(`  • ${r}: ₹${dueAmt} due on ${dueDateStr} ${timingStr} [${tokens.length} device(s)]`);
    });

    if (isDryRun) {
        console.log(`[FeeDueScheduler] DRY-RUN complete. Would send ${messages.length} push notification(s) across ${dueStudents.length} student(s).`);
        return;
    }

    // 3. Dispatch to Expo Push API
    if (messages.length > 0) {
        const chunkSize = 100;
        let sentCount = 0;
        for (let i = 0; i < messages.length; i += chunkSize) {
            const chunk = messages.slice(i, i + chunkSize);
            try {
                const res = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(chunk),
                });
                const resJson = await res.json();
                sentCount += chunk.length;
                console.log(`[FeeDueScheduler] Successfully dispatched chunk of ${chunk.length} notification(s).`);
            } catch (postErr) {
                console.warn('[FeeDueScheduler] Dispatch warning:', postErr);
            }
        }
        console.log(`[FeeDueScheduler] Push dispatch finished: ${sentCount} push message(s) sent.`);
    } else {
        console.log('[FeeDueScheduler] Note: None of the due students currently have active registered mobile devices in push_tokens.');
    }

    // 4. Archive into Supabase notifications table
    if (notifInserts.length > 0) {
        try {
            await sb.from('notifications').insert(notifInserts);
            console.log(`[FeeDueScheduler] Saved ${notifInserts.length} fee reminder item(s) to in-app notification center.`);
        } catch (dbErr) {
            console.warn('[FeeDueScheduler] Database archive warning:', dbErr);
        }
    }

    console.log('[FeeDueScheduler] Routine complete.');
}

runFeeDueScheduler().catch(err => {
    console.error('[FeeDueScheduler] Fatal error:', err);
    process.exit(1);
});
