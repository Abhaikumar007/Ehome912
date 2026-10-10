const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const configContent = fs.readFileSync('C:/Users/madhu/code_test/private/js/config.js', 'utf8');
const urlMatch = configContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = configContent.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const sb = createClient(urlMatch[1], keyMatch[1]);

async function inspect() {
    const { data, error } = await sb.from('classes').select('*').order('class_date', { ascending: false });
    if (error) { console.error(error); return; }
    console.log(JSON.stringify(data.map(d => ({
        id: d.id,
        grade: d.class_grade,
        date: d.class_date,
        subject: d.subject,
        time: d.time,
        status: d.status,
        created: d.created_at
    })), null, 2));
}
inspect();
