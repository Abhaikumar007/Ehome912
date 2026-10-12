const fs = require('fs');
const path = require('path');

const adminJsPath = 'C:/Users/madhu/code_test/private/js/admin.js';
const ttHtmlPath = 'C:/Users/madhu/code_test/private/timetable.html';

// --- 1. PATCH ADMIN.JS ---
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

// A. Draft storage helpers
const targetInit = "const shareBtn = document.getElementById('shareWhatsappBtn');";
const draftHelpers = `const shareBtn = document.getElementById('shareWhatsappBtn');

    // --- DRAFT STORAGE FOR TIMETABLE (PREVENT DATA LOSS ON RELOAD / REDIRECT) ---
    const DRAFT_TIMETABLE_KEY = 'eduhome_draft_timetable_entries';

    function saveTimetableDraft() {
        try {
            localStorage.setItem(DRAFT_TIMETABLE_KEY, JSON.stringify(timetableEntries));
        } catch (e) {
            console.warn('[Timetable] Error saving draft to localStorage:', e);
        }
    }

    function loadTimetableDraft() {
        try {
            const saved = localStorage.getItem(DRAFT_TIMETABLE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    timetableEntries.length = 0;
                    parsed.forEach(item => timetableEntries.push(item));
                    if (typeof renderTimetable === 'function') {
                        renderTimetable();
                    }
                }
            }
        } catch (e) {
            console.warn('[Timetable] Error loading draft from localStorage:', e);
        }
    }

    window.clearTimetableSchedule = function () {
        if (!timetableEntries || timetableEntries.length === 0) {
            alert('Timetable schedule table is already empty.');
            return;
        }
        if (confirm('Are you sure you want to clear the timetable table?')) {
            timetableEntries.length = 0;
            try {
                localStorage.removeItem(DRAFT_TIMETABLE_KEY);
            } catch (e) {}
            renderTimetable();
        }
    };`;

if (!adminJs.includes('DRAFT_TIMETABLE_KEY')) {
    if (!adminJs.includes(targetInit)) {
        throw new Error('targetInit not found in admin.js');
    }
    adminJs = adminJs.replace(targetInit, draftHelpers);
    console.log('✓ Injected draft storage helpers into admin.js');
}

// B. Save draft on add
const targetAdd = `        if (existingIdx !== -1) {
            timetableEntries[existingIdx] = entry;
        } else {
            timetableEntries.push(entry);
        }
        renderTimetable();`;

const replaceAdd = `        if (existingIdx !== -1) {
            timetableEntries[existingIdx] = entry;
        } else {
            timetableEntries.push(entry);
        }
        renderTimetable();
        saveTimetableDraft();`;

if (!adminJs.includes('saveTimetableDraft();\n\n        // Instantly sync slot to Supabase classes table')) {
    if (!adminJs.includes(targetAdd)) {
        throw new Error('targetAdd not found in admin.js');
    }
    adminJs = adminJs.replace(targetAdd, replaceAdd);
    console.log('✓ Added saveTimetableDraft() on add entry');
}

// C. Load draft after renderTimetable definition
const targetRenderDef = `        document.getElementById('shareSection').style.display = 'block';
    }`;
const replaceRenderDef = `        document.getElementById('shareSection').style.display = 'block';
    }

    // Auto-restore draft timetable entries from localStorage if available
    loadTimetableDraft();`;

if (!adminJs.includes('// Auto-restore draft timetable entries')) {
    if (!adminJs.includes(targetRenderDef)) {
        throw new Error('targetRenderDef not found in admin.js');
    }
    adminJs = adminJs.replace(targetRenderDef, replaceRenderDef);
    console.log('✓ Added loadTimetableDraft() call');
}

// D. Save draft on remove
const targetRemove = `    window.removeTimetableEntry = function (index) {
        timetableEntries.splice(index, 1);
        renderTimetable();
    };`;
const replaceRemove = `    window.removeTimetableEntry = function (index) {
        timetableEntries.splice(index, 1);
        renderTimetable();
        saveTimetableDraft();
    };`;

if (!adminJs.includes('saveTimetableDraft();\n    };\n\n    // ── WhatsApp Share')) {
    if (!adminJs.includes(targetRemove)) {
        throw new Error('targetRemove not found in admin.js');
    }
    adminJs = adminJs.replace(targetRemove, replaceRemove);
    console.log('✓ Added saveTimetableDraft() on remove entry');
}

