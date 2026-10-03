const fs = require('fs');

const liveTimetablePath = 'C:/Users/madhu/code_test/private/js/live_timetable.js';
const adminJsPath = 'C:/Users/madhu/code_test/private/js/admin.js';
const timetableHtmlPath = 'C:/Users/madhu/code_test/private/timetable.html';

let liveJs = fs.readFileSync(liveTimetablePath, 'utf8');
let adminJs = fs.readFileSync(adminJsPath, 'utf8');
let timetableHtml = fs.readFileSync(timetableHtmlPath, 'utf8');

// ── 1. PATCH live_timetable.js ──────────────────────────────────────────

// A. _parseTimeDetails & _parseStatus
const oldParseBlock = `    function _parseTimeDetails(rawTime) {
        if (!rawTime) return { time: 'Scheduled', faculty: '' };
        if (rawTime.includes('•')) {
            const parts = rawTime.split('•');
            return { time: parts[0].trim(), faculty: parts[1].trim() };
        }
        return { time: rawTime.trim(), faculty: '' };
    }

    // Extract base status and faculty ID
    function _parseStatus(rawStatus) {
        if (!rawStatus) return { status: 'upcoming', facultyId: '' };
        if (rawStatus.includes(':')) {
            const parts = rawStatus.split(':');
            return { status: parts[0].trim(), facultyId: parts[1].trim() };
        }
        return { status: rawStatus.trim(), facultyId: '' };
    }`;

const newParseBlock = `    function _parseTimeDetails(rawTime) {
        if (!rawTime) return { time: 'Scheduled', faculty: '', sessionType: '' };
        if (rawTime.includes('•')) {
            const parts = rawTime.split('•').map(p => p.trim()).filter(Boolean);
            const timeSlot = parts[0] || 'Scheduled';
            let faculty = '';
            let sessionType = '';
            for (let i = 1; i < parts.length; i++) {
                const p = parts[i];
                const pl = p.toLowerCase();
                if (pl === 'tp' || pl.includes('test paper') || pl.includes('tp session')) {
                    sessionType = 'TP';
                } else if (pl === 'question bank' || pl === 'qb') {
                    sessionType = 'QuestionBank';
                } else if (pl === 'regular' || pl.includes('regular class')) {
                    sessionType = 'Regular';
                } else {
                    faculty = p;
                }
            }
            return { time: timeSlot, faculty, sessionType };
        }
        return { time: rawTime.trim(), faculty: '', sessionType: '' };
    }

    // Extract base status, faculty ID, and session type
    function _parseStatus(rawStatus) {
        if (!rawStatus) return { status: 'upcoming', facultyId: '', sessionType: '' };
        const parts = rawStatus.split(':').map(p => p.trim()).filter(Boolean);
        const baseStatus = parts[0] || 'upcoming';
        let facultyId = '';
        let sessionType = '';
        for (let i = 1; i < parts.length; i++) {
            const p = parts[i];
            const pl = p.toLowerCase();
            if (p.startsWith('fac-') || p === 'fac') {
                facultyId = p;
            } else if (pl === 'tp' || pl.includes('test')) {
                sessionType = 'TP';
            } else if (pl === 'questionbank' || pl === 'qb' || pl.includes('question')) {
                sessionType = 'QuestionBank';
            } else if (pl === 'regular') {
                sessionType = 'Regular';
            }
        }
        return { status: baseStatus, facultyId, sessionType };
    }`;

if (!liveJs.includes(oldParseBlock)) {
    console.error('liveJs oldParseBlock not found!');
    process.exit(1);
}
liveJs = liveJs.replace(oldParseBlock, newParseBlock);

// B. openEditClassModal detectedType
const oldDetectBlock = `        const normStatus = (item.status || '').toLowerCase();
        const normTime = (item.time || '').toLowerCase();
        let detectedType = 'Regular';
        if (normStatus.includes('tp') || normStatus.includes('test') || normTime.includes('test paper') || normTime.includes('• tp')) {
            detectedType = 'TP';
        } else if (normStatus.includes('question') || normStatus.includes('qb') || normTime.includes('question bank') || normTime.includes('• qb')) {
            detectedType = 'QuestionBank';
        }
        const sessionTypeEl = document.getElementById('editClassSessionType');`;

