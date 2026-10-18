const fs = require('fs');
const path = require('path');

const adminJsPath = 'C:/Users/madhu/code_test/private/js/admin.js';
const liveTtJsPath = 'C:/Users/madhu/code_test/private/js/live_timetable.js';
const ttHtmlPath = 'C:/Users/madhu/code_test/private/timetable.html';
const masterHubHtmlPath = 'C:/Users/madhu/code_test/private/master_hub.html';
const adminCssPath = 'C:/Users/madhu/code_test/private/css/admin.css';

console.log('=== Applying Timetable Date Isolation & Mobile Clear All Fixes ===');

// ==============================================================================
// 1. PATCH ADMIN.JS
// ==============================================================================
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

// A. Replace the draft storage helpers and clear function in admin.js
const oldDraftBlockStart = "// --- DRAFT STORAGE FOR TIMETABLE (PREVENT DATA LOSS ON RELOAD / REDIRECT) ---";
const oldDraftBlockEnd = "window.clearTimetableSchedule = function () {";

// Find where draft storage is
const idxStart = adminJs.indexOf(oldDraftBlockStart);
if (idxStart === -1) {
    throw new Error('oldDraftBlockStart not found in admin.js');
}

// Find the end of window.clearTimetableSchedule
const idxClear = adminJs.indexOf(oldDraftBlockEnd, idxStart);
const idxClearEnd = adminJs.indexOf('};', idxClear);
if (idxClear === -1 || idxClearEnd === -1) {
    throw new Error('clearTimetableSchedule not found in admin.js');
}

