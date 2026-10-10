const fs = require('fs');

// 1. PATCH live_timetable.js
const livePath = 'C:/Users/madhu/code_test/private/js/live_timetable.js';
let live = fs.readFileSync(livePath, 'utf8');

// Ensure _currentPlatformContainerId and _getContainer helper
if (!live.includes('let _currentPlatformContainerId')) {
    live = live.replace(
        "let _activeFilterSyllabus = 'all';",
        `let _activeFilterSyllabus = 'all';\n    let _currentPlatformContainerId = 'liveTimetablePlatform';\n\n    function _getContainer() {\n        return document.getElementById(_currentPlatformContainerId) ||\n               document.getElementById('liveTimetablePlatform') ||\n               document.getElementById('hubTimetablePlatform');\n    }`
    );
}

// In _injectEditModalDOM: ensure stale modal is replaced if missing editClassSyllabus
const oldInjectCheck = `function _injectEditModalDOM() {\n        if (document.getElementById('editLiveClassModal')) return;`;
const newInjectCheck = `function _injectEditModalDOM() {\n        const existing = document.getElementById('editLiveClassModal');\n        if (existing) {\n            if (document.getElementById('editClassSyllabus')) return;\n            existing.remove();\n        }`;
if (live.includes(oldInjectCheck)) {
    live = live.replace(oldInjectCheck, newInjectCheck);
}

// In loadLiveClasses: track container
const oldLoadContainer = `const container = document.getElementById(containerId || 'liveTimetablePlatform');`;
const newLoadContainer = `if (containerId) _currentPlatformContainerId = containerId;\n        const container = _getContainer();\n        if (container) _currentPlatformContainerId = container.id;`;
if (live.includes(oldLoadContainer)) {
    live = live.replace(oldLoadContainer, newLoadContainer);
}

// In renderPlatform: track container
const oldRenderContainer = `const container = document.getElementById(containerId || 'liveTimetablePlatform');`;
const newRenderContainer = `if (containerId) _currentPlatformContainerId = containerId;\n        const container = _getContainer();\n        if (container) _currentPlatformContainerId = container.id;`;
if (live.includes(oldRenderContainer)) {
    live = live.replace(oldRenderContainer, newRenderContainer);
}

// In saveLiveClassEdit: update local memory with board/syllabus and re-render with containerId + reload
const oldLocalMemoryUpdate = `// Update local memory
            const idx = _liveClasses.findIndex(c => c.id === classId);
            if (idx !== -1) {
                _liveClasses[idx] = {
                    ..._liveClasses[idx],
                    class_grade: classGrade,
                    roll_no: classGrade,
                    subject: subject,
                    class_date: classDate,
                    time: finalTime,
                    status: finalStatus,
                    published: published
                };
            }

            window.closeEditClassModal();
            _showToast('Class session updated successfully in Supabase!');
            renderPlatform();
            updateBadgeCounters();`;

const newLocalMemoryUpdate = `// Update local memory immediately
            const idx = _liveClasses.findIndex(c => String(c.id) === String(classId));
            if (idx !== -1) {
                _liveClasses[idx] = {
                    ..._liveClasses[idx],
                    class_grade: classGrade,
                    roll_no: classGrade,
                    subject: subject,
                    class_date: classDate,
                    time: finalTime,
                    status: finalStatus,
                    published: published,
                    board: targetSyl,
                    target_syllabus: targetSyl,
                    syllabus: targetSyl
                };
            }

            window.closeEditClassModal();
            _showToast('Class session updated successfully in Supabase!');
            renderPlatform(_currentPlatformContainerId);
            updateBadgeCounters();

            // Refresh from Supabase to guarantee complete multi-client sync
            try {
                await loadLiveClasses(_currentPlatformContainerId);
            } catch (refErr) {
                console.warn('[LiveTimetable] Refetch warning:', refErr);
            }`;

if (live.includes(oldLocalMemoryUpdate)) {
    live = live.replace(oldLocalMemoryUpdate, newLocalMemoryUpdate);
}

fs.writeFileSync(livePath, live, 'utf8');
console.log('Patched live_timetable.js successfully!');

// 2. PATCH admin.js
const adminPath = 'C:/Users/madhu/code_test/private/js/admin.js';
let admin = fs.readFileSync(adminPath, 'utf8');

