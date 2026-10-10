const fs = require('fs');
const p = 'C:\\Users\\madhu\\code_test\\private\\master_hub.html';
let html = fs.readFileSync(p, 'utf8');

const regex = /<button\s+class="btn btn-warning font-weight-bold"\s+onclick="generateMonthlyFeeCycle\(\)">[\s\S]*?<\/button>/;

const buttonGroup = `<button class="btn btn-warning font-weight-bold" onclick="generateMonthlyFeeCycle()">
                                <i class="fas fa-bolt mr-1"></i> Generate Cycle Dues
                            </button>
                            <button class="btn btn-danger font-weight-bold ml-2" onclick="sendFiveDayFeeReminders(this)" title="Send push notifications to all students with dues within 5 days">
                                <i class="fas fa-bell mr-1"></i> Send 5-Day Due Reminders
                            </button>`;

if (regex.test(html)) {
    html = html.replace(regex, buttonGroup);
    fs.writeFileSync(p, html, 'utf8');
    console.log('✓ Successfully added Send 5-Day Due Reminders button to master_hub.html');
} else {
    console.log('Regex did not match');
}
