const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const configContent = fs.readFileSync('C:/Users/madhu/code_test/private/js/config.js', 'utf8');
const urlMatch = configContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = configContent.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const sb = createClient(urlMatch[1], keyMatch[1]);

const liveContent = fs.readFileSync('C:/Users/madhu/code_test/private/js/live_timetable.js', 'utf8');
const fnMatch = liveContent.match(/function _resolveLiveItemSyllabus\([\s\S]*?\n    \}/);
eval(fnMatch[0]);

async function run() {
    const { data } = await sb.from('classes').select('*').order('class_date', { ascending: false });
    data.slice(0, 5).forEach(item => {
        const syl = _resolveLiveItemSyllabus(item);
        console.log({
            id: item.id,
            grade: item.class_grade,
            date: item.class_date,
            time: item.time,
            status: item.status,
            resolvedSyllabus: syl
        });
    });
}
run();
