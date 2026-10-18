const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateUnique4DigitPins(count) {
  const used = new Set(['1234', '4321']);
  // Exclude identical 4-digit strings like 1111, 2222
  for (let i = 0; i <= 9; i++) {
    used.add(String(i).repeat(4));
  }

  const pins = [];
  while (pins.length < count) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    if (!used.has(candidate)) {
      used.add(candidate);
      pins.push(candidate);
    }
  }
  return pins;
}

async function run() {
  console.log('Fetching students from Supabase...');
  const { data: students, error: fetchErr } = await sb
    .from('students')
    .select('*')
    .order('roll_no', { ascending: true });

  if (fetchErr) {
    console.error('Error fetching students:', fetchErr);
    process.exit(1);
  }

  console.log(`Found ${students.length} students in Supabase.`);

  const randomPins = generateUnique4DigitPins(students.length);
  const pinMapping = [];

  console.log('Updating each student with a unique random 4-digit PIN...');

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const newPin = randomPins[i];

    const { error: updateErr } = await sb
      .from('students')
      .update({ pin: newPin })
      .eq('id', s.id);

    if (updateErr) {
      console.error(`Failed to update ${s.roll_no} (${s.name}):`, updateErr.message);
    } else {
      pinMapping.push({
        id: s.id,
        roll_no: s.roll_no,
        name: s.name,
        class_name: s.class_name,
        batch: s.batch,
        phone: s.phone,
        old_pin: s.pin,
        new_pin: newPin,
      });
      console.log(`[${i + 1}/${students.length}] Updated ${s.roll_no} - ${s.name}: ${s.pin} -> ${newPin}`);
    }
  }

  console.log('\n--- Verifying updates in Supabase ---');
  const { data: verifyData, error: verifyErr } = await sb
    .from('students')
    .select('roll_no, name, class_name, pin')
    .order('roll_no', { ascending: true });

  if (verifyErr) {
    console.error('Error verifying students:', verifyErr);
  } else {
    const pinCounts = {};
    verifyData.forEach((s) => {
      pinCounts[s.pin] = (pinCounts[s.pin] || 0) + 1;
    });
    console.log(`Total verified: ${verifyData.length} students.`);
    const still1234 = verifyData.filter((s) => s.pin === '1234').length;
    console.log(`Students still with 1234: ${still1234}`);
    console.log('All pins are 4 digits:', verifyData.every((s) => /^\d{4}$/.test(s.pin)));
  }

  // Save mapping to JSON and CSV
  const exportDir = path.resolve(__dirname, '../export');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const jsonPath = path.join(exportDir, 'student_pins.json');
  fs.writeFileSync(jsonPath, JSON.stringify(pinMapping, null, 2), 'utf8');
  console.log(`Saved PIN mapping to ${jsonPath}`);

  const csvRows = [
    'Roll No,Name,Class,Batch,Phone,New PIN',
    ...pinMapping.map(
      (m) =>
        `"${m.roll_no}","${m.name}","${m.class_name || ''}","${m.batch || ''}","${m.phone || ''}","${m.new_pin}"`
    ),
  ];
  const csvPath = path.join(exportDir, 'student_pins.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
  console.log(`Saved PIN mapping to ${csvPath}`);

  // Also update studentsRoster.ts with the new PINs
  const rosterPath = path.resolve(__dirname, '../lib/studentsRoster.ts');
  if (fs.existsSync(rosterPath)) {
    let rosterContent = fs.readFileSync(rosterPath, 'utf8');
    let replacedCount = 0;
    for (const m of pinMapping) {
      // Find { rollNo: 'm.roll_no', pin: '...', ... }
      const regex = new RegExp(`(rollNo:\\s*['"]${m.roll_no}['"],\\s*pin:\\s*['"])[^'"]+(['"])`);
      if (regex.test(rosterContent)) {
        rosterContent = rosterContent.replace(regex, `$1${m.new_pin}$2`);
        replacedCount++;
      }
    }
    fs.writeFileSync(rosterPath, rosterContent, 'utf8');
    console.log(`Updated ${replacedCount} student PINs in studentsRoster.ts`);
  }
}

run().catch(console.error);