const newDraftAndClearCode = `// --- DRAFT STORAGE FOR TIMETABLE (DATE-AWARE & PREVENTS STALE OVERWRITE) ---
    const DRAFT_TIMETABLE_KEY = 'eduhome_draft_timetable_v2';

    function getActiveBuilderDate() {
        const dateInput = document.getElementById('timetableDate');
        if (dateInput && dateInput.value) return dateInput.value;
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return \`\${y}-\${m}-\${d}\`;
    }

    function saveTimetableDraft() {
        try {
            const activeDate = getActiveBuilderDate();
            const payload = {
                date: activeDate,
                updatedAt: Date.now(),
                entries: timetableEntries
            };
            localStorage.setItem(DRAFT_TIMETABLE_KEY, JSON.stringify(payload));
            // Keep legacy sync for backward compat
            localStorage.setItem('eduhome_draft_timetable_entries', JSON.stringify(timetableEntries));
        } catch (e) {
            console.warn('[Timetable] Error saving draft to localStorage:', e);
        }
    }

    function loadTimetableDraft() {
        try {
            const activeDate = getActiveBuilderDate();
            let draftDate = null;
            let draftEntries = [];

            const savedRaw = localStorage.getItem(DRAFT_TIMETABLE_KEY);
            if (savedRaw) {
                try {
                    const parsed = JSON.parse(savedRaw);
                    if (parsed && Array.isArray(parsed.entries)) {
                        draftDate = parsed.date;
                        draftEntries = parsed.entries;
                    } else if (Array.isArray(parsed)) {
                        draftEntries = parsed;
                        draftDate = draftEntries[0]?.date || null;
                    }
                } catch (e) {}
            } else {
                const legacy = localStorage.getItem('eduhome_draft_timetable_entries');
                if (legacy) {
                    try {
                        const parsed = JSON.parse(legacy);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            draftEntries = parsed;
                            draftDate = draftEntries[0]?.date || null;
                        }
                    } catch (e) {}
                }
            }

            // Remove any existing stale draft banner
            const existingBanner = document.getElementById('staleDraftNoticeBanner');
            if (existingBanner) existingBanner.remove();

            if (!draftEntries || draftEntries.length === 0) {
                return;
            }

            // If draft date matches active builder date, populate directly
            if (!draftDate || draftDate === activeDate) {
                timetableEntries.length = 0;
                draftEntries.forEach(item => timetableEntries.push(item));
                if (typeof renderTimetable === 'function') {
                    renderTimetable();
                }
                return;
            }

            // Stale draft from yesterday or earlier: DO NOT auto-populate today!
            // Show a sleek, beautiful notice so user can copy or discard with 1 click.
            _renderStaleDraftBanner(draftDate, draftEntries, activeDate);

        } catch (e) {
            console.warn('[Timetable] Error loading draft from localStorage:', e);
        }
    }

    function _renderStaleDraftBanner(draftDate, draftEntries, activeDate) {
        const container = document.getElementById('timetable-container');
        if (!container) return;

        let banner = document.getElementById('staleDraftNoticeBanner');
        if (banner) banner.remove();

        banner = document.createElement('div');
        banner.id = 'staleDraftNoticeBanner';
        banner.className = 'alert alert-info border-primary shadow-sm p-3 mb-3 d-flex flex-wrap justify-content-between align-items-center no-capture';
        banner.style.cssText = 'border-radius:10px; background:linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left:5px solid #2563eb;';

        const friendly = typeof formatDateFriendly === 'function' ? formatDateFriendly(draftDate) : draftDate;
        banner.innerHTML = \`
            <div class="mb-2 mb-md-0">
                <i class="fas fa-history text-primary mr-2" style="font-size:1.15rem;"></i>
                <strong class="text-dark">Saved Schedule from \${friendly} (\${draftDate})</strong>
                <div class="small text-muted mt-1">Contains \${draftEntries.length} class session(s). Today (\${activeDate}) starts fresh so you can build today's schedule without old classes getting in the way.</div>
            </div>
            <div class="btn-group btn-group-sm mt-2 mt-md-0" role="group">
                <button type="button" class="btn btn-primary font-weight-bold" id="btnCopyDraftToday" onclick="window.copyStaleDraftToActiveDate()" style="border-radius:6px 0 0 6px;">
                    <i class="fas fa-copy mr-1"></i> Copy to Today
                </button>
                <button type="button" class="btn btn-outline-danger font-weight-bold" id="btnDiscardDraft" onclick="window.discardStaleDraft()" style="border-radius:0 6px 6px 0;">
                    <i class="fas fa-trash-alt mr-1"></i> Discard
                </button>
            </div>
        \`;

        window._cachedStaleDraft = draftEntries;
        container.insertBefore(banner, container.firstChild);
    }

    window.copyStaleDraftToActiveDate = function () {
        const activeDate = getActiveBuilderDate();
        if (!window._cachedStaleDraft || window._cachedStaleDraft.length === 0) return;

        timetableEntries.length = 0;
        window._cachedStaleDraft.forEach(item => {
            timetableEntries.push({
                ...item,
                date: activeDate
            });
        });

        saveTimetableDraft();
        if (typeof renderTimetable === 'function') {
            renderTimetable();
        }

        const banner = document.getElementById('staleDraftNoticeBanner');
        if (banner) banner.remove();
        delete window._cachedStaleDraft;
    };

    window.discardStaleDraft = function () {
        try {
            localStorage.removeItem(DRAFT_TIMETABLE_KEY);
            localStorage.removeItem('eduhome_draft_timetable_entries');
        } catch (e) {}
        const banner = document.getElementById('staleDraftNoticeBanner');
        if (banner) banner.remove();
        delete window._cachedStaleDraft;
    };

    // Clear builder table draft
    window.clearTimetableSchedule = function () {
        if (!timetableEntries || timetableEntries.length === 0) {
            alert('Timetable schedule table is already empty.');
            return;
        }
        if (confirm('Are you sure you want to clear the timetable builder table? This will clear your draft entries for this screen.')) {
            timetableEntries.length = 0;
            try {
                localStorage.removeItem(DRAFT_TIMETABLE_KEY);
                localStorage.removeItem('eduhome_draft_timetable_entries');
            } catch (e) {}
            if (typeof renderTimetable === 'function') {
                renderTimetable();
            }
        }
    };

    // Clear and remove published timetable for current selected date from Mobile App (Supabase)
    window.clearCurrentDateFromMobileApp = async function () {
        const targetDate = getActiveBuilderDate();
        const friendly = typeof formatDateFriendly === 'function' ? formatDateFriendly(targetDate) : targetDate;

        if (!confirm(\`⚠️ Are you sure you want to completely CLEAR and DELETE all class sessions for \${friendly} (\${targetDate}) from the Mobile App database?\\n\\nThis will remove them from all student & teacher mobile screens immediately.\`)) {
            return;
        }

        const btn = document.getElementById('clearAppTimetableBtn');
        const origHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Removing from Mobile App...';
        }

        try {
            const sb = _getSupabaseClient();
            if (!sb) {
                alert('Database connection not available.');
                return;
            }

            // 1. Delete all classes for that date from Supabase
            const { error: delErr } = await sb.from('classes').delete().eq('class_date', targetDate);
            if (delErr) {
                console.error('[Timetable] Error clearing date from Supabase:', delErr);
                throw delErr;
            }

            // 2. Realtime broadcast so all open mobile apps immediately clear cache
            try {
                await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: { date: targetDate } });
                await sb.channel('teacher_classes_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: { date: targetDate } });
            } catch (be) {
                console.warn('[Broadcast] Error sending classes_changed:', be);
            }

            // 3. Clear local draft entries that were for this date
            timetableEntries.length = 0;
            saveTimetableDraft();
            if (typeof renderTimetable === 'function') {
                renderTimetable();
            }

            // 4. Silently refresh live app manager & counters if loaded
            if (typeof window.initLiveAppTimetable === 'function') {
                window.initLiveAppTimetable('liveTimetablePlatform');
            }

            alert(\`✅ All timetable sessions for \${friendly} have been successfully removed from the Mobile App!\`);
        } catch (err) {
            console.error('Failed to clear timetable from mobile app:', err);
            alert('Failed to clear timetable from mobile app: ' + (err.message || err));
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        }
    };`;

adminJs = adminJs.slice(0, idxStart) + newDraftAndClearCode + adminJs.slice(idxClearEnd + 2);
console.log('✓ Successfully injected date-aware draft storage and clearCurrentDateFromMobileApp into admin.js');

// B. Update removeTimetableEntry in admin.js to sync removal to Supabase
const oldRemoveTarget = `    window.removeTimetableEntry = function (index) {
        timetableEntries.splice(index, 1);
        renderTimetable();
        saveTimetableDraft();
    };`;

