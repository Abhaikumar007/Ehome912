const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const supabaseUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)[0];
const supabaseKey = js.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)[0];

const sb = createClient(supabaseUrl, supabaseKey);

async function seedTestData() {
    const { data: a1, error: e1 } = await sb.from('announcements').insert([{
        title: 'School Campus Closed for Dussehra',
        description: 'The school campus will remain closed on Monday on account of Dussehra. Regular classes resume Tuesday.',
        icon: 'megaphone',
        icon_bg: '#FEF3F2',
        icon_color: '#F04438',
        time_label: 'Just now',
        important: false
    }]).select();

    const { data: a2, error: e2 } = await sb.from('announcements').insert([{
        title: '[Exam Alert - Class 10] Mathematics Unit Test',
        description: 'Subject: Mathematics | Exam Date: 2026-10-15 | Max Marks: 50 | Venue: Room 204\nSyllabus: Quadratic Equations, Arithmetic Progressions\nTime: 10:00 AM - 11:30 AM\nSubmitted by: Mr. Sharma',
        icon: 'calendar',
        icon_bg: '#EFF6FF',
        icon_color: '#1A56DB',
        time_label: 'Exam: 2026-10-15',
        important: true
    }]).select();

    console.log('Inserted a1:', e1 ? e1 : a1[0]?.id);
    console.log('Inserted a2:', e2 ? e2 : a2[0]?.id);
}

seedTestData();
