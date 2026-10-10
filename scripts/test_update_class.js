const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const configContent = fs.readFileSync('C:/Users/madhu/code_test/private/js/config.js', 'utf8');
const urlMatch = configContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = configContent.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const sb = createClient(urlMatch[1], keyMatch[1]);

async function testUpdate() {
    const { data, error } = await sb.from('classes').update({
        time: '11:30 AM - 12:00 PM • State Syllabus • Test Paper • Ms. Devi',
        status: 'upcoming:State:TP:fac-math'
    }).eq('id', 'a8fa9a82-c666-4dbc-a765-576f963ae75e').select();
    console.log('Update result:', { data, error });
}
testUpdate();
