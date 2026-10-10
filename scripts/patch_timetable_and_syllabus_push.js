const fs = require('fs');

const adminPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
const masterHubPath = 'C:\\Users\\madhu\\code_test\\private\\js\\master_hub.js';
const liveTtPath = 'C:\\Users\\madhu\\code_test\\private\\js\\live_timetable.js';

console.log('--- 1. Patching admin.js ---');
let admin = fs.readFileSync(adminPath, 'utf8');

// A. Replace push dispatcher in admin.js
const adminPushRegex = /\/\/ ─── PUSH NOTIFICATION DISPATCHER[\s\S]*?function _formatToDateInputValue/;
const newAdminPush = `// ─── PUSH NOTIFICATION DISPATCHER (EXPO PUSH API) ───────────────────────────
const CBSE_STUDENT_ROLLS = new Set(['EDU-2026-022', 'EDU-2026-036']);

function _isStudentCbse(rollNo) {
    const r = (rollNo || '').trim().toUpperCase();
    if (CBSE_STUDENT_ROLLS.has(r)) return true;
    if (typeof MASTER_STUDENTS_ROSTER !== 'undefined' && Array.isArray(MASTER_STUDENTS_ROSTER)) {
        const s = MASTER_STUDENTS_ROSTER.find(x => (x.rollNo || x.id || '').trim().toUpperCase() === r);
        if (s) {
            const sch = (s.school || '').toLowerCase();
            const b = (s.batch || '').toLowerCase();
            return sch.includes('cbse') || b.includes('cbse');
        }
    }
    return false;
}

async function sendExpoPushNotification({ title, message, targetClass = 'All', targetSyllabus = 'Both' }) {
    try {
        let sb = typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null;
        if (!sb && typeof _getMasterHubSupabase === 'function') sb = _getMasterHubSupabase();
        if (!sb && typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
            sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        if (!sb) return 0;

        let query = sb.from('push_tokens').select('push_token, class, roll_no');
        if (targetClass && targetClass !== 'All') {
            const cleanTarget = String(targetClass).replace(/[^0-9]/g, '');
            if (cleanTarget) {
                query = query.or('class.eq.' + cleanTarget + ',class.ilike.%' + targetClass + '%');
            }
        }

        const { data: rows, error: tokenErr } = await query;
        if (tokenErr || !rows || rows.length === 0) return 0;

        // Filter by targetSyllabus if specified (CBSE vs State Syllabus vs Both)
        let eligibleRows = rows;
        if (targetSyllabus && targetSyllabus !== 'Both' && targetSyllabus !== 'All') {
            const isTargetCbse = String(targetSyllabus).toLowerCase().includes('cbse');
            eligibleRows = rows.filter(r => {
                const studentIsCbse = _isStudentCbse(r.roll_no);
                return isTargetCbse ? studentIsCbse : !studentIsCbse;
            });
        }

        const uniqueTokens = Array.from(new Set(eligibleRows.map(r => r.push_token).filter(Boolean)));
        if (uniqueTokens.length === 0) return 0;

        console.log('[Push] Dispatching push notification to ' + uniqueTokens.length + ' devices (Class: ' + targetClass + ', Syllabus: ' + targetSyllabus + ')...');

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
            try {
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: JSON.stringify(chunk),
                });
            } catch (pErr) {
                console.warn('[Push] Fetch dispatch error:', pErr);
            }
        }

        // Also record into Supabase notifications table for students to view in their Notification Center
        try {
            await sb.from('notifications').insert({
                roll_no: 'ALL',
                title: title,
                message: message,
                time_label: 'Just now',
                is_read: false,
                type: 'schedule',
            });
        } catch (_) {}

        return uniqueTokens.length;
    } catch (err) {
        console.warn('[Push] Dispatch error:', err);
        return 0;
    }
}

function _formatToDateInputValue`;

if (adminPushRegex.test(admin)) {
    admin = admin.replace(adminPushRegex, newAdminPush);
    console.log('✓ Successfully patched sendExpoPushNotification in admin.js');
} else {
    console.warn('adminPushRegex did not match');
}

// B. In shareTimetableToApp: group by Class & Syllabus
const oldAdminSharePush = `            // 3. Dispatch live lock-screen push notifications to students of this class
            let ttPushCount = 0;
            try {
                if (typeof sendExpoPushNotification === 'function') {
                    ttPushCount = await sendExpoPushNotification({
                        title: '🗓️ Timetable Published: ' + gradeStr,
                        message: 'New schedule published (' + rowsToInsert.length + ' session' + (rowsToInsert.length > 1 ? 's' : '') + '). Open the app to view your timetable!',
                        targetClass: gradeStr
                    });
                }
            } catch (ttPushErr) {
                console.warn('[Push] Error dispatching timetable push:', ttPushErr);
            }`;

const newAdminSharePush = `            // 3. Dispatch targeted live lock-screen push notifications grouped by Class and Syllabus
            let ttPushCount = 0;
            try {
                if (typeof sendExpoPushNotification === 'function') {
                    const groups = new Map();
                    for (const entry of deduplicatedEntries) {
                        const rawCls = String(entry.class || '').trim();
                        const gStr = rawCls.startsWith('Class') ? rawCls : 'Class ' + rawCls;
                        const board = (entry.board || 'Both').trim();
                        const key = gStr + '||' + board;
                        if (!groups.has(key)) {
                            groups.set(key, { grade: gStr, board: board, count: 0, subjects: [] });
                        }
                        const g = groups.get(key);
                        g.count++;
                        if (!g.subjects.includes(entry.subject)) g.subjects.push(entry.subject);
                    }

                    for (const [, grp] of groups.entries()) {
                        const boardLabel = grp.board === 'CBSE' ? ' (CBSE)' : grp.board.toLowerCase().includes('state') ? ' (State Syllabus)' : '';
                        const sent = await sendExpoPushNotification({
                            title: '🗓️ Timetable Published: ' + grp.grade + boardLabel,
                            message: 'New schedule published for ' + grp.subjects.slice(0, 3).join(', ') + ' (' + grp.count + ' session' + (grp.count > 1 ? 's' : '') + '). Open the app to view your timetable!',
                            targetClass: grp.grade,
                            targetSyllabus: grp.board
                        });
                        ttPushCount += (sent || 0);
                    }
                }
            } catch (ttPushErr) {
                console.warn('[Push] Error dispatching timetable push:', ttPushErr);
            }`;

