const fs = require('fs');

const jsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';
const htmlPath = 'C:/Users/madhu/code_test/private/master_hub.html';

// 1. Patch master_hub.js
console.log('Patching master_hub.js...');
let jsContent = fs.readFileSync(jsPath, 'utf8');

const oldQueryBlock = `.from('fees_records')
            .select('roll_no, current_due, due_date, days_left, status');

        if (feeErr) throw feeErr;

        if (!feeRows || feeRows.length === 0) {
            alert('No fee records found in Supabase.');
            return;
        }

        // Filter: unpaid and days_left <= 5 (including overdue days_left <= 0)
        const dueSoon = feeRows.filter(r => {
            const due = Number(r.current_due) || 0;
            const days = Number(r.days_left);
            const isDue = (r.status === 'due' || r.status === 'overdue' || due > 0);
            return isDue && !isNaN(days) && days <= 5;
        });`;

const newQueryBlock = `.from('fees_records')
            .select('roll_no, current_due, due_date, days_left');

        if (feeErr) throw feeErr;

        if (!feeRows || feeRows.length === 0) {
            alert('No fee records found in Supabase.');
            return;
        }

        // Filter: unpaid (current_due > 0) and days_left <= 5 (including overdue days_left <= 0)
        const dueSoon = feeRows.filter(r => {
            const due = Number(r.current_due) || 0;
            let days = Number(r.days_left);
            if (isNaN(days) && r.due_date) {
                const d = new Date(r.due_date);
                if (!isNaN(d.getTime())) {
                    days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                }
            }
            const isDue = due > 0;
            return isDue && !isNaN(days) && days <= 5;
        });`;

if (jsContent.includes(".select('roll_no, current_due, due_date, days_left, status');")) {
    jsContent = jsContent.replace(oldQueryBlock, newQueryBlock);
    fs.writeFileSync(jsPath, jsContent, 'utf8');
    console.log('✓ Successfully fixed fees_records query in master_hub.js');
} else {
    console.log('Notice: status query block not found in original form, checking alternative replacement...');
    jsContent = jsContent.replace(
        ".select('roll_no, current_due, due_date, days_left, status')",
        ".select('roll_no, current_due, due_date, days_left')"
    );
    fs.writeFileSync(jsPath, jsContent, 'utf8');
    console.log('✓ Replaced select string in master_hub.js');
}

// 2. Patch master_hub.html
console.log('Patching master_hub.html...');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Ensure .grid-table-wrapper has overflow-x: auto and smooth touch scrolling
htmlContent = htmlContent.replace(
    `.grid-table-wrapper {
            max-height: 540px;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }`,
    `.grid-table-wrapper {
            max-height: 540px;
            overflow-x: auto;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }`
);

// Add mobile responsiveness css before </style>
const mobileCssMarker = '/* Responsive Mobile Styles */';
const mobileResponsiveAdditions = `
        /* Responsive Mobile Styles */
        @media (max-width: 768px) {
            /* Mobile Tabs: Sleek Horizontal Scroll Strip */
            #masterHubTabs {
                display: flex !important;
                flex-wrap: nowrap !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                -webkit-overflow-scrolling: touch !important;
                padding-bottom: 6px !important;
                margin-bottom: 16px !important;
                border-bottom: 2px solid #e2e8f0 !important;
                gap: 6px !important;
            }
            #masterHubTabs .nav-item {
                flex: 0 0 auto !important;
            }
            #masterHubTabs .nav-link {
                white-space: nowrap !important;
                padding: 8px 12px !important;
                font-size: 0.85rem !important;
                border-radius: 6px !important;
            }
            #masterHubTabs .nav-link.active {
                border-bottom: 2px solid #007bff !important;
                background-color: #e7f1ff !important;
                color: #0056b3 !important;
                font-weight: 600 !important;
            }

            /* Hub Header Banner Mobile */
            .hub-header {
                padding: 16px 0 !important;
                margin-bottom: 16px !important;
            }
            .hub-header h2 {
                font-size: 1.35rem !important;
            }
            .hub-header p {
                font-size: 0.82rem !important;
            }
            .hub-header-actions {
                display: flex !important;
                gap: 8px !important;
                margin-top: 12px !important;
                width: 100% !important;
            }
            .hub-header-actions .btn {
                flex: 1 1 0 !important;
                padding: 7px 8px !important;
                font-size: 0.82rem !important;
                text-align: center !important;
                white-space: nowrap !important;
            }

            /* Spreadsheet Quick-Grid Controls Mobile */
            .grid-controls-wrapper {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 10px !important;
            }
            .grid-filter-group {
                width: 100% !important;
                display: flex !important;
                gap: 6px !important;
            }
            #gridSearchInput {
                width: 100% !important;
                flex: 1 1 auto !important;
                min-width: 0 !important;
            }
            #gridClassFilter {
                width: 110px !important;
                flex: 0 0 110px !important;
            }
            .grid-action-group {
                width: 100% !important;
                display: flex !important;
                gap: 8px !important;
            }
            .grid-action-group .btn {
                flex: 1 1 0 !important;
                padding: 8px 10px !important;
                font-size: 0.85rem !important;
                text-align: center !important;
                justify-content: center !important;
            }
            .grid-table {
                min-width: 1050px !important;
            }

            /* Monthly Billing Cycle Controls Mobile */
            .fee-cycle-controls-bar {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 10px !important;
                width: 100% !important;
            }
            .fee-cycle-actions-group {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 8px !important;
                width: 100% !important;
            }
            .fee-cycle-actions-group select,
            .fee-cycle-actions-group button,
            .fee-cycle-actions-group .btn {
                width: 100% !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
            }
`;

