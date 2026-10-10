const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const supabaseUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)[0];
const supabaseKey = js.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)[0];

const sb = createClient(supabaseUrl, supabaseKey);

async function testWorkflow() {
    console.log('=== 1. Check current announcements ===');
    const { data: list1 } = await sb.from('announcements').select('*');
    console.log('Count before test:', list1.length);
    list1.forEach(a => console.log(' - ' + a.id + ': ' + a.title));

    if (list1.length === 0) {
        console.log('No items to test, inserting sample...');
        await sb.from('announcements').insert([{
            title: 'Sample Announcement',
            description: 'Sample text'
        }]);
    }

    const target = list1[0];
    console.log('\n=== 2. Test Edit of target ===', target.id);
    const { data: updated, error: updErr } = await sb.from('announcements').update({
        title: target.title + ' [Edited]'
    }).eq('id', target.id).select();
    console.log('Update result:', updErr ? updErr : 'SUCCESS -> ' + updated[0]?.title);

    console.log('\n=== 3. Test Individual Delete of target ===', target.id);
    const { data: deleted, error: delErr } = await sb.from('announcements').delete().eq('id', target.id).select();
    console.log('Delete result:', delErr ? delErr : 'SUCCESS -> deleted count ' + deleted.length);

    console.log('\n=== 4. Test Clear All remaining ===');
    const { error: clrErr } = await sb.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Clear all result:', clrErr ? clrErr : 'SUCCESS');

    // Clean up timetable test paper rows
    const { error: clsErr } = await sb.from('classes').delete().or('time.ilike.%Test Paper%,status.ilike.%TP%');
    console.log('Classes TP cleanup result:', clsErr ? clsErr : 'SUCCESS');

    console.log('\n=== 5. Final Count in announcements ===');
    const { data: listFinal } = await sb.from('announcements').select('*');
    console.log('Final count:', listFinal.length);
}

testWorkflow();