const newDetectBlock = `        const normStatus = (item.status || '').toLowerCase();
        const normTime = (item.time || '').toLowerCase();
        let detectedType = 'Regular';
        if (normStatus.split(':').includes('tp') || normStatus.includes(':tp') || normStatus.includes('test') || normTime.includes('test paper') || normTime.includes('• tp') || timeInfo.sessionType === 'TP' || statusInfo.sessionType === 'TP') {
            detectedType = 'TP';
        } else if (normStatus.split(':').includes('questionbank') || normStatus.split(':').includes('qb') || normStatus.includes(':qb') || normTime.includes('question bank') || normTime.includes('• qb') || timeInfo.sessionType === 'QuestionBank' || statusInfo.sessionType === 'QuestionBank') {
            detectedType = 'QuestionBank';
        }
        const sessionTypeEl = document.getElementById('editClassSessionType');`;

if (!liveJs.includes(oldDetectBlock)) {
    console.error('liveJs oldDetectBlock not found!');
    process.exit(1);
}
liveJs = liveJs.replace(oldDetectBlock, newDetectBlock);

// C. saveLiveClassEdit
const oldSaveBlock = `            const sessTypeEl = document.getElementById('editClassSessionType');
            const sessType = sessTypeEl ? sessTypeEl.value : 'Regular';
            const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                ? 'Test Paper'
                : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                ? 'Question Bank'
                : 'Regular';

            const timeParts = [timeStr];
            if (sessType && sessType !== 'Regular') {
                timeParts.push(sessionTag);
            }
            if (facultyName) {
                timeParts.push(facultyName);
            }

            const finalTime = timeParts.join(' • ');
            const finalStatus = (sessType && sessType !== 'Regular')
                ? \`\${status}:\${sessType}\${facultyId ? ':' + facultyId : ''}\`
                : (facultyId ? \`\${status}:\${facultyId}\` : (facultyName ? \`\${status}:fac\` : status));`;

const newSaveBlock = `            const sessTypeEl = document.getElementById('editClassSessionType');
            const sessType = sessTypeEl ? sessTypeEl.value : 'Regular';
            const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                ? 'TP'
                : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                ? 'Question Bank'
                : 'Regular';

            const timeParts = [timeStr];
            if (sessType && sessType !== 'Regular') {
                timeParts.push(sessionTag);
            }
            if (facultyName) {
                timeParts.push(facultyName);
            }

            const finalTime = timeParts.join(' • ');
            const finalStatus = (sessType && sessType !== 'Regular')
                ? \`\${status}:\${sessType}\${facultyId ? ':' + facultyId : ''}\`
                : (facultyId ? \`\${status}:\${facultyId}\` : (facultyName ? \`\${status}:fac\` : status));`;

if (!liveJs.includes(oldSaveBlock)) {
    console.error('liveJs oldSaveBlock not found!');
    process.exit(1);
}
liveJs = liveJs.replace(oldSaveBlock, newSaveBlock);

// D. table row badge in renderPlatform
const oldBadgeBlock = `const nStat = (item.status || '').toLowerCase();
                                                const nTime = (item.time || '').toLowerCase();
                                                if (nStat.includes('tp') || nStat.includes('test') || nTime.includes('test paper') || nTime.includes('• tp')) {
                                                    return '<span class="badge badge-danger ml-1" style="font-size:0.72rem; font-weight:600;"><i class="fas fa-file-alt mr-1"></i>Test Paper</span>';
                                                } else if (nStat.includes('question') || nStat.includes('qb') || nTime.includes('question bank') || nTime.includes('• qb')) {
                                                    return '<span class="badge ml-1 text-white" style="font-size:0.72rem; font-weight:600; background:#7c3aed;"><i class="fas fa-book-open mr-1"></i>Question Bank</span>';
                                                } else {
                                                    return '<span class="badge badge-light border ml-1 text-muted" style="font-size:0.72rem; font-weight:600;">📖 Regular</span>';
                                                }`;

