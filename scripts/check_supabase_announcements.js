const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const supabaseUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)[0];
const supabaseKey = js.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)[0];

console.log('Supabase URL:', supabaseUrl);
const sb = createClient(supabaseUrl, supabaseKey);

async function checkAnnouncements() {
    const { data, error } = await sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) {
        console.error('Error fetching announcements:', error);
        return;
    }
    console.log(`Fetched ${data.length} announcements:`);
    data.forEach(a => {
        console.log(`ID: ${a.id} | Title: ${a.title} | TimeLabel: ${a.time_label} | Created: ${a.created_at}`);
    });

    if (data.length > 0) {
        console.log('Sample row:', JSON.stringify(data[0], null, 2));
    }
}

checkAnnouncements();
