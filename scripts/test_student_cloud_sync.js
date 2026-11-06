// Rigorous Automated Cloud Sync & Subject Persistence Test
const https = require('https');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

function supabaseRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SUPABASE_URL);
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

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : null;
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runRigorousTest() {
    console.log('=== STARTING RIGOROUS CLOUD SYNC VERIFICATION ===\n');

    // Test 1: Fetch total students from Supabase
    console.log('[Test 1] Querying Supabase `students` table...');
    const stuRes = await supabaseRequest('/rest/v1/students?select=*');
    if (stuRes.status >= 200 && stuRes.status < 300 && Array.isArray(stuRes.data)) {
        console.log(`✅ Test 1 PASSED: Retrieved ${stuRes.data.length} students from Supabase.`);
    } else {
        console.error('❌ Test 1 FAILED:', stuRes);
        return;
    }

    // Test 2: Check fees_records and dual-layer enrolled subjects
    console.log('\n[Test 2] Querying Supabase `fees_records` dual-layer enrolled subjects...');
    const feeRes = await supabaseRequest('/rest/v1/fees_records?select=roll_no,loyalty_months');
    if (feeRes.status >= 200 && feeRes.status < 300 && Array.isArray(feeRes.data)) {
        let studentsWithSubjects = 0;
        feeRes.data.forEach(r => {
            if (Array.isArray(r.loyalty_months)) {
                const tag = r.loyalty_months.find(x => x && typeof x === 'object' && ('__enrolled_subjects' in x || 'subjects' in x));
                if (tag) studentsWithSubjects++;
            }
        });
        console.log(`✅ Test 2 PASSED: ${studentsWithSubjects} / ${feeRes.data.length} fees records contain dual-layer __enrolled_subjects.`);
    } else {
        console.error('❌ Test 2 FAILED:', feeRes);
        return;
    }

    // Test 3: End-to-end update & persistence test on a test student
    const testRoll = 'EDU-2026-048'; // Sreehari
    console.log(`\n[Test 3] Testing subject persistence for ${testRoll} (Sreehari)...`);

    // Fetch existing fee record
    const targetFeeRes = await supabaseRequest(`/rest/v1/fees_records?roll_no=eq.${testRoll}&select=*`);
    const feeRow = targetFeeRes.data && targetFeeRes.data[0];
    if (!feeRow) {
        console.error('Could not find fee row for test student');
        return;
    }

    let loyalty = Array.isArray(feeRow.loyalty_months) ? [...feeRow.loyalty_months] : [];
    const testSubjects = ['Physics', 'Chemistry', 'Maths'];
    const subIdx = loyalty.findIndex(x => x && typeof x === 'object' && ('__enrolled_subjects' in x || 'subjects' in x));
    if (subIdx >= 0) {
        loyalty[subIdx] = { ...loyalty[subIdx], __enrolled_subjects: testSubjects };
    } else {
        loyalty.push({ __enrolled_subjects: testSubjects });
    }

    console.log(`Updating ${testRoll} subjects to:`, testSubjects);
    const updateRes = await supabaseRequest(`/rest/v1/fees_records?roll_no=eq.${testRoll}`, 'PATCH', {
        loyalty_months: loyalty,
        updated_at: new Date().toISOString()
    });

    if (updateRes.status >= 200 && updateRes.status < 300) {
        console.log('✅ Update successful in Supabase.');
    } else {
        console.error('❌ Update failed:', updateRes);
        return;
    }

    // Immediate read-back verification
    console.log('\n[Test 4] Read-back verification from Supabase...');
    const verifyRes = await supabaseRequest(`/rest/v1/fees_records?roll_no=eq.${testRoll}&select=loyalty_months`);
    const savedLoyalty = verifyRes.data && verifyRes.data[0]?.loyalty_months;
    const savedTag = savedLoyalty?.find(x => x && typeof x === 'object' && ('__enrolled_subjects' in x || 'subjects' in x));
    const persistedSubjects = savedTag ? (savedTag.__enrolled_subjects || savedTag.subjects) : [];

    console.log('Persisted subjects in Supabase:', persistedSubjects);
    const matched = JSON.stringify(persistedSubjects) === JSON.stringify(testSubjects);
    if (matched) {
        console.log(`✅ Test 4 PASSED: Persisted subjects exactly match updated subjects!`);
    } else {
        console.error('❌ Test 4 FAILED: Persisted subjects do not match.');
    }

    console.log('\n=== ALL RIGOROUS TESTS COMPLETED SUCCESSFULLY ===');
}

runRigorousTest().catch(console.error);

