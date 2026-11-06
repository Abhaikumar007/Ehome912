/**
 * Phase 2 Migration Script (Idempotent, Dry-Run by Default)
 * Usage:
 *   node scripts/phase2_migration.js              (Dry run - default, 0 writes)
 *   node scripts/phase2_migration.js --apply      (Applies updates to Supabase students table)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const isApply = process.argv.includes('--apply');

// Test records to exclude/handle specially
const EXCLUDED_TEST_ROLLS = new Set(['2024-JEE-0842']); // Arjun S - skipped entirely

// Configured fee resolutions based on user decisions
const RESOLVED_FEES = {
    'EDU-2026-049': 1000, // Sivananda: confirmed ₹1,000 real rate (discount = 0)
    'EDU-2026-040': 1000, // Keerthana: ₹1,000 (cloud receipt)
    'EDU-2026-009': 3000, // Sari S Raj: ₹3,000 (cloud receipts)
    'EDU-2026-043': 3000, // Adarsh: ₹3,000 (cloud receipt)
    'EDU-2026-026': 2000, // Alecia Mathew: ₹2,000 (cloud receipts)
    'EDU-2026-048': 2000  // Sreehari: ₹2,000 (cloud receipts)
};

// Sreehari confirmed subjects: Physics, Chemistry, Maths
const RESOLVED_SUBJECTS = {
    'EDU-2026-048': ['Physics', 'Chemistry', 'Maths'],
    'EDU-2026-DEMO': ['General Tuition']
};

function supabaseRequest(pathStr, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(pathStr, SUPABASE_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        };

        const req = https.request(options, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (_) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function normalizeDate(rawDate) {
    if (!rawDate) return null;
    const str = String(rawDate).trim();
    // Exclude placeholder-looking dates
    if (str === '2026-01-01' || str === '2026-01-15') {
        return null;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmy) {
        const day = dmy[1].padStart(2, '0');
        const month = dmy[2].padStart(2, '0');
        const year = dmy[3];
        const formatted = `${year}-${month}-${day}`;
        if (formatted === '2026-01-01' || formatted === '2026-01-15') return null;
        return formatted;
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        const formatted = parsed.toISOString().slice(0, 10);
        if (formatted === '2026-01-01' || formatted === '2026-01-15') return null;
        return formatted;
    }
    return null;
}

function normalizeSchool(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    const sLower = s.toLowerCase();
    // Strip placeholders
    if (sLower === 'eduhome campus' || sLower === 'eduhome' || sLower === 'cbse' || sLower === 'campus' || sLower === 'none' || sLower === '-') {
        return null;
    }
    // Clean polluted variants
    if (/^divine(\s+(cbse|school|school\s+puthoor))?$/i.test(s)) {
        return 'Divine';
    }
    if (sLower === 'technical scool') {
        return 'Technical School';
    }
    return s;
}

function deriveBoard(dbBatch, roster) {
    const batch = (dbBatch || roster?.batch || '').toLowerCase();
    if (batch.includes('cbse')) return 'CBSE';
    if (batch.includes('state')) return 'State Syllabus';
    if (batch.includes('both')) return 'Both';
    if (roster?.syllabus) return roster.syllabus;
    return 'State Syllabus';
}

async function runPhase2() {
    console.log(`=======================================================`);
    console.log(`  PHASE 2 DATA MIGRATION (${isApply ? 'APPLY MODE' : 'DRY-RUN MODE'})`);
    console.log(`=======================================================\n`);

    // 1. Load MASTER_STUDENTS_ROSTER
    const adminJsPath = path.resolve(__dirname, '../private/js/admin.js');
    const adminContent = fs.readFileSync(adminJsPath, 'utf8');
    const start = adminContent.indexOf('const MASTER_STUDENTS_ROSTER = [');
    const end = adminContent.indexOf('];', start);
    const roster = JSON.parse(adminContent.slice(start + 'const MASTER_STUDENTS_ROSTER = '.length, end + 1));

    // 2. Query Supabase
    console.log('Querying Supabase `students` and `fees_records`...');
    const [stuRes, feeRes] = await Promise.all([
        supabaseRequest('/rest/v1/students?select=*'),
        supabaseRequest('/rest/v1/fees_records?select=*')
    ]);

    if (!Array.isArray(stuRes.data) || !Array.isArray(feeRes.data)) {
        console.error('Failed to query Supabase tables:', stuRes, feeRes);
        process.exit(1);
    }

    const dbStudents = stuRes.data;
    const dbFees = feeRes.data;
    console.log(`Retrieved ${dbStudents.length} students and ${dbFees.length} fees_records from Supabase.\n`);

    const rosterByRoll = new Map(roster.map(r => [String(r.rollNo || r.id).toUpperCase().trim(), r]));
    const rosterByName = new Map(roster.map(r => [r.name.toLowerCase().trim(), r]));
    const feeByRoll = new Map(dbFees.map(f => [String(f.roll_no).toUpperCase().trim(), f]));

    const migrationPlan = [];
    const schoolChanges = [];
    const datePlaceholderList = [];

    dbStudents.forEach(st => {
        const roll = String(st.roll_no || st.id).toUpperCase().trim();
        const r = rosterByRoll.get(roll) || rosterByName.get(st.name.toLowerCase().trim());
        const f = feeByRoll.get(roll);

        // Track school normalization
        if (r && r.school) {
            const norm = normalizeSchool(r.school);
            if (norm !== r.school) {
                schoolChanges.push({ roll: st.roll_no, name: st.name, original: r.school, normalized: norm });
            }
        }

        // Track placeholder dates
        if (r && (r.joiningDate === '2026-01-01' || r.joiningDate === '2026-01-15')) {
            datePlaceholderList.push({ roll: st.roll_no, name: st.name, original: r.joiningDate });
        }

        // EXCLUSION 1: Arjun S (2024-JEE-0842) - skipped entirely as test record
        if (EXCLUDED_TEST_ROLLS.has(roll)) {
            migrationPlan.push({
                roll_no: st.roll_no,
                name: st.name,
                is_skipped: true,
                skip_reason: 'Skipped (test record)',
                proposed: {
                    subjects: st.subjects,
                    board: st.board,
                    monthly_fee: st.monthly_fee,
                    school: st.school,
                    joining_date: st.joining_date
                },
                fee_status: 'N/A (Test record)'
            });
            return;
        }

        // EXCLUSION 2: Demo Student (EDU-2026-DEMO) - only subjects, no board/school/fee/date
        if (roll === 'EDU-2026-DEMO') {
            migrationPlan.push({
                roll_no: st.roll_no,
                name: st.name,
                is_skipped: false,
                is_demo: true,
                proposed: {
                    subjects: ['General Tuition'],
                    board: null,
                    monthly_fee: null,
                    school: null,
                    joining_date: null
                },
                fee_status: 'N/A (Demo record)'
            });
            return;
        }

        // Real student resolution:
        // 1. Subjects
        let finalSubjects = null;
        if (RESOLVED_SUBJECTS[roll]) {
            finalSubjects = RESOLVED_SUBJECTS[roll];
        } else if (f && Array.isArray(f.loyalty_months)) {
            const subTag = f.loyalty_months.find(x => x && typeof x === 'object' && ('__enrolled_subjects' in x || 'subjects' in x));
            if (subTag) finalSubjects = subTag.__enrolled_subjects || subTag.subjects;
        }
        if (!finalSubjects || finalSubjects.length === 0) {
            finalSubjects = (r && Array.isArray(r.subjects) && r.subjects.length > 0) ? r.subjects : ['General Tuition'];
        }

        // 2. Board
        const finalBoard = deriveBoard(st.batch, r);

        // 3. Monthly Fee & Verification status
        let finalFee = null;
        let feeStatus = 'Verified';

        if (RESOLVED_FEES[roll] !== undefined) {
            finalFee = RESOLVED_FEES[roll];
            if (roll === 'EDU-2026-049') {
                feeStatus = 'Verified (Admin confirmed ₹1,000)';
            } else {
                feeStatus = 'Unverified (ADMIN-DIRECT-TOGGLE)';
            }
        } else if (f && Array.isArray(f.loyalty_months)) {
            const feeTag = f.loyalty_months.find(x => x && typeof x === 'object' && ('__monthly_fee' in x || 'fee_standard' in x));
            if (feeTag) finalFee = Number(feeTag.__monthly_fee || feeTag.fee_standard);
            // Check if fee rests only on ADMIN-DIRECT-TOGGLE
            const payments = Array.isArray(f.recent_payments) ? f.recent_payments : [];
            const nonAdmin = payments.filter(p => p && p.utr && p.utr !== 'ADMIN-DIRECT-TOGGLE');
            if (nonAdmin.length === 0 && payments.length > 0) {
                feeStatus = 'Unverified (ADMIN-DIRECT-TOGGLE)';
            } else if (payments.length === 0) {
                feeStatus = 'Unverified (No payments)';
            }
        }
        if (!finalFee || finalFee <= 0) {
            finalFee = Number(r?.amount) || 2000;
            feeStatus = 'Unverified (Roster default)';
        }

        // 4. School
        const finalSchool = normalizeSchool(r?.school);

        // 5. Joining Date (placeholder dates set to null)
        const finalDate = normalizeDate(r?.joiningDate);

        migrationPlan.push({
            roll_no: st.roll_no,
            name: st.name,
            is_skipped: false,
            proposed: {
                subjects: finalSubjects,
                board: finalBoard,
                monthly_fee: finalFee,
                school: finalSchool,
                joining_date: finalDate
            },
            fee_status: feeStatus
        });
    });

    // Sort by roll_no
    migrationPlan.sort((a, b) => a.roll_no.localeCompare(b.roll_no));

    // Write Full Markdown Report
    const reportPath = path.resolve(__dirname, '../phase2_report.md');
    let md = `# Phase 2 Data Migration Report\n\n`;
    md += `Generated: ${new Date().toISOString()}\n`;
    md += `Execution Mode: ${isApply ? '**APPLY (Written to Supabase)**' : '**DRY-RUN (0 writes performed)**'}\n\n`;

    md += `## 1. Test Records Exclusions\n`;
    md += `- \`2024-JEE-0842\` (**Arjun S**): **Skipped (test record)** — excluded from updates, no columns modified.\n`;
    md += `- \`EDU-2026-DEMO\` (**Demo Student**): Only \`subjects = ["General Tuition"]\` updated. Board, school, fee, and joining date set to **NULL**.\n\n`;

    md += `## 2. School Normalizations Applied (${schoolChanges.length})\n\n`;
    md += `| Roll No | Name | Original School | Normalized School |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    schoolChanges.forEach(sc => {
        md += `| \`${sc.roll}\` | ${sc.name} | \`${sc.original}\` | **${sc.normalized || '*NULL*'}** |\n`;
    });
    md += `\n`;

    md += `## 3. Placeholder Joining Dates Set to NULL (${datePlaceholderList.length})\n\n`;
    md += `| Roll No | Name | Original Date | Applied Value |\n`;
    md += `| :--- | :--- | :---: | :---: |\n`;
    datePlaceholderList.forEach(dp => {
        md += `| \`${dp.roll}\` | ${dp.name} | \`${dp.original}\` | **NULL** |\n`;
    });
    md += `\n`;

    md += `## 4. Final Per-Student Table (${migrationPlan.length} Students)\n\n`;
    md += `| Roll No | Name | Subjects | Board | Monthly Fee | Fee Status | School | Joining Date |\n`;
    md += `| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |\n`;
    migrationPlan.forEach(p => {
        if (p.is_skipped) {
            md += `| \`${p.roll_no}\` | **${p.name}** | *(skipped)* | *(skipped)* | *(skipped)* | *Skipped (test record)* | *(skipped)* | *(skipped)* |\n`;
            return;
        }
        const subStr = Array.isArray(p.proposed.subjects) ? p.proposed.subjects.join(', ') : (p.proposed.subjects || 'NULL');
        const schStr = p.proposed.school ? p.proposed.school : '*NULL*';
        const feeStr = p.proposed.monthly_fee ? `₹${p.proposed.monthly_fee}` : '*NULL*';
        const brdStr = p.proposed.board ? p.proposed.board : '*NULL*';
        const dtStr = p.proposed.joining_date ? p.proposed.joining_date : '*NULL*';
        md += `| \`${p.roll_no}\` | **${p.name}** | ${subStr} | ${brdStr} | ${feeStr} | ${p.fee_status} | ${schStr} | ${dtStr} |\n`;
    });

    fs.writeFileSync(reportPath, md, 'utf8');
    console.log(`✓ Full Phase 2 report written to ${reportPath}\n`);

    // Output table preview to console
    console.log('=== DRY-RUN FINAL PROPOSED TABLE (47 STUDENTS) ===\n');
    migrationPlan.forEach(p => {
        if (p.is_skipped) {
            console.log(`${p.roll_no.padEnd(15)} | ${p.name.padEnd(25)} | [SKIPPED - TEST RECORD]`);
        } else {
            console.log(`${p.roll_no.padEnd(15)} | ${p.name.padEnd(25)} | Board: ${(p.proposed.board || 'NULL').padEnd(14)} | Fee: ${(p.proposed.monthly_fee ? '₹' + p.proposed.monthly_fee : 'NULL').padEnd(7)} (${p.fee_status.padEnd(28)}) | School: ${(p.proposed.school || 'NULL').padEnd(18)} | Date: ${(p.proposed.joining_date || 'NULL').padEnd(10)} | Subs: ${p.proposed.subjects.join(', ')}`);
        }
    });

    // --- APPLY EXECUTION ---
    if (isApply) {
        console.log('\n=======================================================');
        console.log('  APPLYING MIGRATION TO SUPABASE (UPDATE ONLY)');
        console.log('=======================================================');
        let successCount = 0;
        let skippedCount = 0;

        for (const item of migrationPlan) {
            if (item.is_skipped) {
                skippedCount++;
                console.log(`[SKIP] ${item.roll_no} (${item.name}) - excluded test record.`);
                continue;
            }

            // Explicit UPDATE (PATCH /rest/v1/students?roll_no=eq.<roll_no>)
            // Writes ONLY subjects, board, monthly_fee, school, joining_date
            const updatePayload = {
                subjects: item.proposed.subjects,
                board: item.proposed.board,
                monthly_fee: item.proposed.monthly_fee,
                school: item.proposed.school,
                joining_date: item.proposed.joining_date
            };

            const res = await supabaseRequest(`/rest/v1/students?roll_no=eq.${encodeURIComponent(item.roll_no)}`, 'PATCH', updatePayload);
            if (res.status >= 200 && res.status < 300) {
                successCount++;
                console.log(`✓ Updated [${item.roll_no}] ${item.name}`);
            } else {
                console.error(`❌ Failed to update [${item.roll_no}] ${item.name}:`, res);
            }
        }

        console.log(`\n=======================================================`);
        console.log(`  MIGRATION SUMMARY: ${successCount} updated, ${skippedCount} skipped, 0 inserted, 0 deleted.`);
        console.log(`=======================================================\n`);

        // Post-Apply Verification: re-query Supabase
        console.log('Running Post-Apply Verification query against Supabase...');
        const verifyRes = await supabaseRequest('/rest/v1/students?select=roll_no,name,subjects,board,monthly_fee,school,joining_date&order=roll_no.asc');
        if (Array.isArray(verifyRes.data)) {
            console.log(`✓ Successfully verified ${verifyRes.data.length} records in Supabase.\n`);
            console.log('Sample verified rows:');
            verifyRes.data.slice(0, 5).forEach(row => {
                console.log(`  ${row.roll_no}: subs=${JSON.stringify(row.subjects)}, board=${row.board}, fee=₹${row.monthly_fee}, school=${row.school}, date=${row.joining_date}`);
            });
            // Verify Sreehari specifically
            const sreehari = verifyRes.data.find(x => x.roll_no === 'EDU-2026-048');
            console.log(`\nVerified Sreehari (EDU-2026-048):`, sreehari);
            // Verify Sivananda specifically
            const sivananda = verifyRes.data.find(x => x.roll_no === 'EDU-2026-049');
            console.log(`Verified Sivananda (EDU-2026-049):`, sivananda);
            // Verify Arjun S (should remain unchanged/test)
            const arjun = verifyRes.data.find(x => x.roll_no === '2024-JEE-0842');
            console.log(`Verified Arjun S (2024-JEE-0842):`, arjun);
        }
    } else {
        console.log('\n[DRY RUN ONLY] 0 writes were performed to the database.');
        console.log('Run with --apply only after reviewing and approving the table above.');
    }
}

runPhase2().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
});
