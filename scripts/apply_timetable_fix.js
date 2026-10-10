const fs = require('fs');
const path = require('path');

const codeTestDir = 'C:/Users/madhu/code_test/private';
const ttHtmlPath = path.join(codeTestDir, 'timetable.html');
const liveTtJsPath = path.join(codeTestDir, 'js/live_timetable.js');
const mhHtmlPath = path.join(codeTestDir, 'master_hub.html');

let ttHtml = fs.readFileSync(ttHtmlPath, 'utf8');
let liveTtJs = fs.readFileSync(liveTtJsPath, 'utf8');
let mhHtml = fs.readFileSync(mhHtmlPath, 'utf8');

// 1. Backups
fs.writeFileSync(ttHtmlPath + '.bak_' + Date.now(), ttHtml, 'utf8');
fs.writeFileSync(liveTtJsPath + '.bak_' + Date.now(), liveTtJs, 'utf8');

// 2. Patch live_timetable.js

// A) Add _getLocalDateStr helper near top of closure
if (!liveTtJs.includes('function _getLocalDateStr')) {
    liveTtJs = liveTtJs.replace(
        'let _activeFilterDate = \'all\';',
        `function _getLocalDateStr(offsetDays = 0) {
        const d = new Date();
        if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return \`\${y}-\${m}-\${day}\`;
    }
    let _activeFilterDate = 'all';`
    );
    console.log('Added _getLocalDateStr helper');
}

// B) Update _getSb to include _getMasterHubSupabase
const oldGetSb = `    function _getSb() {
        if (typeof _getSupabaseClient === 'function') return _getSupabaseClient();
        if (typeof window._getSupabaseClient === 'function') return window._getSupabaseClient();
        if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) {`;

const newGetSb = `    function _getSb() {
        if (typeof _getSupabaseClient === 'function') return _getSupabaseClient();
        if (typeof window._getSupabaseClient === 'function') return window._getSupabaseClient();
        if (typeof _getMasterHubSupabase === 'function') return _getMasterHubSupabase();
        if (typeof window._getMasterHubSupabase === 'function') return window._getMasterHubSupabase();
        if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) {`;

if (liveTtJs.includes(oldGetSb)) {
    liveTtJs = liveTtJs.replace(oldGetSb, newGetSb);
    console.log('Updated _getSb helper');
}

// C) Update todayStr and tomorrowStr in renderPlatform to use _getLocalDateStr
liveTtJs = liveTtJs.replace(
    /const todayStr = new Date\(\)\.toISOString\(\)\.slice\(0, 10\);[\s\S]*?const tomorrowStr = tomorrowDate\.toISOString\(\)\.slice\(0, 10\);/,
    `const todayStr = _getLocalDateStr(0);
        const tomorrowStr = _getLocalDateStr(1);`
);
console.log('Updated todayStr/tomorrowStr calculation in renderPlatform');

// D) Add window.openCreateClassModal
const openCreateClassModalCode = `
    // ── Open Create Class Modal ──────────────────────────────────────────
    window.openCreateClassModal = function (prefilledDate) {
        _injectEditModalDOM();
        _currentEditId = null;

        const idInput = document.getElementById('editClassId');
        if (idInput) idInput.value = '';

        const modalTitle = document.querySelector('#editLiveClassModal h5');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-calendar-plus mr-2 text-primary"></i>Schedule New Class Session';
        }
        const saveBtn = document.getElementById('saveClassEditBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-plus-circle mr-1"></i> Schedule Session';
        }

        // Set date: prefilledDate > custom date > today's date
        const targetDate = prefilledDate || (_activeFilterDate === 'custom' && _activeCustomDate ? _activeCustomDate : _getLocalDateStr(0));
        const dateInput = document.getElementById('editClassDate');
        if (dateInput) dateInput.value = targetDate;

        // Grade
        const gradeInput = document.getElementById('editClassGrade');
        if (gradeInput) {
            gradeInput.value = (_activeFilterClass !== 'all' ? _activeFilterClass : 'Class 10');
        }

        // Subject
        const subjectInput = document.getElementById('editClassSubject');
        if (subjectInput) subjectInput.value = 'Physics';

        // Syllabus
        const sylInput = document.getElementById('editClassSyllabus');
        if (sylInput) {
            sylInput.value = (_activeFilterSyllabus !== 'all' ? _activeFilterSyllabus : 'Both');
        }

        // Session Type
        const sessType = document.getElementById('editClassSessionType');
        if (sessType) sessType.value = 'Regular';

        // Status
        const statusEl = document.getElementById('editClassStatus');
        if (statusEl) statusEl.value = 'upcoming';

        // Default Times
        const sTimeEl = document.getElementById('editClassStartTime');
        if (sTimeEl) sTimeEl.value = '05:30 PM';
        const eTimeEl = document.getElementById('editClassEndTime');
        if (eTimeEl) eTimeEl.value = '07:00 PM';

        // Published & Broadcast
        const pubEl = document.getElementById('editClassPublished');
        if (pubEl) pubEl.checked = true;
        const bcEl = document.getElementById('editClassBroadcast');
        if (bcEl) bcEl.checked = true;

        // Auto Faculty sync
        window.handleEditSubjectOrGradeChange();

        // Display modal
        const modal = document.getElementById('editLiveClassModal');
        if (modal) modal.style.display = 'flex';
    };
`;