const newRemoveTarget = `    window.removeTimetableEntry = async function (index) {
        const removed = timetableEntries[index];
        timetableEntries.splice(index, 1);
        renderTimetable();
        saveTimetableDraft();

        // Also delete matching slot from Supabase if already synced
        if (removed && removed.date && removed.class && removed.subject) {
            try {
                const sb = _getSupabaseClient();
                if (sb) {
                    const gradeStr = String(removed.class).startsWith('Class') ? removed.class : 'Class ' + removed.class;
                    await sb.from('classes')
                        .delete()
                        .eq('class_grade', gradeStr)
                        .eq('class_date', removed.date)
                        .eq('subject', removed.subject);

                    await sb.from('classes')
                        .delete()
                        .eq('roll_no', gradeStr)
                        .eq('class_date', removed.date)
                        .eq('subject', removed.subject);

                    try {
                        await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: {} });
                        await sb.channel('teacher_classes_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: {} });
                    } catch (be) {}
                }
            } catch (syncErr) {
                console.warn('[Timetable] Error syncing removal to Supabase:', syncErr);
            }
        }
    };`;

if (adminJs.includes(oldRemoveTarget)) {
    adminJs = adminJs.replace(oldRemoveTarget, newRemoveTarget);
    console.log('✓ Updated removeTimetableEntry in admin.js to sync deletion to Supabase');
}

// C. In shareTimetableToApp, add Realtime broadcast so mobile app refreshes instantly
const oldShareEndTarget = `            // Update live mobile app cache & count badge silently in background WITHOUT redirecting or switching away
            if (typeof window.initLiveAppTimetable === 'function') {
                window.initLiveAppTimetable('liveTimetablePlatform');
            }`;

const newShareEndTarget = `            // Broadcast Realtime event to mobile apps so they refresh immediately
            try {
                await sb.channel('student_dashboard_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: {} });
                await sb.channel('teacher_classes_realtime').send({ type: 'broadcast', event: 'classes_changed', payload: {} });
            } catch (be) {
                console.warn('[Timetable] Realtime broadcast warning:', be);
            }

            // Update live mobile app cache & count badge silently in background WITHOUT redirecting or switching away
            if (typeof window.initLiveAppTimetable === 'function') {
                window.initLiveAppTimetable('liveTimetablePlatform');
            }`;

if (adminJs.includes(oldShareEndTarget)) {
    adminJs = adminJs.replace(oldShareEndTarget, newShareEndTarget);
    console.log('✓ Added Realtime broadcast to shareTimetableToApp in admin.js');
}

fs.writeFileSync(adminJsPath, adminJs, 'utf8');
console.log('✓ admin.js written successfully');

// ==============================================================================
// 2. PATCH LIVE_TIMETABLE.JS
// ==============================================================================
let liveTtJs = fs.readFileSync(liveTtJsPath, 'utf8');

// A. Change default _activeFilterDate from 'all' to 'today'
liveTtJs = liveTtJs.replace("let _activeFilterDate = 'all';", "let _activeFilterDate = 'today';");

// B. In _resolveLiveItemSyllabus and filter logic, support yesterday filter
const oldDateFilterBlock = `            // Date Filter
            if (_activeFilterDate === 'today') {
                // If exam/test paper is tomorrow, show it 1 day before in today's view!
                const isTomorrowExam = item.class_date === tomorrowStr && (
                    (item.status && (item.status.includes('TP') || item.status.includes('test'))) ||
                    (item.time && item.time.toLowerCase().includes('test paper'))
                );
                if (item.class_date !== todayStr && !isTomorrowExam) return false;
            }
            if (_activeFilterDate === 'tomorrow' && item.class_date !== tomorrowStr) return false;
            if (_activeFilterDate === 'upcoming' && item.class_date < todayStr) return false;
            if (_activeFilterDate === 'custom' && _activeCustomDate && item.class_date !== _activeCustomDate) return false;`;

const newDateFilterBlock = `            // Date Filter
            const yesterdayStr = _getLocalDateStr(-1);
            if (_activeFilterDate === 'today') {
                // If exam/test paper is tomorrow, show it 1 day before in today's view!
                const isTomorrowExam = item.class_date === tomorrowStr && (
                    (item.status && (item.status.includes('TP') || item.status.includes('test'))) ||
                    (item.time && item.time.toLowerCase().includes('test paper'))
                );
                if (item.class_date !== todayStr && !isTomorrowExam) return false;
            }
            if (_activeFilterDate === 'tomorrow' && item.class_date !== tomorrowStr) return false;
            if (_activeFilterDate === 'yesterday' && item.class_date !== yesterdayStr) return false;
            if (_activeFilterDate === 'upcoming' && item.class_date < todayStr) return false;
            if (_activeFilterDate === 'custom' && _activeCustomDate && item.class_date !== _activeCustomDate) return false;`;

if (liveTtJs.includes(oldDateFilterBlock)) {
    liveTtJs = liveTtJs.replace(oldDateFilterBlock, newDateFilterBlock);
    console.log('✓ Added yesterday filter logic to live_timetable.js');
}

// C. Add Yesterday filter button in UI
const oldDateButtons = `<div class="btn-group btn-group-sm" role="group">
                                <button type="button" class="btn \${_activeFilterDate === 'all' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('all', '', '\${containerId}')">All</button>
                                <button type="button" class="btn \${_activeFilterDate === 'today' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('today', '', '\${containerId}')">Today</button>
                                <button type="button" class="btn \${_activeFilterDate === 'tomorrow' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('tomorrow', '', '\${containerId}')">Tomorrow</button>
                                <button type="button" class="btn \${_activeFilterDate === 'upcoming' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('upcoming', '', '\${containerId}')">Upcoming</button>
                            </div>`;

