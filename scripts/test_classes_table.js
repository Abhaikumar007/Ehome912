const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const supabaseUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)[0];
const supabaseKey = js.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)[0];

const sb = createClient(supabaseUrl, supabaseKey);

async function testClasses() {
    const { data, error } = await sb.from('classes').select('*').limit(5);
    console.log('classes select:', error ? 'ERROR: ' + JSON.stringify(error) : 'Count: ' + data?.length);

    // Test notifications table
    const { data: nData, error: nErr } = await sb.from('notifications').select('*').limit(5);
    console.log('notifications select:', nErr ? 'ERROR: ' + JSON.stringify(nErr) : 'Count: ' + nData?.length);
}

testClasses();