// Update getBoardBadge
const oldBoardBadge = `    function getBoardBadge(board) {
        switch (board) {
            case 'CBSE':  return '<span class="badge-board badge-cbse">CBSE</span>';
            case 'State': return '<span class="badge-board badge-state">State</span>';
            case 'Both':
            default:      return '<span class="badge-board badge-both">Both</span>';
        }
    }`;

const newBoardBadge = `    function getBoardBadge(board) {
        const b = (board || '').toLowerCase();
        if (b === 'cbse') return '<span class="badge-board badge-cbse">CBSE</span>';
        if (b.includes('state')) return '<span class="badge-board badge-state">State Syllabus</span>';
        return '<span class="badge-board badge-both">Both (State & CBSE)</span>';
    }`;

if (admin.includes(oldBoardBadge)) {
    admin = admin.replace(oldBoardBadge, newBoardBadge);
}

// Update getBoardEmoji
const oldBoardEmoji = `    function getBoardEmoji(board) {
        switch (board) {
            case 'CBSE':  return '🔵 CBSE';
            case 'State': return '🟢 State';
            case 'Both':
            default:      return '🟣 Both';
        }
    }`;

const newBoardEmoji = `    function getBoardEmoji(board) {
        const b = (board || '').toLowerCase();
        if (b === 'cbse') return '🔵 CBSE';
        if (b.includes('state')) return '🟢 State Syllabus';
        return '🟣 Both (State & CBSE)';
    }`;

if (admin.includes(oldBoardEmoji)) {
    admin = admin.replace(oldBoardEmoji, newBoardEmoji);
}

// Update shareTimetableToApp in admin.js to encode board/syllabus
const oldShareStatus = `const statusStr = 'upcoming' + (statusTag ? ':' + statusTag : '') + (entry.facultyId ? ':' + entry.facultyId : '');
                const timeParts = [timeStr];
                if (sessionTag && sessionTag !== 'Regular' && sessionTag !== 'Regular Class') {
                    timeParts.push(sessionTag);
                }
                if (entry.facultyName) {
                    timeParts.push(entry.facultyName);
                }`;

const newShareStatus = `const boardNorm = (entry.board || 'Both').trim();
                const boardTag = (boardNorm === 'CBSE') ? 'CBSE' : (boardNorm.toLowerCase().includes('state')) ? 'State' : '';
                const statusStr = 'upcoming' + (boardTag ? ':' + boardTag : '') + (statusTag ? ':' + statusTag : '') + (entry.facultyId ? ':' + entry.facultyId : '');
                const timeParts = [timeStr];
                if (boardNorm === 'CBSE') {
                    timeParts.push('CBSE');
                } else if (boardNorm.toLowerCase().includes('state')) {
                    timeParts.push('State Syllabus');
                }
                if (sessionTag && sessionTag !== 'Regular' && sessionTag !== 'Regular Class') {
                    timeParts.push(sessionTag);
                }
                if (entry.facultyName) {
                    timeParts.push(entry.facultyName);
                }`;

if (admin.includes(oldShareStatus)) {
    admin = admin.replace(oldShareStatus, newShareStatus);
}

fs.writeFileSync(adminPath, admin, 'utf8');
console.log('Patched admin.js successfully!');

// 3. Update cache-busters to v20261004_v4
const ttPath = 'C:/Users/madhu/code_test/private/timetable.html';
let tt = fs.readFileSync(ttPath, 'utf8');
tt = tt.replace(/live_timetable\.js\?v=[^"]+/, 'live_timetable.js?v=20261004_v4');
tt = tt.replace(/admin\.js\?v=[^"]+/, 'admin.js?v=20261004_v4');
fs.writeFileSync(ttPath, tt, 'utf8');

const mhPath = 'C:/Users/madhu/code_test/private/master_hub.html';
let mh = fs.readFileSync(mhPath, 'utf8');
mh = mh.replace(/live_timetable\.js\?v=[^"]+/, 'live_timetable.js?v=20261004_v4');
mh = mh.replace(/admin\.js\?v=[^"]+/, 'admin.js?v=20261004_v4');
fs.writeFileSync(mhPath, mh, 'utf8');

console.log('Updated cache-busters in timetable.html and master_hub.html to v4!');