const newDateButtons = `<div class="btn-group btn-group-sm flex-wrap" role="group">
                                <button type="button" class="btn \${_activeFilterDate === 'today' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('today', '', '\${containerId}')">Today</button>
                                <button type="button" class="btn \${_activeFilterDate === 'tomorrow' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('tomorrow', '', '\${containerId}')">Tomorrow</button>
                                <button type="button" class="btn \${_activeFilterDate === 'yesterday' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('yesterday', '', '\${containerId}')">Yesterday</button>
                                <button type="button" class="btn \${_activeFilterDate === 'upcoming' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('upcoming', '', '\${containerId}')">Upcoming</button>
                                <button type="button" class="btn \${_activeFilterDate === 'all' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('all', '', '\${containerId}')">All</button>
                            </div>`;

if (liveTtJs.includes(oldDateButtons)) {
    liveTtJs = liveTtJs.replace(oldDateButtons, newDateButtons);
    console.log('✓ Added Yesterday pill button in live_timetable.js');
}

// D. Add realtime broadcast helper in live_timetable.js
const broadcastHelper = `
    async function _broadcastClassesChange(payload = {}) {
        const sb = _getSb();
        if (!sb) return;
        try {
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'classes_changed',
                payload: payload
            });
            await sb.channel('teacher_classes_realtime').send({
                type: 'broadcast',
                event: 'classes_changed',
                payload: payload
            });
        } catch (e) {
            console.warn('[LiveTimetable] Broadcast notice:', e);
        }
    }
`;

if (!liveTtJs.includes('_broadcastClassesChange')) {
    liveTtJs = liveTtJs.replace('let _assignedTeachers = [...DEFAULT_ASSIGNED_TEACHERS];', 'let _assignedTeachers = [...DEFAULT_ASSIGNED_TEACHERS];' + broadcastHelper);
}

// E. Update clearPastClasses to reliably purge ALL past classes (class_date < todayStr)
const oldClearPastBlock = `    // ── Clear Past / Completed Classes ──────────────────────────────────
    window.clearPastClasses = async function (containerId, btn) {
        const todayStr = _getLocalDateStr(0);

        // Target both classes scheduled before today AND classes marked completed
        const toPurge = _liveClasses.filter(c => {
            if (!c) return false;
            const isPast = Boolean(c.class_date && c.class_date < todayStr);
            const normStatus = (c.status || '').toLowerCase();
            const isCompleted = normStatus.split(':').includes('completed') || normStatus.includes('completed');
            return isPast || isCompleted;
        });

        if (toPurge.length === 0) {
            _showToast('No past or completed classes found to clean up.', true);
            alert('No past or completed classes found to clean up.');
            return;
        }

        // 2-Step inline mobile-friendly confirmation (works seamlessly on mobile touch & desktop)
        if (btn && btn.getAttribute('data-confirming') !== 'true') {
            btn.setAttribute('data-confirming', 'true');
            const origHtml = btn.innerHTML;
            const origClass = btn.className;
            btn.className = 'btn btn-sm btn-danger font-weight-bold shadow-sm';
            btn.innerHTML = \`<i class="fas fa-exclamation-triangle mr-1"></i> Tap to confirm purge (\${toPurge.length})\`;

            const timeoutId = setTimeout(() => {
                if (document.body.contains(btn)) {
                    btn.removeAttribute('data-confirming');
                    btn.className = origClass;
                    btn.innerHTML = origHtml;
                    delete btn._confirmTimeout;
                }
            }, 4000);
            btn._confirmTimeout = timeoutId;
            return;
        }

        if (btn && btn._confirmTimeout) {
            clearTimeout(btn._confirmTimeout);
            delete btn._confirmTimeout;
            btn.removeAttribute('data-confirming');
        } else if (!btn) {
            if (!confirm(\`Are you sure you want to delete \${toPurge.length} past or completed class session(s)? This cannot be undone.\`)) {
                return;
            }
        }

        const sb = _getSb();
        if (!sb) {
            alert('Supabase database client not available.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Purging...';
        }

        try {
            const purgeIds = toPurge.map(c => c.id).filter(Boolean);
            if (purgeIds.length === 0) return;

            // Delete exactly targeted class IDs from Supabase
            const { error } = await sb.from('classes').delete().in('id', purgeIds);
            if (error) throw error;

            const purgeIdSet = new Set(purgeIds);
            _liveClasses = _liveClasses.filter(c => !purgeIdSet.has(c.id));
            _showToast(\`Successfully purged \${purgeIds.length} past / completed class session(s).\`);
            renderPlatform(containerId);
            updateBadgeCounters();
        } catch (err) {
            console.error('[LiveTimetable] Purge error:', err);
            alert('Failed to purge classes: ' + (err.message || err));
            if (btn) {
                btn.disabled = false;
                btn.className = 'btn btn-sm btn-outline-danger font-weight-bold shadow-sm';
                btn.innerHTML = '<i class="fas fa-broom mr-1"></i> Purge Past / Completed Classes';
            }
        }
    };`;