if (admin.includes(oldAdminSharePush)) {
    admin = admin.replace(oldAdminSharePush, newAdminSharePush);
    console.log('✓ Successfully patched shareTimetableToApp group push in admin.js');
} else {
    console.warn('oldAdminSharePush not found in admin.js');
}

fs.writeFileSync(adminPath, admin, 'utf8');

console.log('--- 2. Patching master_hub.js ---');
let mh = fs.readFileSync(masterHubPath, 'utf8');

const mhPushRegex = /\/\/ ─── PUSH NOTIFICATION DISPATCHER[\s\S]*?function cleanApprovedTitle/;
const newMhPush = `// ─── PUSH NOTIFICATION DISPATCHER (EXPO PUSH API) ───────────────────────────
const CBSE_STUDENT_ROLLS = new Set(['EDU-2026-022', 'EDU-2026-036']);

function _isStudentCbse(rollNo) {
    const r = (rollNo || '').trim().toUpperCase();
    if (CBSE_STUDENT_ROLLS.has(r)) return true;
    if (typeof MASTER_STUDENTS_ROSTER !== 'undefined' && Array.isArray(MASTER_STUDENTS_ROSTER)) {
        const s = MASTER_STUDENTS_ROSTER.find(x => (x.rollNo || x.id || '').trim().toUpperCase() === r);
        if (s) {
            const sch = (s.school || '').toLowerCase();
            const b = (s.batch || '').toLowerCase();
            return sch.includes('cbse') || b.includes('cbse');
        }
    }
    return false;
}

async function sendExpoPushNotification({ title, message, targetClass = 'All', targetSyllabus = 'Both' }) {
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

        let query = sb.from('push_tokens').select('push_token, class, roll_no');
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

        // Filter by targetSyllabus if specified (CBSE vs State Syllabus vs Both)
        let eligibleRows = rows;
        if (targetSyllabus && targetSyllabus !== 'Both' && targetSyllabus !== 'All') {
            const isTargetCbse = String(targetSyllabus).toLowerCase().includes('cbse');
            eligibleRows = rows.filter(r => {
                const studentIsCbse = _isStudentCbse(r.roll_no);
                return isTargetCbse ? studentIsCbse : !studentIsCbse;
            });
        }

        // Deduplicate tokens
        const uniqueTokens = Array.from(new Set(eligibleRows.map(r => r.push_token).filter(Boolean)));
        if (uniqueTokens.length === 0) return 0;

        console.log('[Push] Dispatching push notification to ' + uniqueTokens.length + ' devices (Class: ' + targetClass + ', Syllabus: ' + targetSyllabus + ')...');

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

        // Also record into Supabase notifications table for students
        try {
            await sb.from('notifications').insert({
                roll_no: 'ALL',
                title: title,
                message: message,
                time_label: 'Just now',
                is_read: false,
                type: 'schedule',
            });
        } catch (_) {}

        return uniqueTokens.length;
    } catch (pushErr) {
        console.warn('[Push] Push dispatch note:', pushErr);
        return 0;
    }
}

function cleanApprovedTitle`;

if (mhPushRegex.test(mh)) {
    mh = mh.replace(mhPushRegex, newMhPush);
    fs.writeFileSync(masterHubPath, mh, 'utf8');
    console.log('✓ Successfully patched sendExpoPushNotification in master_hub.js');
} else {
    console.warn('mhPushRegex did not match');
}

console.log('--- 3. Patching live_timetable.js ---');
let lt = fs.readFileSync(liveTtPath, 'utf8');

const oldLtPattern = `                    // Dispatch push notification to students of this class
                    if (typeof sendExpoPushNotification === 'function') {
                        await sendExpoPushNotification({
                            title: \`🔄 Schedule Update: \${classGrade} - \${subject}\`,
                            message: \`Class date: \${_friendlyDate(classDate)} | Time: \${timeStr}\${facultyName ? ' with ' + facultyName : ''}\`,
                            targetClass: classGrade
                        });
                    }`;

const newLtPattern = `                    // Dispatch push notification to students of this class and syllabus
                    if (typeof sendExpoPushNotification === 'function') {
                        const sylSuffix = targetSyl && targetSyl !== 'Both' ? ' (' + targetSyl + ')' : '';
                        await sendExpoPushNotification({
                            title: \`🔄 Schedule Update: \${classGrade} - \${subject}\${sylSuffix}\`,
                            message: \`Class date: \${_friendlyDate(classDate)} | Time: \${timeStr}\${facultyName ? ' with ' + facultyName : ''}\`,
                            targetClass: classGrade,
                            targetSyllabus: targetSyl
                        });
                    }`;

if (lt.includes(oldLtPattern)) {
    lt = lt.replaceAll(oldLtPattern, newLtPattern);
    fs.writeFileSync(liveTtPath, lt, 'utf8');
    console.log('✓ Successfully patched live_timetable.js session broadcasts with targetSyllabus!');
} else {
    console.warn('oldLtPattern not found in live_timetable.js');
}

console.log('--- All Admin Portal files successfully patched! ---');
