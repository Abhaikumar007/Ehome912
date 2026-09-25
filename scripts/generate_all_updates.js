const fs = require('fs');
const path = require('path');

const processed = JSON.parse(fs.readFileSync(path.join(__dirname, 'processed_students.json'), 'utf8'));

// 1. UPDATE studentsRoster.ts
const studentRosterPath = path.join(__dirname, '..', 'lib', 'studentsRoster.ts');
let rosterContent = fs.readFileSync(studentRosterPath, 'utf8');

// Build RAW_STUDENTS entries
const rawStudentsEntries = processed.filter(s => s.roll_no !== '2024-JEE-0842').map((s, idx) => {
  const avatar = s.name.slice(0, 2).toUpperCase();
  const pin = '1234';
  const cleanPhone = s.phone.replace(/^91/, '').slice(-10);
  const streak = 7 + (idx % 8);
  const accuracy = 78 + (idx % 16);
  const testsCompleted = 8 + (idx % 10);
  const topPercent = 4 + (idx % 17);

  return `  { rollNo: '${s.roll_no}', pin: '${pin}', name: '${s.name.replace(/'/g, "\\'")}', class: '${s.class_name}', batch: '${s.class_name}', avatar: '${avatar}', phone: '${cleanPhone}', school: '${s.school.replace(/'/g, "\\'")}', streak: ${streak}, accuracy: ${accuracy}, testsCompleted: ${testsCompleted}, topPercent: ${topPercent}, monthlyFee: ${s.monthly_fee}, currentDue: ${s.monthly_fee}, dueDate: '${s.due_date}', daysLeft: ${s.days_left}, joiningDate: '${s.joining_date_formatted}', joiningDateIso: '${s.joining_date_iso}', monthsPaidOnTime: 2, subjects: '${s.subjects.replace(/'/g, "\\'")}' },`;
}).join('\n');

const newRosterFile = `export interface EduStudent {
  rollNo: string;
  pin: string;
  name: string;
  class: string;
  batch: string;
  avatar: string;
  phone: string;
  school?: string;
  streak: number;
  accuracy: number;
  testsCompleted: number;
  topPercent: number;
  recentScore?: string;
  avatarColor?: string;
  monthlyFee: number;
  currentDue: number;
  dueDate: string;
  daysLeft: number;
  joiningDate?: string;
  joiningDateIso?: string;
  monthsPaidOnTime: number;
  subjects: string;
}

const AVATAR_COLORS = ['#0284C7', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

const RAW_STUDENTS: Omit<EduStudent, 'recentScore' | 'avatarColor'>[] = [
${rawStudentsEntries}
];

export const EDUSYNC_STUDENTS: EduStudent[] = RAW_STUDENTS.map((s, idx) => ({
  ...s,
  recentScore: \`\${s.accuracy}%\`,
  avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
}));

export const EDUSYNC_FEES: Record<string, {
  name: string;
  school?: string;
  monthlyFee: number;
  currentDue: number;
  dueDate: string;
  daysLeft: number;
  joiningDate: string;
  joiningDateIso: string;
  monthsPaidOnTime: number;
  subjects: string;
}> = {
  '2024-JEE-0842': {
    name: 'Arjun S',
    school: 'EduHome Campus',
    monthlyFee: 4000,
    currentDue: 4000,
    dueDate: '${processed[0].due_date}',
    daysLeft: ${processed[0].days_left},
    joiningDate: '${processed[0].joining_date_formatted}',
    joiningDateIso: '${processed[0].joining_date_iso}',
    monthsPaidOnTime: 2,
    subjects: 'Physics, Chemistry, Maths',
  },
  ...RAW_STUDENTS.reduce((acc, s) => {
    acc[s.rollNo] = {
      name: s.name,
      school: s.school,
      monthlyFee: s.monthlyFee,
      currentDue: s.currentDue,
      dueDate: s.dueDate,
      daysLeft: s.daysLeft,
      joiningDate: s.joiningDate || '',
      joiningDateIso: s.joiningDateIso || '',
      monthsPaidOnTime: s.monthsPaidOnTime,
      subjects: s.subjects,
    };
    return acc;
  }, {} as Record<string, any>),
};
`;

fs.writeFileSync(studentRosterPath, newRosterFile, 'utf8');
console.log('Updated lib/studentsRoster.ts');

// 2. BUILD SQL VALUES FOR seed_all_fees.sql
const feeSqlValues = processed.map((s, idx) => {
  const isPaid = false;
  const status = 'due';
  const comma = idx === processed.length - 1 ? ';' : ',';
  return `  ('${s.roll_no}', ${s.monthly_fee}, ${s.monthly_fee}, '${s.due_date}', ${s.days_left}, '${s.joining_date_formatted}', '${s.school.replace(/'/g, "''")}', 2, '${s.subjects.replace(/'/g, "''")}', '${status}', '[]'::jsonb, '[]'::jsonb)${comma}`;
}).join('\n');