const newClearPastBlock = `    // ── Clear Past Classes (All classes scheduled before today) ───────────────
    window.clearPastClasses = async function (containerId, btn) {
        const todayStr = _getLocalDateStr(0);

        // Purge any class scheduled before today OR marked completed
        const toPurge = _liveClasses.filter(c => {
            if (!c) return false;
            const isPast = Boolean(c.class_date && c.class_date < todayStr);
            const normStatus = (c.status || '').toLowerCase();
            const isCompleted = normStatus.split(':').includes('completed') || normStatus.includes('completed');
            return isPast || isCompleted;
        });

        if (toPurge.length === 0) {
            _showToast('No past or completed classes found to clean up.', true);
            alert('No past or completed classes found to clean up.');
            return;
        }

        if (!confirm(\`⚠️ Purge \${toPurge.length} past / completed class session(s) scheduled before today (\${todayStr})?\\n\\nThis will remove them from the Mobile App cloud database permanently.\`)) {
            return;
        }

        const sb = _getSb();
        if (!sb) {
            alert('Supabase database client not available.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Purging...';
        }

        try {
            const purgeIds = toPurge.map(c => c.id).filter(Boolean);
            if (purgeIds.length === 0) return;

            // Delete targeted class IDs from Supabase
            const { error } = await sb.from('classes').delete().in('id', purgeIds);
            if (error) throw error;

            const purgeIdSet = new Set(purgeIds);
            _liveClasses = _liveClasses.filter(c => !purgeIdSet.has(c.id));

            // Broadcast to mobile app
            await _broadcastClassesChange();

            _showToast(\`Successfully purged \${purgeIds.length} past class session(s).\`);
            renderPlatform(containerId);
            updateBadgeCounters();
        } catch (err) {
            console.error('[LiveTimetable] Purge error:', err);
            alert('Failed to purge classes: ' + (err.message || err));
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-broom mr-1"></i> Purge Past Classes';
            }
        }
    };

    // ── Clear Visible Classes for Active Filter (e.g. Yesterday, Today, or specific date) ──
    window.clearCurrentFilterClasses = async function (containerId, btn) {
        const todayStr = _getLocalDateStr(0);
        const tomorrowStr = _getLocalDateStr(1);
        const yesterdayStr = _getLocalDateStr(-1);

        // Compute currently filtered items
        const toClear = _liveClasses.filter(item => {
            if (_activeFilterClass !== 'all') {
                const itemGrade = String(item.class_grade || item.roll_no || '').replace('Class ', '').trim();
                const filterGrade = _activeFilterClass.replace('Class ', '').trim();
                if (itemGrade !== filterGrade) return false;
            }
            if (_activeFilterSyllabus !== 'all') {
                const itemSyl = _resolveLiveItemSyllabus(item);
                if (_activeFilterSyllabus === 'State Syllabus') {
                    if (itemSyl !== 'State Syllabus' && itemSyl !== 'Both') return false;
                } else if (_activeFilterSyllabus === 'CBSE') {
                    if (itemSyl !== 'CBSE' && itemSyl !== 'Both') return false;
                } else if (_activeFilterSyllabus === 'Both') {
                    if (itemSyl !== 'Both') return false;
                }
            }
            if (_activeFilterDate === 'today' && item.class_date !== todayStr) return false;
            if (_activeFilterDate === 'tomorrow' && item.class_date !== tomorrowStr) return false;
            if (_activeFilterDate === 'yesterday' && item.class_date !== yesterdayStr) return false;
            if (_activeFilterDate === 'upcoming' && item.class_date < todayStr) return false;
            if (_activeFilterDate === 'custom' && _activeCustomDate && item.class_date !== _activeCustomDate) return false;
            return true;
        });

        if (toClear.length === 0) {
            _showToast('No classes found in current view to clear.', true);
            alert('No classes found in the current view to clear.');
            return;
        }

        let scopeLabel = 'current view';
        if (_activeFilterDate === 'yesterday') scopeLabel = \`YESTERDAY (\${yesterdayStr})\`;
        else if (_activeFilterDate === 'today') scopeLabel = \`TODAY (\${todayStr})\`;
        else if (_activeFilterDate === 'tomorrow') scopeLabel = \`TOMORROW (\${tomorrowStr})\`;
        else if (_activeFilterDate === 'custom' && _activeCustomDate) scopeLabel = \`DATE (\${_activeCustomDate})\`;

        if (!confirm(\`⚠️ Delete all \${toClear.length} class session(s) scheduled for \${scopeLabel} from the Mobile App database?\\n\\nThis will remove them immediately from student & faculty dashboards.\`)) {
            return;
        }

        const sb = _getSb();
        if (!sb) {
            alert('Supabase client not ready.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Deleting...';
        }

        try {
            const clearIds = toClear.map(c => c.id).filter(Boolean);
            if (clearIds.length === 0) return;

            const { error } = await sb.from('classes').delete().in('id', clearIds);
            if (error) throw error;

            const idSet = new Set(clearIds);
            _liveClasses = _liveClasses.filter(c => !idSet.has(c.id));

            // Broadcast to mobile app
            await _broadcastClassesChange();

            _showToast(\`Successfully deleted \${clearIds.length} class(es) from mobile app.\`);
            renderPlatform(containerId);
            updateBadgeCounters();
        } catch (err) {
            console.error('[LiveTimetable] Clear error:', err);
            alert('Failed to clear classes: ' + (err.message || err));
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> Clear Visible Schedule';
            }
        }
    };`;

