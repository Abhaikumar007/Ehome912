const fs = require('fs');

const adminJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
const liveTtJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\live_timetable.js';

// ─── 1. PATCH admin.js: Send push when timetable is shared to mobile app ─────
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

const oldSharePattern = `            // 2. Broadcast announcement so mobile alerts fire instantly
            if (announcementsToInsert.length > 0) {
                await sb.from('announcements').insert(announcementsToInsert);
            }

            alert('✅ Timetable Successfully Shared to Mobile App!`;

const newSharePattern = `            // 2. Broadcast announcement so mobile alerts fire instantly
            if (announcementsToInsert.length > 0) {
                await sb.from('announcements').insert(announcementsToInsert);
            }

            // 3. Dispatch live lock-screen push notifications to students of this class
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
            }

            const ttPushSummary = ttPushCount > 0 ? ('\\n\\n📱 Lock-screen push sent to ' + ttPushCount + ' student phone' + (ttPushCount > 1 ? 's' : '') + '.') : '';
            alert('✅ Timetable Successfully Shared to Mobile App!' + ttPushSummary + '\\n\\n'`;

if (adminJs.includes(oldSharePattern)) {
    adminJs = adminJs.replace(oldSharePattern, newSharePattern);
    fs.writeFileSync(adminJsPath, adminJs, 'utf8');
    console.log('✓ Wired push notifications into admin.js timetable share!');
} else {
    console.log('admin.js timetable share pattern not matched or already patched');
}

// ─── 2. PATCH live_timetable.js: Send push when individual session is broadcasted ─
let liveTtJs = fs.readFileSync(liveTtJsPath, 'utf8');

const oldLiveTtPattern = `            // 2. Broadcast announcement if requested
            if (doBroadcast) {
                try {
                    await sb.from('announcements').insert({
                        title: \`🔄 Schedule Update: \${classGrade} - \${subject}\`,
                        description: \`Class scheduled for \${_friendlyDate(classDate)} has been updated: Time is \${timeStr}\${facultyName ? ' with ' + facultyName : ''}. Check your mobile app schedule.\`,
                        author: facultyName || 'Center Admin',
                        tag: 'Timetable',
                        important: true
                    });
                } catch (bErr) {
                    console.warn('[LiveTimetable] Broadcast announcement failed:', bErr);
                }
            }`;

const newLiveTtPattern = `            // 2. Broadcast announcement if requested
            if (doBroadcast) {
                try {
                    await sb.from('announcements').insert({
                        title: \`🔄 Schedule Update: \${classGrade} - \${subject}\`,
                        description: \`Class scheduled for \${_friendlyDate(classDate)} has been updated: Time is \${timeStr}\${facultyName ? ' with ' + facultyName : ''}. Check your mobile app schedule.\`,
                        author: facultyName || 'Center Admin',
                        tag: 'Timetable',
                        important: true
                    });

                    // Dispatch push notification to students of this class
                    if (typeof sendExpoPushNotification === 'function') {
                        await sendExpoPushNotification({
                            title: \`🔄 Schedule Update: \${classGrade} - \${subject}\`,
                            message: \`Class date: \${_friendlyDate(classDate)} | Time: \${timeStr}\${facultyName ? ' with ' + facultyName : ''}\`,
                            targetClass: classGrade
                        });
                    }
                } catch (bErr) {
                    console.warn('[LiveTimetable] Broadcast announcement failed:', bErr);
                }
            }`;

if (liveTtJs.includes(oldLiveTtPattern)) {
    liveTtJs = liveTtJs.replace(oldLiveTtPattern, newLiveTtPattern);
    fs.writeFileSync(liveTtJsPath, liveTtJs, 'utf8');
    console.log('✓ Wired push notifications into live_timetable.js session broadcast!');
} else {
    console.log('live_timetable.js broadcast pattern not matched or already patched');
}