const seedAllFeesContent = `-- ==============================================================================
-- EduHome: Seed Real Center Fees & Joining Dates for All 50 Students
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. Ensure new columns exist on fees_records table
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 4000;
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS subjects TEXT DEFAULT 'Physics, Chemistry, Maths';
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'due';
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS joining_date TEXT;
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS school TEXT;

-- 2. Insert or update all 50 student fees records with their exact joining date & recurring due date
INSERT INTO fees_records (roll_no, monthly_fee, current_due, due_date, days_left, joining_date, school, months_paid_on_time, subjects, status, loyalty_months, recent_payments)
VALUES 
${feeSqlValues}
ON CONFLICT (roll_no) DO UPDATE SET
  monthly_fee = EXCLUDED.monthly_fee,
  current_due = EXCLUDED.current_due,
  due_date = EXCLUDED.due_date,
  days_left = EXCLUDED.days_left,
  joining_date = EXCLUDED.joining_date,
  school = EXCLUDED.school,
  subjects = EXCLUDED.subjects,
  months_paid_on_time = EXCLUDED.months_paid_on_time,
  status = EXCLUDED.status;

-- Verify count
SELECT count(*) as total_fees_seeded FROM fees_records;
`;

fs.writeFileSync(path.join(__dirname, '..', 'seed_all_fees.sql'), seedAllFeesContent, 'utf8');
console.log('Updated seed_all_fees.sql');

// 3. UPDATE supabase_schema.sql
const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Update students table definition to have school and joining_date
if (!schemaContent.includes('school TEXT DEFAULT')) {
  schemaContent = schemaContent.replace(
    `  top_percent INT DEFAULT 8,`,
    `  top_percent INT DEFAULT 8,\n  school TEXT DEFAULT 'EduHome Campus',\n  joining_date TEXT DEFAULT '15 Jan 2026',`
  );
}

// Update fees_records table definition to have joining_date and school
if (!schemaContent.includes('joining_date TEXT')) {
  schemaContent = schemaContent.replace(
    `  subjects TEXT DEFAULT 'Physics, Chemistry, Maths',`,
    `  subjects TEXT DEFAULT 'Physics, Chemistry, Maths',\n  joining_date TEXT DEFAULT '15 Jan 2026',\n  school TEXT DEFAULT 'EduHome Campus',`
  );
}

// Replace the 4.6 Seed Detailed Fees Records section in supabase_schema.sql
const startMarker = '-- 4.6 Seed Detailed Fees Records for all 50 Students (Verified Center Export)';
if (schemaContent.includes(startMarker)) {
  const afterStart = schemaContent.slice(schemaContent.indexOf(startMarker));
  const nextSectionIndex = afterStart.indexOf('\n-- 4.8');
  const replaceTarget = nextSectionIndex !== -1 ? afterStart.slice(0, nextSectionIndex) : afterStart;
  
  const newSection = `${startMarker}
INSERT INTO fees_records (roll_no, monthly_fee, current_due, due_date, days_left, joining_date, school, months_paid_on_time, subjects, status, loyalty_months, recent_payments)
VALUES
${feeSqlValues}
ON CONFLICT (roll_no) DO UPDATE SET
  monthly_fee = EXCLUDED.monthly_fee,
  current_due = EXCLUDED.current_due,
  due_date = EXCLUDED.due_date,
  days_left = EXCLUDED.days_left,
  joining_date = EXCLUDED.joining_date,
  school = EXCLUDED.school,
  subjects = EXCLUDED.subjects,
  months_paid_on_time = EXCLUDED.months_paid_on_time,
  status = EXCLUDED.status;
`;
  schemaContent = schemaContent.replace(replaceTarget, newSection);
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log('Updated supabase_schema.sql');
}

// 4. UPDATE seed_all_students.sql
const seedStudentsPath = path.join(__dirname, '..', 'seed_all_students.sql');
let seedStudentsContent = fs.readFileSync(seedStudentsPath, 'utf8');
const feeSectionMarker = '-- 3. SEED INDIVIDUAL FEES RECORDS FOR ALL 50 STUDENTS';
if (seedStudentsContent.includes(feeSectionMarker)) {
  const afterMarker = seedStudentsContent.slice(seedStudentsContent.indexOf(feeSectionMarker));
  const commitIndex = afterMarker.indexOf('COMMIT;');
  const replaceTarget = commitIndex !== -1 ? afterMarker.slice(0, commitIndex) : afterMarker;
  
  const newSection = `${feeSectionMarker}
INSERT INTO fees_records (roll_no, monthly_fee, current_due, due_date, days_left, joining_date, school, months_paid_on_time, subjects, status, loyalty_months, recent_payments)
VALUES
${feeSqlValues}
ON CONFLICT (roll_no) DO UPDATE SET
  monthly_fee = EXCLUDED.monthly_fee,
  current_due = EXCLUDED.current_due,
  due_date = EXCLUDED.due_date,
  days_left = EXCLUDED.days_left,
  joining_date = EXCLUDED.joining_date,
  school = EXCLUDED.school,
  subjects = EXCLUDED.subjects,
  months_paid_on_time = EXCLUDED.months_paid_on_time,
  status = EXCLUDED.status;

`;
  seedStudentsContent = seedStudentsContent.replace(replaceTarget, newSection);
  fs.writeFileSync(seedStudentsPath, seedStudentsContent, 'utf8');
  console.log('Updated seed_all_students.sql');
}