if (liveTtJs.includes(oldClearPastBlock)) {
    liveTtJs = liveTtJs.replace(oldClearPastBlock, newClearPastBlock);
    console.log('✓ Replaced clearPastClasses and added clearCurrentFilterClasses in live_timetable.js');
}

// F. Update deleteLiveClass to use clean confirmation and send Realtime broadcast
const oldDeleteTarget = `    // ── Delete Class Session ──────────────────────────────────────────
    window.deleteLiveClass = async function (classId, btn, containerId) {
        if (!classId) return;

        // 2-step confirmation
        if (btn && btn.getAttribute('data-confirming') !== 'true') {
            btn.setAttribute('data-confirming', 'true');
            const origHtml = btn.innerHTML;
            btn.className = 'btn btn-warning font-weight-bold';
            btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i> Confirm?';

            setTimeout(() => {
                if (document.body.contains(btn)) {
                    btn.removeAttribute('data-confirming');
                    btn.className = 'btn btn-outline-danger';
                    btn.innerHTML = origHtml;
                }
            }, 3500);
            return;
        }

        const sb = _getSb();
        if (!sb) {
            alert('Supabase client not ready.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const { error } = await sb.from('classes').delete().eq('id', classId);
            if (error) {
                console.error('[LiveTimetable] Delete error:', error);
                throw error;
            }

            // Remove from local list
            _liveClasses = _liveClasses.filter(c => c.id !== classId);
            _showToast('Class deleted from mobile app database.');
            renderPlatform(containerId);
            updateBadgeCounters();
        } catch (err) {
            alert('Failed to delete class: ' + (err.message || err));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            }
        }
    };`;

const newDeleteTarget = `    // ── Delete Class Session (Reliable touch-friendly confirmation + Realtime sync) ──
    window.deleteLiveClass = async function (classId, btn, containerId) {
        if (!classId) return;

        const target = _liveClasses.find(c => c.id === classId);
        const name = target ? \`\${target.class_grade || target.roll_no} - \${target.subject}\` : 'this class session';

        if (!confirm(\`Delete \${name} from Mobile App database?\`)) {
            return;
        }

        const sb = _getSb();
        if (!sb) {
            alert('Supabase database client not ready.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const { error } = await sb.from('classes').delete().eq('id', classId);
            if (error) {
                console.error('[LiveTimetable] Delete error:', error);
                throw error;
            }

            // Remove from local list
            _liveClasses = _liveClasses.filter(c => c.id !== classId);

            // Broadcast to mobile app
            await _broadcastClassesChange();

            _showToast('Class deleted from mobile app database.');
            renderPlatform(containerId);
            updateBadgeCounters();
        } catch (err) {
            alert('Failed to delete class: ' + (err.message || err));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            }
        }
    };`;

if (liveTtJs.includes(oldDeleteTarget)) {
    liveTtJs = liveTtJs.replace(oldDeleteTarget, newDeleteTarget);
    console.log('✓ Updated deleteLiveClass with reliable confirmation and realtime broadcast');
}

// G. In renderPlatform, add Mobile Cards View + Updated Footer Bar
const oldFooterBarTarget = `                <!-- Footer Summary Bar -->
                <div class="p-3 border-top d-flex flex-wrap justify-content-between align-items-center" style="background:#f8fafc; font-size:0.85rem; gap:10px;">
                    <div class="text-muted mb-1 mb-sm-0">
                        Showing <strong>\${filtered.length}</strong> of <strong>\${_liveClasses.length}</strong> total class sessions in cloud database.
                    </div>
                    <div>
                        <button type="button" class="btn btn-sm btn-outline-danger font-weight-bold shadow-sm" id="purgePastClassesBtn" onclick="window.clearPastClasses('\${containerId}', this)" style="border-radius:8px; padding:6px 14px; touch-action:manipulation; cursor:pointer;">
                            <i class="fas fa-broom mr-1"></i> Purge Past / Completed Classes
                        </button>
                    </div>
                </div>`;

