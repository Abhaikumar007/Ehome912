const fs = require('fs');

// 1. Update fees.html
const feesHtmlPath = 'C:/Users/madhu/code_test/private/fees.html';
let feesHtml = fs.readFileSync(feesHtmlPath, 'utf8');

// Add notice area if not present
if (!feesHtml.includes('pending-fee-notice-area')) {
    feesHtml = feesHtml.replace(
        '<div class="table-responsive">',
        '<div class="p-3 pending-fee-notice-area"></div>\n                <div class="table-responsive">'
    );
}

// Ensure loadPendingVerifications is called on DOMContentLoaded
if (!feesHtml.includes('window.loadPendingVerifications()')) {
    feesHtml = feesHtml.replace(
        "document.addEventListener('DOMContentLoaded', function() {",
        "document.addEventListener('DOMContentLoaded', function() {\n        if (typeof window.loadPendingVerifications === 'function') {\n            window.loadPendingVerifications();\n        }"
    );
}
fs.writeFileSync(feesHtmlPath, feesHtml, 'utf8');
console.log('Updated fees.html successfully!');

// 2. Update master_hub.html to include Pending Student Fee Verifications in Tab 3
const masterHubHtmlPath = 'C:/Users/madhu/code_test/private/master_hub.html';
let masterHubHtml = fs.readFileSync(masterHubHtmlPath, 'utf8');

const pendingSectionHtml = `
                <!-- Pending Verification Queue for Mobile App Student Payments -->
                <div class="hub-card mb-4 border-warning" style="border-left: 5px solid #f59e0b;">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h5 class="font-weight-bold text-warning mb-1">
                                <i class="fas fa-clock mr-2"></i> Pending Student Fee Verifications (Mobile App)
                            </h5>
                            <p class="text-muted mb-0 small">Review and approve fee receipts submitted by students from the EduHome mobile app.</p>
                        </div>
                        <button class="btn btn-sm btn-outline-warning" onclick="loadPendingVerifications()" style="border-radius: 20px; font-weight: 600;">
                            <i class="fas fa-sync-alt mr-1"></i> Refresh Queue
                        </button>
                    </div>
                    <div class="pending-fee-notice-area"></div>
                    <div class="table-responsive">
                        <table class="table table-hover mb-0" style="font-size: 0.92rem;">
                            <thead class="thead-light">
                                <tr>
                                    <th>Student</th>
                                    <th>Class & Roll</th>
                                    <th>Amount</th>
                                    <th>Transaction / UTR</th>
                                    <th>Submitted On</th>
                                    <th style="width: 200px;">Action</th>
                                </tr>
                            </thead>
                            <tbody id="pendingVerificationBody">
                                <tr>
                                    <td colspan="6" class="text-center text-muted py-3">Checking for pending mobile payments...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
`;

if (!masterHubHtml.includes('Pending Student Fee Verifications')) {
    const targetMarker = '<div class="hub-card">\n                    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4">';
    if (masterHubHtml.includes(targetMarker)) {
        masterHubHtml = masterHubHtml.replace(targetMarker, pendingSectionHtml + '\n                ' + targetMarker);
        fs.writeFileSync(masterHubHtmlPath, masterHubHtml, 'utf8');
        console.log('Inserted pending fee verification into master_hub.html Tab 3!');
    } else {
        // Fallback marker
        const altMarker = '<!-- Summary Widgets -->';
        const rowEndMarker = '</div>\n                </div>\n\n                <div class="hub-card">';
        if (masterHubHtml.includes(rowEndMarker)) {
            masterHubHtml = masterHubHtml.replace(rowEndMarker, '</div>\n                </div>\n' + pendingSectionHtml + '\n                <div class="hub-card">');
            fs.writeFileSync(masterHubHtmlPath, masterHubHtml, 'utf8');
            console.log('Inserted pending fee verification into master_hub.html (alt marker)!');
        } else {
            console.log('Could not find marker in master_hub.html');
        }
    }
}

// 3. Update master_hub.js to trigger loadPendingVerifications on tab switch
const masterHubJsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';
let masterHubJs = fs.readFileSync(masterHubJsPath, 'utf8');

if (!masterHubJs.includes('loadPendingVerifications')) {
    const tabMarker = "const broadcastTabLink = document.getElementById('tab-broadcast-link');";
    const tabCode = `const feesTabLink = document.getElementById('tab-fees-link');
    if (feesTabLink) {
        feesTabLink.addEventListener('shown.bs.tab', function () {
            if (typeof window.loadPendingVerifications === 'function') {
                window.loadPendingVerifications();
            }
        });
        feesTabLink.addEventListener('click', function () {
            setTimeout(function () {
                if (typeof window.loadPendingVerifications === 'function') {
                    window.loadPendingVerifications();
                }
            }, 100);
        });
    }

    const broadcastTabLink = document.getElementById('tab-broadcast-link');`;

    masterHubJs = masterHubJs.replace(tabMarker, tabCode);
    fs.writeFileSync(masterHubJsPath, masterHubJs, 'utf8');
    console.log('Updated master_hub.js with fees tab listener!');
}
