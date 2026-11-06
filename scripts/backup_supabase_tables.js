// Standalone backup script for Supabase tables
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

function fetchTable(table) {
    return new Promise((resolve, reject) => {
        const url = new URL(`/rest/v1/${table}?select=*`, SUPABASE_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        };

        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

function jsonToCsv(items) {
    if (!items || !items.length) return '';
    const headers = Object.keys(items[0]);
    const headerRow = headers.map(h => `"${h}"`).join(',');
    const rows = items.map(item => {
        return headers.map(header => {
            const val = item[header];
            if (val === null || val === undefined) return '""';
            if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
    });
    return [headerRow, ...rows].join('\n');
}

async function runBackup() {
    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    console.log(`Backing up Supabase tables at ${timestamp}...`);

    // 1. Backup students
    const students = await fetchTable('students');
    const studentsJsonPath = path.join(backupDir, `students_${timestamp}.json`);
    const studentsCsvPath = path.join(backupDir, `students_${timestamp}.csv`);
    fs.writeFileSync(studentsJsonPath, JSON.stringify(students, null, 2), 'utf8');
    fs.writeFileSync(studentsCsvPath, jsonToCsv(students), 'utf8');
    console.log(`✓ Backed up ${students.length} students ->`);
    console.log(`  JSON: ${studentsJsonPath}`);
    console.log(`  CSV:  ${studentsCsvPath}`);

    // 2. Backup fees_records
    const fees = await fetchTable('fees_records');
    const feesJsonPath = path.join(backupDir, `fees_records_${timestamp}.json`);
    const feesCsvPath = path.join(backupDir, `fees_records_${timestamp}.csv`);
    fs.writeFileSync(feesJsonPath, JSON.stringify(fees, null, 2), 'utf8');
    fs.writeFileSync(feesCsvPath, jsonToCsv(fees), 'utf8');
    console.log(`✓ Backed up ${fees.length} fees_records ->`);
    console.log(`  JSON: ${feesJsonPath}`);
    console.log(`  CSV:  ${feesCsvPath}`);

    console.log('\nBackup completed successfully.');
}

runBackup().catch(err => {
    console.error('Backup error:', err);
    process.exit(1);
});