const newFooterBarTarget = `                <!-- Mobile Cards View (Rendered on phones / tablets below 768px) -->
                <div class="d-md-none p-3" id="liveCardsMobileView" style="background:#f8fafc;">
                    \${filtered.length === 0 ? \`
                        <div class="text-center py-4 text-muted">
                            <i class="fas fa-calendar-times fa-2x mb-2 text-muted" style="opacity:0.4;"></i>
                            <div class="font-weight-bold">No classes for this selection</div>
                        </div>
                    \` : filtered.map(item => {
                        const meta = _getSubjectMeta(item.subject);
                        const timeInfo = _parseTimeDetails(item.time);
                        const dateFormatted = _friendlyDate(item.class_date);
                        const isPublished = item.published !== false;
                        const syl = _resolveLiveItemSyllabus(item);

                        return \`
                            <div class="card mb-3 shadow-sm border-0 live-mobile-card" style="border-radius:12px; overflow:hidden;">
                                <div class="card-body p-3">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <span class="badge px-2 py-1" style="background:#e0f2fe; color:#0369a1; font-weight:700; border-radius:6px; font-size:0.85rem;">
                                                \${item.class_grade || item.roll_no || 'Class'}
                                            </span>
                                            <span class="badge ml-1 px-2 py-1" style="background:\${syl === 'CBSE' ? '#e0f2fe' : syl === 'State Syllabus' ? '#f0fdf4' : '#f1f5f9'}; color:\${syl === 'CBSE' ? '#0284c7' : syl === 'State Syllabus' ? '#15803d' : '#475569'}; border-radius:6px; font-size:0.75rem; font-weight:600;">
                                                \${syl}
                                            </span>
                                        </div>
                                        <div class="text-right">
                                            <span class="badge badge-light border px-2 py-1 font-weight-bold text-dark" style="font-size:0.8rem;">
                                                <i class="far fa-calendar-alt text-primary mr-1"></i>\${dateFormatted}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="d-flex align-items-center mb-2">
                                        <span class="badge px-2 py-1 font-weight-bold mr-2" style="background:\${meta.bg}; color:\${meta.color}; border-radius:6px; font-size:0.92rem;">
                                            \${meta.emoji} \${item.subject || 'General'}
                                        </span>
                                        <div class="font-weight-bold text-dark" style="font-size:0.9rem;">
                                            <i class="far fa-clock text-muted mr-1"></i>\${timeInfo.time}
                                        </div>
                                    </div>

                                    \${timeInfo.faculty ? \`
                                        <div class="small text-muted mb-3">
                                            <i class="fas fa-chalkboard-teacher text-info mr-1"></i>Teacher: <strong class="text-dark">\${timeInfo.faculty}</strong>
                                        </div>
                                    \` : ''}

                                    <!-- Action Buttons Row -->
                                    <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                                        <button class="btn btn-sm \${isPublished ? 'btn-outline-success' : 'btn-outline-secondary'}" style="font-size:0.78rem; border-radius:20px; padding:4px 12px; font-weight:600;" onclick="window.toggleLiveClassPublish('\${item.id}', \${isPublished}, '\${containerId}')">
                                            <i class="fas \${isPublished ? 'fa-eye' : 'fa-eye-slash'} mr-1"></i>\${isPublished ? 'Live on App' : 'Hidden'}
                                        </button>
                                        <div class="btn-group btn-group-sm" role="group">
                                            <button class="btn btn-outline-primary" onclick="window.openEditClassModal('\${item.id}')" style="border-radius:6px 0 0 6px; padding:4px 12px;">
                                                <i class="fas fa-edit mr-1"></i>Edit
                                            </button>
                                            <button class="btn btn-danger font-weight-bold" onclick="window.deleteLiveClass('\${item.id}', this, '\${containerId}')" style="border-radius:0 6px 6px 0; padding:4px 14px;">
                                                <i class="fas fa-trash-alt mr-1"></i>Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        \`;
                    }).join('')}
                </div>

                <!-- Footer Summary Bar with Smart Cleanup Actions -->
                <div class="p-3 border-top d-flex flex-wrap justify-content-between align-items-center" style="background:#f8fafc; font-size:0.85rem; gap:10px;">
                    <div class="text-muted mb-1 mb-sm-0">
                        Showing <strong>\${filtered.length}</strong> of <strong>\${_liveClasses.length}</strong> class session(s) in cloud database.
                    </div>
                    <div class="d-flex flex-wrap align-items-center" style="gap:8px;">
                        \${filtered.length > 0 ? \`
                            <button type="button" class="btn btn-sm btn-outline-danger font-weight-bold shadow-sm" id="clearFilterClassesBtn" onclick="window.clearCurrentFilterClasses('\${containerId}', this)" style="border-radius:8px; padding:6px 14px;">
                                <i class="fas fa-trash-alt mr-1"></i> Clear Visible (\${filtered.length})
                            </button>
                        \` : ''}
                        <button type="button" class="btn btn-sm btn-danger font-weight-bold shadow-sm" id="purgePastClassesBtn" onclick="window.clearPastClasses('\${containerId}', this)" style="border-radius:8px; padding:6px 14px;">
                            <i class="fas fa-broom mr-1"></i> Purge Past Classes (\${_liveClasses.filter(c => c && c.class_date && c.class_date < todayStr).length})
                        </button>
                    </div>
                </div>`;

if (liveTtJs.includes(oldFooterBarTarget)) {
    liveTtJs = liveTtJs.replace(oldFooterBarTarget, newFooterBarTarget);
    console.log('✓ Added mobile cards view and enhanced footer cleanup bar in live_timetable.js');
}

// Add .d-none .d-md-block to desktop table wrapper so mobile phones use cards view
const oldTableDiv = '<div class="table-responsive" style="max-height: 520px; overflow-y: auto;">';
const newTableDiv = '<div class="table-responsive d-none d-md-block" style="max-height: 520px; overflow-y: auto;">';
if (liveTtJs.includes(oldTableDiv)) {
    liveTtJs = liveTtJs.replace(oldTableDiv, newTableDiv);
    console.log('✓ Set desktop table responsive hide on mobile in live_timetable.js');
}

fs.writeFileSync(liveTtJsPath, liveTtJs, 'utf8');
console.log('✓ live_timetable.js written successfully');

// ==============================================================================
// 3. PATCH TIMETABLE.HTML
// ==============================================================================
let ttHtml = fs.readFileSync(ttHtmlPath, 'utf8');

