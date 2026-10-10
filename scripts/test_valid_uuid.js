const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const supabaseUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)[0];
const supabaseKey = js.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)[0];

const sb = createClient(supabaseUrl, supabaseKey);

async function testValidUuid() {
    const validUuid = '11111111-2222-3333-4444-555555555555';
    console.log('--- Testing Insert with valid UUID ---');
    const { data: insData, error: insErr } = await sb.from('announcements').insert([{
        id: validUuid,
        title: 'Valid UUID Test',
        description: 'Test body',
        time_label: 'Just now'
    }]).select();
    console.log('Insert result:', insErr ? 'FAILED: ' + JSON.stringify(insErr) : 'SUCCESS, id: ' + insData[0]?.id);

    console.log('--- Testing Update ---');
    const { data: updData, error: updErr } = await sb.from('announcements').update({
        title: 'Valid UUID Test UPDATED'
    }).eq('id', validUuid).select();
    console.log('Update result:', updErr ? 'FAILED: ' + JSON.stringify(updErr) : 'SUCCESS');

    console.log('--- Testing Delete ---');
    const { data: delData, error: delErr } = await sb.from('announcements').delete().eq('id', validUuid).select();
    console.log('Delete result:', delErr ? 'FAILED: ' + JSON.stringify(delErr) : 'SUCCESS, deleted count: ' + delData?.length);

    console.log('--- Testing Clear All (delete with neq) ---');
    // We won't delete real rows yet, but test what neq error or response is
    const { error: neqErr } = await sb.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Delete neq result:', neqErr ? 'FAILED: ' + JSON.stringify(neqErr) : 'SUCCESS');
}

testValidUuid();