// E. Update shareWhatsappBtn to download timetable schedule image & open WhatsApp in new tab without navigating away
const oldShareBlock = `    shareBtn.addEventListener('click', function () {
        if (timetableEntries.length === 0) {
            alert("No entries to share.");
            return;
        }

        let message = \`*Class Schedule*\\n\\n\`;

        // Group by Date, then by Class
        const grouped = {};
        timetableEntries.forEach(entry => {
            const dateDisplay = formatDateFriendly(entry.date);
            if (!grouped[dateDisplay]) {
                grouped[dateDisplay] = {};
            }
            if (!grouped[dateDisplay][entry.class]) {
                grouped[dateDisplay][entry.class] = [];
            }
            grouped[dateDisplay][entry.class].push(entry);
        });

        const dates = Object.keys(grouped);
        dates.forEach((dateDisplay, dateIndex) => {
            message += \`*\${dateDisplay}*\\n\\n\`;

            // Sort classes descending (12, 11, etc.)
            const classes = Object.keys(grouped[dateDisplay]).sort((a, b) => {
                return (parseInt(b) || 0) - (parseInt(a) || 0);
            });

            classes.forEach((cls, classIndex) => {
                message += \`🏫 *Class \${cls}*\\n\`;

                // Sort entries for this class by time
                const entries = grouped[dateDisplay][cls].sort((a, b) => {
                    const timeA = a.startTime || '00:00';
                    const timeB = b.startTime || '00:00';
                    return timeA.localeCompare(timeB);
                });

                entries.forEach(entry => {
                    let timeStr = '';
                    if (entry.startTime && entry.endTime) {
                        timeStr = \`\${formatTime12Hour(entry.startTime)} - \${formatTime12Hour(entry.endTime)}\`;
                    } else if (entry.startTime) {
                        timeStr = formatTime12Hour(entry.startTime);
                    } else {
                        timeStr = '-';
                    }

                    let locStr = entry.location === 'At Home' ? '🏠 At Home' : '🏢 In Center';
                    let boardStr = getBoardEmoji(entry.board || 'Both');
                    let sessionStr = getSessionEmoji(entry.sessionType || 'Regular');

                    message += \`🕒 \${timeStr}\\n\`;
                    message += \`\${getSubjectWithEmoji(entry.subject)}\\n\`;
                    message += \`📋 Board: \${boardStr}\\n\`;
                    message += \`📌 Type: \${sessionStr}\\n\`;
                    message += \`📍 \${locStr}\\n\\n\`;
                });

                if (classIndex < classes.length - 1) {
                    message += \`-------------------\\n\`;
                }
            });

            if (dateIndex < dates.length - 1) {
                message += \`\\n\\n\`;
            }
        });

        // Open WhatsApp with text to specific number using wa.me
        const whatsappUrl = \`https://wa.me/918547457536?text=\${encodeURIComponent(message)}\`;
        window.location.href = whatsappUrl;
    });`;

const newShareBlock = `    shareBtn.addEventListener('click', async function () {
        if (timetableEntries.length === 0) {
            alert("No entries to share.");
            return;
        }

        const originalBtnHtml = shareBtn.innerHTML;
        shareBtn.disabled = true;
        shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Downloading Schedule...';

        try {
            // 1. Download timetable schedule image via html2canvas (without navigating away)
            const timetableContainer = document.getElementById('timetable-container');
            if (timetableContainer && typeof html2canvas === 'function') {
                try {
                    const canvas = await html2canvas(timetableContainer, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        ignoreElements: function (element) {
                            return element.classList && element.classList.contains('no-capture');
                        }
                    });
                    const link = document.createElement('a');
                    const todayStr = new Date().toISOString().slice(0, 10);
                    link.download = \`EduHome_Timetable_Schedule_\${todayStr}.png\`;
                    link.href = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (canvasErr) {
                    console.warn('[Timetable] Error capturing image with html2canvas:', canvasErr);
                }
            }

            // 2. Format WhatsApp schedule message (keep exact format)
            let message = \`*Class Schedule*\\n\\n\`;

            // Group by Date, then by Class
            const grouped = {};
            timetableEntries.forEach(entry => {
                const dateDisplay = formatDateFriendly(entry.date);
                if (!grouped[dateDisplay]) {
                    grouped[dateDisplay] = {};
                }
                if (!grouped[dateDisplay][entry.class]) {
                    grouped[dateDisplay][entry.class] = [];
                }
                grouped[dateDisplay][entry.class].push(entry);
            });

            const dates = Object.keys(grouped);
            dates.forEach((dateDisplay, dateIndex) => {
                message += \`*\${dateDisplay}*\\n\\n\`;

                // Sort classes descending (12, 11, etc.)
                const classes = Object.keys(grouped[dateDisplay]).sort((a, b) => {
                    return (parseInt(b) || 0) - (parseInt(a) || 0);
                });

                classes.forEach((cls, classIndex) => {
                    message += \`🏫 *Class \${cls}*\\n\`;

                    // Sort entries for this class by time
                    const entries = grouped[dateDisplay][cls].sort((a, b) => {
                        const timeA = a.startTime || '00:00';
                        const timeB = b.startTime || '00:00';
                        return timeA.localeCompare(timeB);
                    });

                    entries.forEach(entry => {
                        let timeStr = '';
                        if (entry.startTime && entry.endTime) {
                            timeStr = \`\${formatTime12Hour(entry.startTime)} - \${formatTime12Hour(entry.endTime)}\`;
                        } else if (entry.startTime) {
                            timeStr = formatTime12Hour(entry.startTime);
                        } else {
                            timeStr = '-';
                        }

                        let locStr = entry.location === 'At Home' ? '🏠 At Home' : '🏢 In Center';
                        let boardStr = getBoardEmoji(entry.board || 'Both');
                        let sessionStr = getSessionEmoji(entry.sessionType || 'Regular');

                        message += \`🕒 \${timeStr}\\n\`;
                        message += \`\${getSubjectWithEmoji(entry.subject)}\\n\`;
                        message += \`📋 Board: \${boardStr}\\n\`;
                        message += \`📌 Type: \${sessionStr}\\n\`;
                        message += \`📍 \${locStr}\\n\\n\`;
                    });

                    if (classIndex < classes.length - 1) {
                        message += \`-------------------\\n\`;
                    }
                });

                if (dateIndex < dates.length - 1) {
                    message += \`\\n\\n\`;
                }
            });

            // Open WhatsApp in a NEW tab so the user stays on the current timetable page
            const whatsappUrl = \`https://wa.me/918547457536?text=\${encodeURIComponent(message)}\`;
            window.open(whatsappUrl, '_blank');
        } catch (err) {
            console.error('Error sharing timetable schedule:', err);
            alert('Error generating timetable: ' + (err.message || err));
        } finally {
            shareBtn.disabled = false;
            shareBtn.innerHTML = originalBtnHtml;
        }
    });`;