if (!liveTtJs.includes('window.openCreateClassModal = function')) {
    liveTtJs = liveTtJs.replace(
        'window.openEditClassModal = function (classId) {',
        openCreateClassModalCode.trim() + '\n\n    window.openEditClassModal = function (classId) {'
    );
    console.log('Added window.openCreateClassModal function');
}

// E) Update filterLiveDate to clear _activeCustomDate when not custom
const oldFilterDate = `    window.filterLiveDate = function (type, customVal, containerId) {
        _activeFilterDate = type;
        if (type === 'custom') {
            _activeCustomDate = customVal;
        }
        renderPlatform(containerId);
    };`;

const newFilterDate = `    window.filterLiveDate = function (type, customVal, containerId) {
        _activeFilterDate = type;
        if (type === 'custom') {
            _activeCustomDate = customVal;
        } else {
            _activeCustomDate = '';
        }
        renderPlatform(containerId);
    };`;

if (liveTtJs.includes(oldFilterDate)) {
    liveTtJs = liveTtJs.replace(oldFilterDate, newFilterDate);
    console.log('Updated filterLiveDate to manage _activeCustomDate cleanly');
}

// F) Update saveLiveClassEdit to reload data and refresh UI immediately
const oldSaveEnd = `            window.closeEditClassModal();
            _showToast('Class session updated successfully in Supabase!');`;

const newSaveEnd = `            window.closeEditClassModal();
            _showToast(classId ? 'Class session updated successfully in Supabase!' : 'New class session scheduled and published live to mobile app!');

            // Immediately reload live classes and refresh UI table
            await loadLiveClasses(_currentPlatformContainerId);
            updateBadgeCounters();`;

if (liveTtJs.includes(oldSaveEnd)) {
    liveTtJs = liveTtJs.replace(oldSaveEnd, newSaveEnd);
    console.log('Updated saveLiveClassEdit to immediately refresh UI table and badges');
}

// G) Enhance empty state in renderPlatform with 1-click schedule button
const oldEmptyState = `<h6 class="font-weight-bold">No Scheduled Classes Found</h6>
                                            <p class="small text-muted mb-0">No classes match your current filter criteria or none have been published to the mobile app yet.</p>`;

const newEmptyState = `<h6 class="font-weight-bold">No Scheduled Classes Found</h6>
                                            <p class="small text-muted mb-2">No classes match your current filter criteria or none have been published to the mobile app yet.</p>
                                            <button class="btn btn-sm btn-primary font-weight-bold shadow-sm" onclick="window.openCreateClassModal('\${_activeFilterDate === 'custom' && _activeCustomDate ? _activeCustomDate : (_activeFilterDate === 'tomorrow' ? tomorrowStr : todayStr)}')" style="border-radius:6px;">
                                                <i class="fas fa-plus-circle mr-1"></i> Schedule Class for \${_activeFilterDate === 'custom' && _activeCustomDate ? _friendlyDate(_activeCustomDate) : (_activeFilterDate === 'tomorrow' ? 'Tomorrow' : 'Today')}
                                            </button>`;

if (liveTtJs.includes(oldEmptyState)) {
    liveTtJs = liveTtJs.replace(oldEmptyState, newEmptyState);
    console.log('Enhanced empty state with direct Schedule button');
}

// Write updated live_timetable.js
fs.writeFileSync(liveTtJsPath, liveTtJs, 'utf8');
console.log('Saved updated live_timetable.js');

// 3. Update timetable.html to initialize timetableDate with today's date
if (!ttHtml.includes('timetableDate.value =')) {
    ttHtml = ttHtml.replace(
        'document.addEventListener(\'DOMContentLoaded\', function() {',
        `document.addEventListener('DOMContentLoaded', function() {
            // Set default date to today in timetable builder
            const dateInp = document.getElementById('timetableDate');
            if (dateInp && !dateInp.value) {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                dateInp.value = \`\${y}-\${m}-\${d}\`;
            }`
    );
    console.log('Added auto-default for timetableDate in timetable.html');
}

// Bump cache buster in timetable.html and master_hub.html
const v = Date.now().toString();
ttHtml = ttHtml.replace(/live_timetable\.js\?v=[^"]*/g, `live_timetable.js?v=${v}`);
ttHtml = ttHtml.replace(/admin\.js\?v=[^"]*/g, `admin.js?v=${v}`);
fs.writeFileSync(ttHtmlPath, ttHtml, 'utf8');
console.log('Saved timetable.html with cache buster', v);

mhHtml = mhHtml.replace(/live_timetable\.js\?v=[^"]*/g, `live_timetable.js?v=${v}`);
mhHtml = mhHtml.replace(/admin\.js\?v=[^"]*/g, `admin.js?v=${v}`);
fs.writeFileSync(mhHtmlPath, mhHtml, 'utf8');
console.log('Saved master_hub.html with cache buster', v);