if (htmlContent.includes(mobileCssMarker)) {
    htmlContent = htmlContent.replace(mobileCssMarker, mobileResponsiveAdditions);
}

// Add responsive container classes and wrapper classes in HTML
htmlContent = htmlContent.replace(
    '<div class="col-md-5 text-md-right mt-3 mt-md-0">',
    '<div class="col-md-5 text-md-right mt-3 mt-md-0 hub-header-actions">'
);

htmlContent = htmlContent.replace(
    '<div class="d-flex flex-wrap justify-content-between align-items-center mb-3">',
    '<div class="d-flex flex-wrap justify-content-between align-items-center mb-3 grid-controls-wrapper">'
);

htmlContent = htmlContent.replace(
    '<div class="d-flex align-items-center mb-2">\n                            <input type="text" id="gridSearchInput"',
    '<div class="d-flex align-items-center mb-2 grid-filter-group">\n                            <input type="text" id="gridSearchInput"'
);

htmlContent = htmlContent.replace(
    '<div class="mb-2">\n                            <button class="btn btn-outline-primary btn-sm mr-2" onclick="addNewGridRow()">',
    '<div class="mb-2 grid-action-group">\n                            <button class="btn btn-outline-primary btn-sm mr-2" onclick="addNewGridRow()">'
);

htmlContent = htmlContent.replace(
    '<div class="d-flex flex-wrap justify-content-between align-items-center mb-4">',
    '<div class="d-flex flex-wrap justify-content-between align-items-center mb-4 fee-cycle-controls-bar">'
);

htmlContent = htmlContent.replace(
    '<div class="d-flex align-items-center">\n                            <select id="cycleMonthSelect"',
    '<div class="d-flex align-items-center fee-cycle-actions-group">\n                            <select id="cycleMonthSelect"'
);

// Add mobile swipe instruction
htmlContent = htmlContent.replace(
    '<p class="text-muted small mt-2 mb-0">\n                        <i class="fas fa-info-circle mr-1"></i>Click any field to edit. Edits are highlighted and saved to both Google Sheets and Supabase upon clicking <strong>Save Changes</strong>.\n                    </p>',
    '<p class="text-muted small mt-2 mb-0 d-flex flex-wrap justify-content-between align-items-center"><span><i class="fas fa-info-circle mr-1"></i>Click any field to edit. Edits are highlighted and saved to both Google Sheets and Supabase upon clicking <strong>Save Changes</strong>.</span><span class="d-md-none text-primary font-weight-bold mt-1"><i class="fas fa-arrows-alt-h mr-1"></i>Swipe table horizontally to view all columns</span></p>'
);

// Bump cache buster
htmlContent = htmlContent.replace(/admin\.js\?v=20261010_v3/g, 'admin.js?v=20261010_v4');
htmlContent = htmlContent.replace(/master_hub\.js\?v=20261010_v3/g, 'master_hub.js?v=20261010_v4');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('✓ Successfully patched master_hub.html with mobile styles and cache-buster v4');
