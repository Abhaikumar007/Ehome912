const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const supabaseUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)[0];
const supabaseKey = js.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)[0];

const sb = createClient(supabaseUrl, supabaseKey);

async function testPermissions() {
    console.log('--- Testing Insert ---');
    const testId = '00000000-test-0000-0000-000000000001';
    const { data: insData, error: insErr } = await sb.from('announcements').insert([{
        id: testId,
        title: 'Test Announcement Perms',
        description: 'Test description',
        time_label: 'Just now'
    }]).select();
    console.log('Insert result:', insErr ? 'FAILED: ' + JSON.stringify(insErr) : 'SUCCESS');

    console.log('--- Testing Update ---');
    const { data: updData, error: updErr } = await sb.from('announcements').update({
        title: 'Test Announcement Perms UPDATED'
    }).eq('id', testId).select();
    console.log('Update result:', updErr ? 'FAILED: ' + JSON.stringify(updErr) : 'SUCCESS, updated: ' + updData?.length);

    console.log('--- Testing Delete ---');
    const { data: delData, error: delErr } = await sb.from('announcements').delete().eq('id', testId).select();
    console.log('Delete result:', delErr ? 'FAILED: ' + JSON.stringify(delErr) : 'SUCCESS, deleted: ' + delData?.length);

    // Also test delete on academic_alerts
    console.log('--- Testing academic_alerts ---');
    const { data: aData, error: aErr } = await sb.from('academic_alerts').select('*').limit(5);
    console.log('academic_alerts select:', aErr ? 'FAILED: ' + JSON.stringify(aErr) : 'Count: ' + aData?.length);

    // Also test pending_tests
    console.log('--- Testing pending_tests ---');
    const { data: pData, error: pErr } = await sb.from('pending_tests').select('*').limit(5);
    console.log('pending_tests select:', pErr ? 'FAILED: ' + JSON.stringify(pErr) : 'Count: ' + pData?.length);
}

testPermissions();
