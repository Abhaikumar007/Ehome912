const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');
const supabaseUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)[0];
const supabaseKey = js.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)[0];

const sb = createClient(supabaseUrl, supabaseKey);

async function testTimetableCrud() {
    console.log('=== Testing Live Timetable CRUD in Supabase ===');

    const testDate = '2026-10-12';
    // 1. Insert a new class session
    const { data: insData, error: insErr } = await sb.from('classes').insert([{
        class_grade: 'Class 10',
        roll_no: 'Class 10',
        subject: 'Physics',
        class_date: testDate,
        time: '05:30 PM - 07:00 PM • State Syllabus • Regular Class • Mr. Akshay Kumar M',
        status: 'upcoming:State:fac-phy',
        published: true
    }]).select();

    if (insErr) {
        console.error('Insert error:', insErr);
        return;
    }
    const createdId = insData[0].id;
    console.log('✅ Created class session with ID:', createdId, 'Date:', testDate);

    // 2. Update the date and time of the class session
    const updatedDate = '2026-10-13';
    const { data: updData, error: updErr } = await sb.from('classes').update({
        class_date: updatedDate,
        time: '06:00 PM - 07:30 PM • State Syllabus • Regular Class • Mr. Akshay Kumar M'
    }).eq('id', createdId).select();

    if (updErr) {
        console.error('Update error:', updErr);
        return;
    }
    console.log('✅ Updated class session date to:', updData[0].class_date, 'Time:', updData[0].time);

    // 3. Query classes for that date
    const { data: qData } = await sb.from('classes').select('*').eq('class_date', updatedDate);
    console.log(`✅ Filtered classes on ${updatedDate}: found ${qData.length} records`);

    // 4. Clean up test class
    const { error: delErr } = await sb.from('classes').delete().eq('id', createdId);
    console.log('✅ Cleaned up test class:', delErr ? delErr : 'SUCCESS');
}

testTimetableCrud();