if (!adminJs.includes('EduHome_Timetable_Schedule_')) {
    if (!adminJs.includes(oldShareBlock)) {
        throw new Error('oldShareBlock not found in admin.js');
    }
    adminJs = adminJs.replace(oldShareBlock, newShareBlock);
    console.log('✓ Replaced shareBtn listener with image download and non-redirect WhatsApp');
}

// F. In shareTimetableToApp: DO NOT redirect / switch away. Stay on same page!
const oldShareAppEnd = `alert('✅ Timetable Successfully Shared to Mobile App!' + ttPushSummary + '\\n\\n' + rowsToInsert.length + ' class schedule session(s) published.\\nAll students in the class and faculty will see this schedule on their live dashboard.');
            if (typeof switchTimetableMode === 'function') {
                switchTimetableMode('live');
            } else if (typeof window.initLiveAppTimetable === 'function') {
                window.initLiveAppTimetable('liveTimetablePlatform');
            }
        } catch (e) {
            console.error('Failed to share timetable:', e);
            alert("Failed to share timetable to mobile app: " + (e.message || e));
        } finally {
            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Share Timetable to Mobile App';
            }
        }`;

const newShareAppEnd = `alert('✅ Timetable Successfully Shared to Mobile App!' + ttPushSummary + '\\n\\n' + rowsToInsert.length + ' class schedule session(s) published.\\nAll students in the class and faculty will see this schedule on their live dashboard.\\n\\nYou are still on this page so you can now download or save your schedule.');

            // Update live mobile app cache & count badge silently in background WITHOUT redirecting or switching away
            if (typeof window.initLiveAppTimetable === 'function') {
                window.initLiveAppTimetable('liveTimetablePlatform');
            }
        } catch (e) {
            console.error('Failed to share timetable:', e);
            alert("Failed to share timetable to mobile app: " + (e.message || e));
        } finally {
            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.className = 'btn btn-success btn-lg ml-2';
                shareBtn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Shared to Mobile App ✓';
            }
        }`;

if (!adminJs.includes('You are still on this page so you can now download or save your schedule.')) {
    if (!adminJs.includes(oldShareAppEnd)) {
        throw new Error('oldShareAppEnd not found in admin.js');
    }
    adminJs = adminJs.replace(oldShareAppEnd, newShareAppEnd);
    console.log('✓ Removed redirection in shareTimetableToApp - admin now stays on same page');
}

fs.writeFileSync(adminJsPath, adminJs, 'utf8');
console.log('admin.js updated successfully!');

// --- 2. PATCH TIMETABLE.HTML ---
let ttHtml = fs.readFileSync(ttHtmlPath, 'utf8');

const oldShareSection = `<div id="shareSection" style="display:none; text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary btn-lg" id="shareWhatsappBtn">
                        <i class="fab fa-whatsapp"></i> Download Schedule
                    </button>
                    <button class="btn btn-success btn-lg ml-2" id="shareAppBtn" onclick="shareTimetableToApp()">
                        <i class="fas fa-paper-plane mr-1"></i> 🚀 Share Timetable to Mobile App
                    </button>
                </div>`;

const newShareSection = `<div id="shareSection" style="display:none; text-align: center; margin-top: 20px;">
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

if (ttHtml.includes(oldShareSection)) {
    ttHtml = ttHtml.replace(oldShareSection, newShareSection);
    console.log('✓ Updated shareSection in timetable.html');
}

const oldAdminScript = '<script src="js/admin.js?v=20261011_live_1791737932169"></script>';
const newAdminScript = '<script src="js/admin.js?v=20261012_noredirect_' + Date.now() + '"></script>';
if (ttHtml.includes(oldAdminScript)) {
    ttHtml = ttHtml.replace(oldAdminScript, newAdminScript);
    console.log('✓ Updated script cache buster in timetable.html');
}

fs.writeFileSync(ttHtmlPath, ttHtml, 'utf8');
console.log('timetable.html updated successfully!');
