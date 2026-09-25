const fs = require('fs');
const path = require('path');

const indexPath = 'C:\\Users\\madhu\\code_test\\private\\index.html';
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Add Master Hub to navbar
if (!html.includes('href="master_hub.html"')) {
    html = html.replace(
        '<li class="nav-item active"><a class="nav-link" href="index.html">Dashboard</a></li>',
        '<li class="nav-item active"><a class="nav-link" href="index.html">Dashboard</a></li>\n                    <li class="nav-item"><a class="nav-link" href="master_hub.html"><strong>Master Hub</strong></a></li>'
    );
}

// 2. Add Master Hub card to the top of the cards row
if (!html.includes("master_hub.html'")) {
    const hubCard = `
            <div class="col-md-6 col-sm-12 mb-3">
                <div class="dashboard-card" style="border: 2px solid #0284c7; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); cursor:pointer;" onclick="window.location.href='master_hub.html'">
                    <i class="fas fa-satellite-dish" style="color: #0284c7; font-size: 2.2rem;"></i>
                    <h3 style="color: #0369a1; margin-top: 10px;">Master Control Hub</h3>
                    <p class="text-muted small mb-0">Spreadsheet Bulk Edit, Global Broadcast & Monthly Fees</p>
                </div>
            </div>`;
    html = html.replace('<div class="row">', '<div class="row">\n' + hubCard);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ Updated index.html with Master Control Hub card and navigation link.');
