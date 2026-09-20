// scripts/exportStudents.js
// Standalone script to export student data from Supabase or local records into PostgreSQL SQL & CSV

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

const defaultStudents = [
  { roll_no: '2024-JEE-0842', name: 'Arjun S', class_name: 'Class 12', batch: 'JEE Target (Batch A)', phone: '9876543210' },
  { roll_no: '2024-MED-0311', name: 'Priya Nair', class_name: 'Class 12', batch: 'NEET Achievers', phone: '9123456780' },
  { roll_no: '2024-CBSE-0199', name: 'Rohan Sharma', class_name: 'Class 10', batch: 'Class 10-A (CBSE)', phone: '9988776655' },
  { roll_no: '2024-CBSE-0245', name: 'Sneha Gupta', class_name: 'Class 10', batch: 'Class 10-A (CBSE)', phone: '9811223344' },
];

function cleanPhoneNumber(phone) {
  if (!phone) return '9876543210';
  let clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.length > 10 && clean.startsWith('91')) clean = clean.slice(2);
  return clean.slice(-10).padStart(10, '0');
}

function generateAvatarInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function runExport() {
  console.log('🚀 EduHome Supabase Exporter starting...');
  let rawList = defaultStudents;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('students').select('*');
    if (!error && data && data.length > 0) {
      console.log(`✅ Loaded ${data.length} students from cloud Supabase!`);
      rawList = data;
    } else {
      console.log('ℹ️ Using local student roster (Supabase cloud connection skipped or empty).');
    }
  } catch (e) {
    console.log('ℹ️ Local fallback roster used.');
  }

  const formatted = rawList.map((s, idx) => ({
    roll_no: s.roll_no || `2024-CBSE-${String(idx + 1).padStart(4, '0')}`,
    pin: s.pin || '1234',
    name: toTitleCase(s.name),
    class_name: s.class_name || s.class || 'Class 12',
    batch: s.batch || 'General Batch',
    avatar: s.avatar && s.avatar.length === 2 ? s.avatar.toUpperCase() : generateAvatarInitials(s.name),
    phone: cleanPhoneNumber(s.phone),
    streak: typeof s.streak === 'number' ? s.streak : 10,
    accuracy: typeof s.accuracy === 'number' ? s.accuracy : 85,
    tests_completed: typeof s.tests_completed === 'number' ? s.tests_completed : 14,
    top_percent: typeof s.top_percent === 'number' ? s.top_percent : 10,
  }));

  // Generate CSV
  const csvHeaders = 'roll_no,pin,name,class_name,batch,avatar,phone,streak,accuracy,tests_completed,top_percent';
  const csvRows = formatted.map(s => 
    `"${s.roll_no}","${s.pin}","${s.name.replace(/"/g, '""')}","${s.class_name}","${s.batch}","${s.avatar}","${s.phone}",${s.streak},${s.accuracy},${s.tests_completed},${s.top_percent}`
  );
  const csvData = [csvHeaders, ...csvRows].join('\n');

  // Generate SQL with companion records
  const sqlLines = [
    '--',
    '-- Supabase PostgreSQL Seed: Students & Companion Records',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total: ${formatted.length}`,
    '--',
    'BEGIN;',
    ''
  ];

  for (const s of formatted) {
    const escName = s.name.replace(/'/g, "''");
    const escClass = s.class_name.replace(/'/g, "''");
    const escBatch = s.batch.replace(/'/g, "''");

    sqlLines.push(`-- Student: ${s.name} (${s.roll_no})`);
    sqlLines.push(`INSERT INTO students (roll_no, pin, name, class_name, batch, avatar, phone, streak, accuracy, tests_completed, top_percent) VALUES ('${s.roll_no}', '${s.pin}', '${escName}', '${escClass}', '${escBatch}', '${s.avatar}', '${s.phone}', ${s.streak}, ${s.accuracy}, ${s.tests_completed}, ${s.top_percent}) ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, class_name = EXCLUDED.class_name, batch = EXCLUDED.batch, phone = EXCLUDED.phone;`);
    sqlLines.push(`INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history) VALUES ('${s.roll_no}', 90, 45, 50, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;`);
    sqlLines.push(`INSERT INTO fees_records (roll_no, current_due, due_date, days_left, months_paid_on_time, loyalty_months, recent_payments) VALUES ('${s.roll_no}', 1, '25 Sep 2026', 5, 2, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;`);
    sqlLines.push(`INSERT INTO progress_records (roll_no, tests_attended, highest_score, top_percent, total_students, improvement, accuracy, incorrect) VALUES ('${s.roll_no}', 14, 92, 10, 1200, 15, 85, 15) ON CONFLICT (roll_no) DO NOTHING;\n`);
  }
  sqlLines.push('COMMIT;');
  const sqlData = sqlLines.join('\n');

  const outDir = path.join(__dirname, '..', 'export');
  fs.makedirsSync ? fs.makedirsSync(outDir) : fs.mkdirSync(outDir, { recursive: true });

  const sqlPath = path.join(outDir, 'supabase_students_seed.sql');
  const csvPath = path.join(outDir, 'students_export.csv');

  fs.writeFileSync(sqlPath, sqlData, 'utf8');
  fs.writeFileSync(csvPath, csvData, 'utf8');

  console.log('🎉 Export generated successfully:');
  console.log(` 1. SQL File: ${sqlPath}`);
  console.log(` 2. CSV File: ${csvPath}`);
}

runExport();
