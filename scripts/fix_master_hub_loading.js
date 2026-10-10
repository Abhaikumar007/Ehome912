const fs = require('fs');

const adminPath = 'C:\\Users\\madhu\\code_test\\private\\js\\admin.js';
const mhPath = 'C:\\Users\\madhu\\code_test\\private\\js\\master_hub.js';
const mhHtmlPath = 'C:\\Users\\madhu\\code_test\\private\\master_hub.html';

console.log('--- Fixing CBSE_STUDENT_ROLLS in admin.js ---');
let admin = fs.readFileSync(adminPath, 'utf8');
admin = admin.replace(
    "const CBSE_STUDENT_ROLLS = new Set(['EDU-2026-022', 'EDU-2026-036']);",
    "var CBSE_STUDENT_ROLLS = window.CBSE_STUDENT_ROLLS || new Set(['EDU-2026-022', 'EDU-2026-036']);\nwindow.CBSE_STUDENT_ROLLS = CBSE_STUDENT_ROLLS;"
);
fs.writeFileSync(adminPath, admin, 'utf8');
console.log('✓ admin.js fixed');

console.log('--- Fixing CBSE_STUDENT_ROLLS and initialization in master_hub.js ---');
let mh = fs.readFileSync(mhPath, 'utf8');

mh = mh.replace(
    "const CBSE_STUDENT_ROLLS = new Set(['EDU-2026-022', 'EDU-2026-036']);",
    "var CBSE_STUDENT_ROLLS = window.CBSE_STUDENT_ROLLS || new Set(['EDU-2026-022', 'EDU-2026-036']);\nwindow.CBSE_STUDENT_ROLLS = CBSE_STUDENT_ROLLS;"
);

// Fix maxlength="4" to maxlength="32" for alphanumeric PIN
mh = mh.replace('maxlength="4"', 'maxlength="32"');

// Fix DOMContentLoaded to check readyState
const oldDomListener = `document.addEventListener('DOMContentLoaded', async function () {
    console.log('[MasterHub] Initializing Super Admin Master Control Hub...');
    await refreshMasterData();
    testCloudHealth();
    if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
    loadActiveBroadcasts();
    if (typeof updateBulkPaidRangePreview === 'function') updateBulkPaidRangePreview();

    // Refresh active broadcasts when clicking the Broadcasts tab
    const feesTabLink = document.getElementById('tab-fees-link');
    if (feesTabLink) {
        feesTabLink.addEventListener('shown.bs.tab', function () {
            if (typeof window.loadPendingVerifications === 'function') {
                window.loadPendingVerifications();
            }
            if (typeof updateFeeSummary === 'function') updateFeeSummary();
        });
        feesTabLink.addEventListener('click', function () {
            setTimeout(function () {
                if (typeof window.loadPendingVerifications === 'function') {
                    window.loadPendingVerifications();
                }
                if (typeof updateFeeSummary === 'function') updateFeeSummary();
            }, 100);
        });
    }

    // Auto-activate tab from URL hash if provided (e.g. #tab-broadcast)
    function activateTabFromHash() {
        const hash = window.location.hash;
        if (hash) {
            const hashLink = document.querySelector('a[href="' + hash + '"]');
            if (hashLink) {
                if (typeof $ !== 'undefined' && typeof $(hashLink).tab === 'function') {
                    $(hashLink).tab('show');
                } else {
                    hashLink.click();
                }
            }
        }
    }
    activateTabFromHash();
    window.addEventListener('hashchange', activateTabFromHash);

    const broadcastTabLink = document.getElementById('tab-broadcast-link');
    if (broadcastTabLink) {
        broadcastTabLink.addEventListener('shown.bs.tab', function () {
            loadActiveBroadcasts();
            if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
        });
        broadcastTabLink.addEventListener('click', function () {
            setTimeout(function() {
                loadActiveBroadcasts();
                if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
            }, 100);
        });
    }
});`;

const newDomListener = `async function initMasterHub() {
    console.log('[MasterHub] Initializing Super Admin Master Control Hub...');
    await refreshMasterData();
    testCloudHealth();
    if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
    loadActiveBroadcasts();
    if (typeof updateBulkPaidRangePreview === 'function') updateBulkPaidRangePreview();

    // Refresh active broadcasts when clicking the Broadcasts tab
    const feesTabLink = document.getElementById('tab-fees-link');
    if (feesTabLink) {
        feesTabLink.addEventListener('shown.bs.tab', function () {
            if (typeof window.loadPendingVerifications === 'function') {
                window.loadPendingVerifications();
            }
            if (typeof updateFeeSummary === 'function') updateFeeSummary();
        });
        feesTabLink.addEventListener('click', function () {
            setTimeout(function () {
                if (typeof window.loadPendingVerifications === 'function') {
                    window.loadPendingVerifications();
                }
                if (typeof updateFeeSummary === 'function') updateFeeSummary();
            }, 100);
        });
    }

    // Auto-activate tab from URL hash if provided (e.g. #tab-broadcast)
    function activateTabFromHash() {
        const hash = window.location.hash;
        if (hash) {
            const hashLink = document.querySelector('a[href="' + hash + '"]');
            if (hashLink) {
                if (typeof $ !== 'undefined' && typeof $(hashLink).tab === 'function') {
                    $(hashLink).tab('show');
                } else {
                    hashLink.click();
                }
            }
        }
    }
    activateTabFromHash();
    window.addEventListener('hashchange', activateTabFromHash);

    const broadcastTabLink = document.getElementById('tab-broadcast-link');
    if (broadcastTabLink) {
        broadcastTabLink.addEventListener('shown.bs.tab', function () {
            loadActiveBroadcasts();
            if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
        });
        broadcastTabLink.addEventListener('click', function () {
            setTimeout(function() {
                loadActiveBroadcasts();
                if (typeof loadAdminOpinions === 'function') loadAdminOpinions();
            }, 100);
        });
    }
}
window.initMasterHub = initMasterHub;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMasterHub);
} else {
    initMasterHub();
}`;

if (mh.includes(oldDomListener)) {
    mh = mh.replace(oldDomListener, newDomListener);
    console.log('✓ master_hub.js init updated with instant readyState check');
} else {
    console.warn('oldDomListener not matched in master_hub.js');
}

fs.writeFileSync(mhPath, mh, 'utf8');
console.log('✓ master_hub.js fixed');

console.log('--- Updating master_hub.html with fallback and cache-busters ---');
let html = fs.readFileSync(mhHtmlPath, 'utf8');

// Update cache-busters
html = html.replace(/master_hub\.js\?v=[^"]+/, 'master_hub.js?v=20261010_v3');
html = html.replace(/admin\.js\?v=[^"]+/, 'admin.js?v=20261010_v3');

// In document.ready in HTML, add refreshMasterData fallback
const oldJqReady = `$(document).ready(function() {
            // Check hash on load
            if (typeof window.loadPendingVerifications === 'function') { window.loadPendingVerifications(); } // OnLoad`;

const newJqReady = `$(document).ready(function() {
            // Ensure Master Hub data loads immediately
            if (typeof refreshMasterData === 'function') { refreshMasterData(); }
            // Check hash on load
            if (typeof window.loadPendingVerifications === 'function') { window.loadPendingVerifications(); } // OnLoad`;

if (html.includes(oldJqReady)) {
    html = html.replace(oldJqReady, newJqReady);
    console.log('✓ master_hub.html $(document).ready updated with guaranteed refreshMasterData()');
}

fs.writeFileSync(mhHtmlPath, html, 'utf8');
console.log('✓ master_hub.html saved');