const newBadgeBlock = `const nStat = (item.status || '').toLowerCase();
                                                const nTime = (item.time || '').toLowerCase();
                                                if (nStat.split(':').includes('tp') || nStat.includes(':tp') || nStat.includes('test') || nTime.includes('test paper') || nTime.includes('• tp')) {
                                                    return '<span class="badge badge-danger ml-1" style="font-size:0.72rem; font-weight:600;"><i class="fas fa-file-alt mr-1"></i>TP</span>';
                                                } else if (nStat.split(':').includes('questionbank') || nStat.split(':').includes('qb') || nStat.includes(':qb') || nTime.includes('question bank') || nTime.includes('• qb')) {
                                                    return '<span class="badge ml-1 text-white" style="font-size:0.72rem; font-weight:600; background:#7c3aed;"><i class="fas fa-book-open mr-1"></i>Question Bank</span>';
                                                } else {
                                                    return '<span class="badge badge-light border ml-1 text-muted" style="font-size:0.72rem; font-weight:600;">📖 Regular Class</span>';
                                                }`;

if (!liveJs.includes(oldBadgeBlock)) {
    console.error('liveJs oldBadgeBlock not found!');
    process.exit(1);
}
liveJs = liveJs.replace(oldBadgeBlock, newBadgeBlock);

// Modal dropdown label in live_timetable.js
liveJs = liveJs.replace(
    '<option value="TP">🎯 TP Session / Test Paper</option>',
    '<option value="TP">🎯 TP</option>'
);

fs.writeFileSync(liveTimetablePath, liveJs, 'utf8');
console.log('✓ live_timetable.js patched successfully!');

// ── 2. PATCH admin.js ───────────────────────────────────────────────────

// A. addTimetableEntryBtn auto-sync
const oldAdminAddSync = `const sessType = (sessionType || 'Regular').trim();
                const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                    ? 'Test Paper'
                    : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                    ? 'Question Bank'
                    : 'Regular';
                const statusStr = 'upcoming' + (sessType ? ':' + sessType : '') + (facultyId ? ':' + facultyId : '');`;

const newAdminAddSync = `const sessType = (sessionType || 'Regular').trim();
                const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                    ? 'TP'
                    : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                    ? 'Question Bank'
                    : 'Regular';
                const statusStr = 'upcoming' + (sessType && sessType !== 'Regular' ? ':' + sessType : '') + (facultyId ? ':' + facultyId : '');`;

if (adminJs.includes(oldAdminAddSync)) {
    adminJs = adminJs.replace(oldAdminAddSync, newAdminAddSync);
    console.log('✓ admin.js addTimetableEntryBtn auto-sync patched!');
} else {
    console.warn('admin.js oldAdminAddSync not found, skipping');
}

// B. shareTimetableBtn
const oldAdminShare = `const sessType = (entry.sessionType || 'Regular').trim();
                const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                    ? 'Test Paper'
                    : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                    ? 'Question Bank'
                    : 'Regular';
                const statusStr = 'upcoming' + (sessType ? ':' + sessType : '') + (entry.facultyId ? ':' + entry.facultyId : '');`;

const newAdminShare = `const sessType = (entry.sessionType || 'Regular').trim();
                const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                    ? 'TP'
                    : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                    ? 'Question Bank'
                    : 'Regular';
                const statusStr = 'upcoming' + (sessType && sessType !== 'Regular' ? ':' + sessType : '') + (entry.facultyId ? ':' + entry.facultyId : '');`;

if (adminJs.includes(oldAdminShare)) {
    adminJs = adminJs.replace(oldAdminShare, newAdminShare);
    console.log('✓ admin.js shareTimetableBtn patched!');
} else {
    console.warn('admin.js oldAdminShare not found, skipping');
}

fs.writeFileSync(adminJsPath, adminJs, 'utf8');

// ── 3. PATCH timetable.html ─────────────────────────────────────────────
if (timetableHtml.includes('<option value="TP">🎯 TP Session</option>')) {
    timetableHtml = timetableHtml.replace('<option value="TP">🎯 TP Session</option>', '<option value="TP">🎯 TP</option>');
    fs.writeFileSync(timetableHtmlPath, timetableHtml, 'utf8');
    console.log('✓ timetable.html patched successfully!');
}