// Update shareSection buttons in timetable.html
const oldShareSection = `<div id="shareSection" style="display:none; text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary btn-lg" id="shareWhatsappBtn">
                        <i class="fas fa-download mr-1"></i> Download Schedule
                    </button>
                    <button class="btn btn-success btn-lg ml-2" id="shareAppBtn" onclick="shareTimetableToApp()">
                        <i class="fas fa-paper-plane mr-1"></i> 🚀 Share Timetable to Mobile App
                    </button>
                    <button class="btn btn-outline-danger btn-lg ml-2" id="clearTimetableBtn" onclick="clearTimetableSchedule()" title="Clear table entries">
                        <i class="fas fa-trash-alt mr-1"></i> Clear Table
                    </button>
                </div>`;

const newShareSection = `<div id="shareSection" style="display:none; text-align: center; margin-top: 20px;">
                    <div class="d-flex flex-wrap justify-content-center align-items-center" style="gap:10px;">
                        <button class="btn btn-primary btn-lg shadow-sm" id="shareWhatsappBtn">
                            <i class="fas fa-download mr-1"></i> Download Schedule
                        </button>
                        <button class="btn btn-success btn-lg shadow-sm" id="shareAppBtn" onclick="shareTimetableToApp()">
                            <i class="fas fa-paper-plane mr-1"></i> 🚀 Share Timetable to Mobile App
                        </button>
                        <button class="btn btn-outline-warning btn-lg shadow-sm" id="clearTimetableBtn" onclick="clearTimetableSchedule()" title="Clear builder table entries">
                            <i class="fas fa-eraser mr-1"></i> Clear Table Draft
                        </button>
                        <button class="btn btn-outline-danger btn-lg shadow-sm" id="clearAppTimetableBtn" onclick="clearCurrentDateFromMobileApp()" title="Delete today's schedule from mobile app">
                            <i class="fas fa-trash-alt mr-1"></i> 🗑️ Clear from Mobile App
                        </button>
                    </div>
                </div>`;

if (ttHtml.includes(oldShareSection)) {
    ttHtml = ttHtml.replace(oldShareSection, newShareSection);
    console.log('✓ Updated shareSection buttons in timetable.html');
}

// Add date change listener in timetable.html
const oldDomLoaded = `document.addEventListener('DOMContentLoaded', function() {
            // Set default date to today in timetable builder
            const dateInp = document.getElementById('timetableDate');
            if (dateInp && !dateInp.value) {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                dateInp.value = \`\${y}-\${m}-\${d}\`;
            }`;

const newDomLoaded = `document.addEventListener('DOMContentLoaded', function() {
            // Set default date to today in timetable builder
            const dateInp = document.getElementById('timetableDate');
            if (dateInp && !dateInp.value) {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                dateInp.value = \`\${y}-\${m}-\${d}\`;
            }
            if (dateInp) {
                dateInp.addEventListener('change', function() {
                    if (typeof saveTimetableDraft === 'function') saveTimetableDraft();
                    if (typeof loadTimetableDraft === 'function') loadTimetableDraft();
                });
            }`;

if (ttHtml.includes(oldDomLoaded)) {
    ttHtml = ttHtml.replace(oldDomLoaded, newDomLoaded);
    console.log('✓ Added date input change listener in timetable.html');
}

// Update script cache busters in timetable.html
const ts = Date.now();
ttHtml = ttHtml.replace(/js\/admin\.js\?v=[^"]+/, `js/admin.js?v=20261015_fixed_${ts}`);
ttHtml = ttHtml.replace(/js\/live_timetable\.js\?v=[^"]+/, `js/live_timetable.js?v=20261015_fixed_${ts}`);

fs.writeFileSync(ttHtmlPath, ttHtml, 'utf8');
console.log('✓ timetable.html written successfully');

// ==============================================================================
// 4. PATCH MASTER_HUB.HTML (Cache busters)
// ==============================================================================
let masterHub = fs.readFileSync(masterHubHtmlPath, 'utf8');
masterHub = masterHub.replace(/js\/admin\.js\?v=[^"]+/, `js/admin.js?v=20261015_fixed_${ts}`);
masterHub = masterHub.replace(/js\/live_timetable\.js\?v=[^"]+/, `js/live_timetable.js?v=20261015_fixed_${ts}`);
fs.writeFileSync(masterHubHtmlPath, masterHub, 'utf8');
console.log('✓ master_hub.html written successfully');

// ==============================================================================
// 5. PATCH ADMIN.CSS (Mobile cards & touch targets)
// ==============================================================================
let adminCss = fs.readFileSync(adminCssPath, 'utf8');
const customCss = `
/* --- Mobile Timetable Platform Styling --- */
.live-mobile-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    border: 1px solid #e2e8f0 !important;
}
.live-mobile-card:active {
    transform: scale(0.99);
}
@media (max-width: 768px) {
    #shareSection button {
        width: 100%;
        margin-bottom: 8px !important;
        font-size: 1rem;
        padding: 10px 16px;
    }
    .table-responsive {
        border-radius: 8px;
    }
}
`;

if (!adminCss.includes('live-mobile-card')) {
    adminCss += customCss;
    fs.writeFileSync(adminCssPath, adminCss, 'utf8');
    console.log('✓ admin.css updated with mobile timetable card styles');
}

console.log('=== All Timetable Fixes Applied Successfully! ===');
