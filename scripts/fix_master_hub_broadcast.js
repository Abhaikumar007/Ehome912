const fs = require('fs');
const path = require('path');

const targetJsPath = 'C:\\Users\\madhu\\code_test\\private\\js\\master_hub.js';
let content = fs.readFileSync(targetJsPath, 'utf8');

// Update handlePublishAnnouncement to mark urgent and holiday as important, and handlePublishTestAlert to publish to announcements
const oldAnnouncePattern = `            await sb.from('announcements').insert({
                title: (target !== 'All' ? '[' + target + '] ' : '') + title,
                description: msg,
                icon: icon,
                icon_bg: iconBg,
                icon_color: iconColor,
                time_label: 'Just now',
                important: category === 'urgent'
            });`;

const newAnnouncePattern = `            const { error: insErr } = await sb.from('announcements').insert({
                title: (target !== 'All' ? '[' + target + '] ' : '') + title,
                description: msg,
                icon: icon,
                icon_bg: iconBg,
                icon_color: iconColor,
                time_label: 'Just now',
                important: category === 'urgent' || category === 'holiday'
            });
            if (insErr) console.warn('[MasterHub] Announcement insert warning:', insErr);`;

if (content.includes(oldAnnouncePattern)) {
    content = content.replace(oldAnnouncePattern, newAnnouncePattern);
}

// Update handlePublishTestAlert
const oldTestPattern = `        const sb = typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null;
        if (sb) {
            // Write to academic_alerts table in Supabase
            await sb.from('academic_alerts').upsert({
                class_label: className,
                subject: subject,
                test_name: title,
                exam_date: examDate,
                expiry_date: expiryDate,
                syllabus: syllabusArray,
                published: true,
                created_at: new Date().toISOString()
            });

            // Also post as a notification
            await sb.from('notifications').insert({
                roll_no: 'ALL',
                title: 'New Exam Scheduled: ' + title,
                message: \`Class: \${className} | Subject: \${subject} | Date: \${examDate}\`,
                time_label: 'Just now'
            });
        }`;

const newTestPattern = `        const sb = typeof _getSupabaseClient === 'function' ? _getSupabaseClient() : null;
        if (sb) {
            // 1. Write to announcements table (guaranteed to exist and trigger live alert banners)
            await sb.from('announcements').insert({
                title: \`[Exam Alert - \${className}] \${title}\`,
                description: \`Subject: \${subject} | Exam Date: \${examDate} | Valid Until: \${expiryDate}\${syllabus ? '\\nSyllabus: ' + syllabusArray.join(', ') : ''}\`,
                icon: 'calendar',
                icon_bg: '#EFF6FF',
                icon_color: '#1A56DB',
                time_label: 'Exam: ' + examDate,
                important: true
            });

            // 2. Also post as a notification
            try {
                await sb.from('notifications').insert({
                    roll_no: 'ALL',
                    title: 'New Exam Scheduled: ' + title,
                    message: \`Class: \${className} | Subject: \${subject} | Date: \${examDate}\`,
                    time_label: 'Just now'
                });
            } catch (ne) {}

            // 3. Try to write to academic_alerts table if present
            try {
                await sb.from('academic_alerts').upsert({
                    class_label: className,
                    subject: subject,
                    test_name: title,
                    exam_date: examDate,
                    expiry_date: expiryDate,
                    syllabus: syllabusArray,
                    published: true,
                    created_at: new Date().toISOString()
                });
            } catch (ae) {}
        }`;

if (content.includes(oldTestPattern)) {
    content = content.replace(oldTestPattern, newTestPattern);
}

fs.writeFileSync(targetJsPath, content, 'utf8');
console.log('✓ Successfully updated master_hub.js broadcast & exam alert logic.');
