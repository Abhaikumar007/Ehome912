-- ==============================================================================
-- EduHome Tuition Management System - Supabase Schema & Seed Data
-- Run this complete script in the Supabase SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. DROP EXISTING TABLES IF NEEDED
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS study_materials CASCADE;
DROP TABLE IF EXISTS progress_records CASCADE;
DROP TABLE IF EXISTS fees_records CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;

-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- 2.1 Students Table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_no TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  name TEXT NOT NULL,
  class_name TEXT NOT NULL DEFAULT 'Class 12',
  batch TEXT NOT NULL DEFAULT 'JEE Target (Batch A)',
  avatar TEXT DEFAULT 'AS',
  phone TEXT DEFAULT '9876543210',
  streak INT DEFAULT 12,
  accuracy INT DEFAULT 86,
  tests_completed INT DEFAULT 16,
  top_percent INT DEFAULT 8,
  school TEXT DEFAULT 'EduHome Campus',
  joining_date TEXT DEFAULT '15 Jan 2026',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Teachers / Faculty Table
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL DEFAULT '123456',
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Super Admin & Academic Head',
  subjects TEXT DEFAULT 'Physics & Chemistry',
  avatar TEXT DEFAULT 'AK',
  phone TEXT DEFAULT '9123456780',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Classes / Schedule Table
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_no TEXT NOT NULL,
  class_grade TEXT DEFAULT 'Class 12',
  subject TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming', -- 'present', 'absent', 'upcoming'
  published BOOLEAN DEFAULT true,
  class_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 Announcements (Community Section) Table
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'megaphone',
  icon_bg TEXT DEFAULT '#FEF3F2',
  icon_color TEXT DEFAULT '#F04438',
  time_label TEXT DEFAULT 'Just now',
  important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 Attendance Records Table
CREATE TABLE attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_no TEXT UNIQUE NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
  overall INT DEFAULT 92,
  attended INT DEFAULT 46,
  total INT DEFAULT 50,
  today_subjects JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Fees Records Table
CREATE TABLE fees_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_no TEXT UNIQUE NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
  monthly_fee NUMERIC DEFAULT 4000,
  current_due NUMERIC DEFAULT 4000,
  due_date TEXT DEFAULT '25 Sep 2026',
  days_left INT DEFAULT 5,
  months_paid_on_time INT DEFAULT 2,
  subjects TEXT DEFAULT 'Physics, Chemistry, Maths',
  status TEXT DEFAULT 'due',
  loyalty_months JSONB DEFAULT '[]'::jsonb,
  recent_payments JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 Progress Records Table
CREATE TABLE progress_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_no TEXT UNIQUE NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
  tests_attended INT DEFAULT 18,
  highest_score INT DEFAULT 96,
  top_percent INT DEFAULT 8,
  total_students INT DEFAULT 1200,
  improvement INT DEFAULT 16,
  accuracy INT DEFAULT 86,
  incorrect INT DEFAULT 14,
  chart_labels JSONB DEFAULT '["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"]'::jsonb,
  your_scores JSONB DEFAULT '[48, 62, 68, 72, 78, 82, 88, 92]'::jsonb,
  avg_scores JSONB DEFAULT '[50, 50, 52, 55, 58, 60, 62, 65]'::jsonb,
  common_mistakes JSONB DEFAULT '[]'::jsonb,
  practice JSONB DEFAULT '{"attended": 18, "completed": 14, "pending": 4, "highest": 96}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.8 Study Materials Table
CREATE TABLE study_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tag TEXT NOT NULL,
  tag_color TEXT DEFAULT '#EBF3FF',
  pages INT DEFAULT 10,
  size TEXT DEFAULT '3.5 MB',
  icon TEXT DEFAULT 'flash-outline',
  icon_bg TEXT DEFAULT '#EBF3FF',
  icon_color TEXT DEFAULT '#1A56DB',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.9 Notifications Table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_no TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  time_label TEXT DEFAULT 'Just now',
  is_read BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.10 Subjects Master Table
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Science', -- 'Science', 'Maths', 'Technology', 'General'
  classes TEXT[] DEFAULT '{"6", "7", "8", "9", "10", "11", "12"}',
  faculty_id TEXT,
  faculty_name TEXT,
  monthly_fee_unit NUMERIC DEFAULT 1000,
  icon TEXT DEFAULT 'book-outline',
  color TEXT DEFAULT '#1A56DB',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. ENABLE ROW LEVEL SECURITY & PUBLIC ANON ACCESS POLICIES
-- ==============================================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Allow anon full access for all tables for app usage
CREATE POLICY "Public students access" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public teachers access" ON teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public classes access" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public announcements access" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public attendance_records access" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public fees_records access" ON fees_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public progress_records access" ON progress_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public study_materials access" ON study_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public notifications access" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public subjects access" ON subjects FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. SEED SAMPLE DATA
-- ==============================================================================

-- 4.1 Seed Students (EduHome 2026 Batch)
INSERT INTO students (roll_no, pin, name, class_name, batch, avatar, phone, streak, accuracy, tests_completed, top_percent)
VALUES
('2024-JEE-0842', '1234', 'Arjun S', 'Class 12', 'JEE Target (Batch A)', 'AS', '9876543210', 12, 86, 16, 8),
('EDU-2026-001', '1234', 'Amaljith', 'Class 10', 'Class 10', 'AM', '9895423986', 10, 84, 12, 10),
('EDU-2026-002', '1234', 'Karthik', 'Class 11', 'Class 11', 'KA', '9961796378', 8, 80, 11, 15),
('EDU-2026-003', '1234', 'Sivanya', 'Class 11', 'Class 11', 'SI', '8848157457', 12, 88, 14, 8),
('EDU-2026-004', '1234', 'Abhinanda', 'Class 9', 'Class 9', 'AB', '9895446203', 9, 82, 10, 12),
('EDU-2026-005', '1234', 'Krishnaveni', 'Class 8', 'Class 8', 'KR', '9544443618', 11, 85, 12, 10),
('EDU-2026-006', '1234', 'Meerakrishnan', 'Class 7', 'Class 7', 'ME', '8089939249', 7, 78, 8, 20),
('EDU-2026-007', '1234', 'Niranjana', 'Class 12', 'Class 12', 'NI', '7025747029', 14, 91, 16, 5),
('EDU-2026-008', '1234', 'Vaiga', 'Class 8', 'Class 8', 'VA', '9446614427', 9, 83, 10, 14),
('EDU-2026-009', '1234', 'Sari N Raj', 'Class 12', 'Class 12', 'SR', '9746865309', 13, 89, 15, 7),
('EDU-2026-010', '1234', 'Aromal', 'Class 8', 'Class 8', 'AR', '9745777289', 8, 80, 9, 16),
('EDU-2026-011', '1234', 'Vaishnavi', 'Class 8', 'Class 8', 'VA', '7558859373', 10, 84, 11, 12),
('EDU-2026-012', '1234', 'Avani', 'Class 9', 'Class 9', 'AV', '8921856088', 11, 86, 12, 10),
('EDU-2026-013', '1234', 'Nakshathra', 'Class 9', 'Class 9', 'NA', '9633076463', 12, 87, 13, 9),
('EDU-2026-014', '1234', 'Asna', 'Class 10', 'Class 10', 'AS', '9446253365', 10, 82, 11, 15),
('EDU-2026-015', '1234', 'Sivani', 'Class 12', 'Class 12', 'SI', '8590976055', 15, 93, 17, 4),
('EDU-2026-016', '1234', 'Nandana', 'Class 12', 'Class 12', 'NA', '7736592931', 12, 88, 14, 8),
('EDU-2026-017', '1234', 'Karun', 'Class 12', 'Class 12', 'KA', '8089978209', 11, 85, 13, 11),
('EDU-2026-018', '1234', 'Aadidev', 'Class 12', 'Class 12', 'AA', '9446258069', 13, 90, 15, 6),
('EDU-2026-019', '1234', 'Abhinand', 'Class 12', 'Class 12', 'AB', '7012451748', 9, 81, 10, 18),
('EDU-2026-020', '1234', 'Poojitha', 'Class 7', 'Class 7', 'PO', '8157933242', 8, 80, 8, 20),
('EDU-2026-021', '1234', 'Irfan', 'Class 12', 'Class 12', 'IR', '9567187275', 10, 84, 12, 12),
('EDU-2026-022', '1234', 'Karthik Nath', 'Class 9', 'Class 9', 'KN', '9847270637', 12, 88, 13, 8),
('EDU-2026-023', '1234', 'Vishwathej', 'Class 12', 'Class 12', 'VI', '9961803001', 14, 92, 16, 5),
('EDU-2026-024', '1234', 'Ganga', 'Class 10', 'Class 10', 'GA', '8547495160', 10, 83, 11, 14),
('EDU-2026-025', '1234', 'Adithya Krishnan', 'Class 9', 'Class 9', 'AK', '8129754629', 11, 85, 12, 10),
('EDU-2026-026', '1234', 'Alecia Mathew', 'Class 10', 'Class 10', 'AM', '9650974040', 13, 89, 14, 7),
('EDU-2026-027', '1234', 'Krishnanandh', 'Class 9', 'Class 9', 'KR', '9495195776', 9, 81, 10, 15),
('EDU-2026-028', '1234', 'Ashwanath', 'Class 8', 'Class 8', 'AS', '9544477117', 10, 82, 11, 14),
('EDU-2026-029', '1234', 'Niranjan', 'Class 12', 'Class 12', 'NI', '9567026060', 12, 87, 14, 9),
('EDU-2026-030', '1234', 'Lekshmipriya', 'Class 9', 'Class 9', 'LE', '8921477592', 11, 86, 12, 10),
('EDU-2026-031', '1234', 'Achyuth', 'Class 9', 'Class 9', 'AC', '9562902227', 8, 80, 9, 18),
('EDU-2026-032', '1234', 'Hiba', 'Class 11', 'Class 11', 'HI', '9072435565', 12, 88, 14, 8),
('EDU-2026-033', '1234', 'Gowtham', 'Class 9', 'Class 9', 'GO', '9447063343', 9, 83, 10, 14),
('EDU-2026-034', '1234', 'Vyshnavi', 'Class 12', 'Class 12', 'VY', '9562820950', 13, 90, 15, 6),
('EDU-2026-035', '1234', 'Gopika', 'Class 8', 'Class 8', 'GO', '9947540424', 10, 84, 11, 12),
('EDU-2026-036', '1234', 'Cristine', 'Class 10', 'Class 10', 'CR', '9446118812', 11, 85, 12, 11),
('EDU-2026-037', '1234', 'Roshan', 'Class 12', 'Class 12', 'RO', '8921159422', 12, 87, 13, 9),
('EDU-2026-038', '1234', 'Fathima', 'Class 12', 'Class 12', 'FA', '7034492498', 14, 91, 16, 5),
('EDU-2026-039', '1234', 'Hajira', 'Class 12', 'Class 12', 'HA', '9747841626', 10, 83, 12, 14),
('EDU-2026-040', '1234', 'Keerthana', 'Class 11', 'Class 11', 'KE', '9656839908', 12, 88, 14, 8),
('EDU-2026-041', '1234', 'Karthika', 'Class 12', 'Class 12', 'KA', '9656839908', 13, 89, 15, 7),
('EDU-2026-042', '1234', 'Dwaitha', 'Class 11', 'Class 11', 'DW', '6238332685', 9, 82, 10, 15),
('EDU-2026-043', '1234', 'Adarsh', 'Class 12', 'Class 12', 'AD', '9544166131', 11, 86, 13, 10),
('EDU-2026-044', '1234', 'Sreedev', 'Class 12', 'Class 12', 'SR', '9744795650', 14, 92, 16, 5),
('EDU-2026-045', '1234', 'Dharmic Krishna', 'Class 10', 'Class 10', 'DK', '8547534316', 10, 84, 11, 12),
('EDU-2026-046', '1234', 'Amrutha', 'Class 12', 'Class 12', 'AM', '6282355118', 12, 88, 14, 8),
('EDU-2026-047', '1234', 'Punya R', 'Class 11', 'Class 11', 'PU', '8593078422', 11, 85, 12, 11),
('EDU-2026-048', '1234', 'Sreehari', 'Class 10', 'Class 10', 'SR', '9539122202', 13, 90, 15, 6),
('EDU-2026-049', '1234', 'Sivananda', 'Class 6', 'Class 6', 'SI', '5555555555', 8, 80, 8, 20)
ON CONFLICT (roll_no) DO UPDATE
SET 
  name = EXCLUDED.name,
  class_name = EXCLUDED.class_name,
  batch = EXCLUDED.batch,
  avatar = EXCLUDED.avatar,
  phone = EXCLUDED.phone,
  pin = EXCLUDED.pin;

-- 4.2 Seed Teachers
INSERT INTO teachers (faculty_id, pin, name, role, subjects, avatar, phone)
VALUES
('FAC-2024-042', '123456', 'Mr. Abhai Kumar', 'Super Admin & Academic Head', 'Physics & Chemistry', 'AK', '9123456780');

-- 4.3 Seed Today's Classes for Arjun
INSERT INTO classes (roll_no, class_grade, subject, time, status, published, class_date)
VALUES
('2024-JEE-0842', 'Class 12', 'Physics',   '5:00 PM – 6:00 PM', 'present',  true, CURRENT_DATE),
('2024-JEE-0842', 'Class 12', 'Chemistry', '6:00 PM – 7:00 PM', 'absent',   true, CURRENT_DATE),
('2024-JEE-0842', 'Class 12', 'Maths',     '7:00 PM – 8:00 PM', 'upcoming', true, CURRENT_DATE),
('2024-JEE-0842', 'Class 12', 'Biology',   '8:00 PM – 9:00 PM', 'upcoming', true, CURRENT_DATE);

-- 4.4 Seed Community Announcements
INSERT INTO announcements (title, description, icon, icon_bg, icon_color, time_label, important)
VALUES
('Parent-Teacher Meeting on 20th Sep', 'All students must inform their parents. Timing: 10 AM – 1 PM.', 'megaphone', '#FEF3F2', '#F04438', '2 hours ago', true),
('Weekly Test #9 – This Saturday', 'Syllabus: Physics Ch-10, Chemistry Ch-1, Maths Ch-4.', 'calendar', '#EBF3FF', '#1A56DB', '5 hours ago', false),
('🎉 Arjun S scored Top 8% this month!', 'Congratulations! Keep up the excellent performance.', 'trophy', '#FFFAEB', '#F79009', 'Yesterday', false);

-- 4.5 Seed Attendance Record
INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history)
VALUES (
  '2024-JEE-0842',
  92,
  46,
  50,
  '[
    {"id": "1", "subject": "Physics", "time": "09:00 AM – 10:30 AM", "icon": "flash", "status": "present"},
    {"id": "2", "subject": "Mathematics", "time": "11:00 AM – 12:30 PM", "icon": "book", "status": "present"},
    {"id": "3", "subject": "Chemistry", "time": "02:00 PM – 03:30 PM", "icon": "flask", "status": "absent"},
    {"id": "4", "subject": "Biology", "time": "04:00 PM – 05:30 PM", "icon": "leaf", "status": "present"}
  ]'::jsonb,
  '[
    {"date": "Tue, 08 Sep 2026", "subjects": "Physics, Math, Chemistry, Biology", "score": "4/4", "status": "full"},
    {"date": "Mon, 07 Sep 2026", "subjects": "Physics, Math, Biology", "score": "3/3", "status": "full"},
    {"date": "Sat, 05 Sep 2026", "subjects": "Chemistry, Biology", "score": "1/2", "status": "partial"},
    {"date": "Fri, 04 Sep 2026", "subjects": "Physics, Math, Chemistry, Biology", "score": "4/4", "status": "full"}
  ]'::jsonb
);

-- 4.6 Seed Fees Record
INSERT INTO fees_records (roll_no, current_due, due_date, days_left, months_paid_on_time, loyalty_months, recent_payments)
VALUES (
  '2024-JEE-0842',
  1,
  '25 Sep 2026',
  6,
  2,
  '[
    {"label": "Month 1", "earned": true},
    {"label": "Month 2", "earned": true},
    {"label": "Month 3", "earned": false, "comingSoon": true}
  ]'::jsonb,
  '[
    {"month": "SEP", "fullMonth": "September 2026", "paidOn": "10 Sep 2026, 08:12 PM", "amount": 6000, "onTime": true},
    {"month": "AUG", "fullMonth": "August 2026", "paidOn": "08 Aug 2026, 07:03 PM", "amount": 6000, "onTime": true},
    {"month": "JUL", "fullMonth": "July 2026", "paidOn": "09 Jul 2026, 05:56 PM", "amount": 6000, "onTime": true}
  ]'::jsonb
);

-- 4.7 Seed Progress Record
INSERT INTO progress_records (
  roll_no, tests_attended, highest_score, top_percent, total_students, improvement,
  accuracy, incorrect, chart_labels, your_scores, avg_scores, common_mistakes, practice
)
VALUES (
  '2024-JEE-0842',
  18,
  96,
  8,
  1200,
  16,
  86,
  14,
  '["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"]'::jsonb,
  '[48, 62, 68, 72, 78, 82, 88, 92]'::jsonb,
  '[50, 50, 52, 55, 58, 60, 62, 65]'::jsonb,
  '[
    {"rank": 1, "text": "Sign errors in equations", "count": 24},
    {"rank": 2, "text": "Unit conversion mistakes", "count": 18},
    {"rank": 3, "text": "Diagram-based questions", "count": 15},
    {"rank": 4, "text": "Formula recall errors", "count": 12}
  ]'::jsonb,
  '{"attended": 18, "completed": 14, "pending": 4, "highest": 96}'::jsonb
);

-- 4.7.1 Companion Default Records for All Seeded Students
INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history)
SELECT roll_no, 90, 45, 50, '[]'::jsonb, '[]'::jsonb
FROM students
WHERE roll_no != '2024-JEE-0842'
ON CONFLICT (roll_no) DO NOTHING;

-- 4.6 Seed Detailed Fees Records for all 50 Students (Verified Center Export)
INSERT INTO fees_records (roll_no, monthly_fee, current_due, due_date, days_left, joining_date, school, months_paid_on_time, subjects, status, loyalty_months, recent_payments)
VALUES
  ('2024-JEE-0842', 4000, 4000, '15 Sep 2026', -5, '15 Jan 2026', 'EduHome Campus', 2, 'Physics, Chemistry, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-001', 3000, 3000, '18 Sep 2026', -2, '18 Apr 2026', 'Vendar', 2, 'Physics, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-002', 2500, 2500, '06 Sep 2026', -14, '06 Jul 2026', 'Boys', 2, 'Physics, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-003', 4500, 4500, '01 Sep 2026', -19, '01 May 2026', 'Boys', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-004', 2000, 2000, '01 Sep 2026', -19, '01 May 2026', 'Vendar', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-005', 750, 750, '04 Sep 2026', -16, '04 May 2026', 'Puthoor', 2, 'Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-006', 600, 600, '23 Sep 2026', 3, '23 May 2026', 'Marthoma', 2, 'Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-007', 1000, 1000, '23 Sep 2026', 3, '23 May 2026', 'Divine', 2, 'Physics', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-008', 1500, 1500, '23 Sep 2026', 3, '23 May 2026', 'Marthoma', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-009', 3500, 3500, '24 Sep 2026', 4, '24 May 2026', 'Boys VHSE', 2, 'Physics, Chemistry, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-010', 1500, 1500, '08 Sep 2026', -12, '08 Apr 2026', 'Technical Scool', 2, 'Physics, Chemistry, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-011', 1500, 1500, '05 Sep 2026', -15, '05 Apr 2026', 'Siddhartha', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-012', 1000, 1000, '06 Sep 2026', -14, '06 Apr 2026', 'Puthoor', 2, 'Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-013', 2000, 2000, '06 Sep 2026', -14, '06 Apr 2026', 'Marthoma', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-014', 2000, 2000, '06 Sep 2026', -14, '06 Apr 2026', 'Marthoma', 2, 'Physics, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-015', 4500, 4500, '13 Sep 2026', -7, '13 Apr 2026', 'Vendar', 2, 'Physics, Chemistry, Maths, Computer Science', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-016', 2500, 2500, '08 Sep 2026', -12, '08 Apr 2026', 'MIBS', 2, 'Physics, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-017', 2500, 2500, '04 Sep 2026', -16, '04 Apr 2026', 'Divine', 2, 'Physics, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-018', 2500, 2500, '04 Sep 2026', -16, '04 Apr 2026', 'Divine', 2, 'Physics, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-019', 3500, 3500, '08 Sep 2026', -12, '08 Apr 2026', 'Vendar', 2, 'Physics, Chemistry, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-020', 600, 600, '04 Sep 2026', -16, '04 May 2026', 'Kottathala UP School', 2, 'Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-021', 3500, 3500, '14 Sep 2026', -6, '14 May 2026', 'Vendar', 2, 'Physics, Maths, Computer Science', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-022', 2000, 2000, '03 Sep 2026', -17, '03 Apr 2026', 'CBSE', 2, 'Physics, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-023', 4500, 4500, '01 Sep 2026', -19, '01 Jan 2026', 'SG', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-024', 3000, 3000, '09 Sep 2026', -11, '09 Mar 2026', 'Divine', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-025', 2000, 2000, '31 Oct 2026', 11, '31 May 2026', 'MGM', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-026', 3000, 3000, '13 Sep 2026', -7, '13 Mar 2026', 'Divine', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-027', 2000, 2000, '08 Sep 2026', -12, '08 Jun 2026', 'Siddhartha', 2, 'Physics, Chemistry, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-028', 1500, 1500, '05 Sep 2026', -15, '05 Apr 2026', 'Puthoor', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-029', 4500, 4500, '28 Sep 2026', 8, '28 Apr 2026', 'SG', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-030', 2000, 2000, '07 Sep 2026', -13, '07 May 2026', 'Marthoma', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-031', 1000, 1000, '06 Sep 2026', -14, '06 Jun 2026', 'Divine', 2, 'Physics', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-032', 2500, 2500, '22 Sep 2026', 2, '22 Jun 2026', 'Brm', 2, 'Physics, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-033', 2000, 2000, '01 Sep 2026', -19, '01 Jul 2026', 'Sree Sree', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-034', 1000, 1000, '11 Sep 2026', -9, '11 Jul 2026', 'Divine', 2, 'Physics', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-035', 1000, 1000, '15 Sep 2026', -5, '15 Jul 2026', 'Divine', 2, 'Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-036', 3000, 3000, '04 Oct 2026', 14, '04 Sep 2026', 'Divine cbse', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-037', 3500, 3500, '10 Oct 2026', 20, '10 Sep 2026', 'Divine', 2, 'Physics, Chemistry, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-038', 2000, 2000, '02 Oct 2026', 12, '02 Sep 2026', 'Svmmhss', 2, 'Physics, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-039', 2500, 2500, '02 Oct 2026', 12, '02 Sep 2026', 'Svmmhss', 2, 'Physics, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-040', 2000, 2000, '08 Sep 2026', -12, '08 Aug 2026', 'Svmmhss', 2, 'Physics, Chemistry', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-041', 2500, 2500, '03 Sep 2026', -17, '03 Aug 2026', 'Vendar', 2, 'Chemistry, Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-042', 3000, 3000, '08 Sep 2026', -12, '08 Aug 2026', 'MGM mylam', 2, 'Physics, Chemistry, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-043', 2000, 2000, '08 Sep 2026', -12, '08 Aug 2026', 'Vendar', 2, 'Physics, Chemistry', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-044', 3000, 3000, '08 Sep 2026', -12, '08 Aug 2026', 'Vendar', 2, 'Physics, Chemistry, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-045', 3000, 3000, '04 Oct 2026', 14, '04 Sep 2026', 'Puthoor', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-046', 1500, 1500, '09 Oct 2026', 19, '09 Sep 2026', 'Puthoor', 2, 'Maths', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-047', 4500, 4500, '11 Oct 2026', 21, '11 Sep 2026', 'EVHS Neduvathoor', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-048', 1000, 1000, '12 Oct 2026', 22, '12 Sep 2026', 'Divine School Puthoor', 2, 'Physics', 'due', '[]'::jsonb, '[]'::jsonb),
  ('EDU-2026-049', 1000, 1000, '01 Sep 2026', -19, '01 Jun 2026', 'MTGHS', 2, 'Physics, Chemistry, Maths, Biology', 'due', '[]'::jsonb, '[]'::jsonb)
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

-- 4.8 Seed Study Materials
INSERT INTO study_materials (subject, chapter, title, description, tag, tag_color, pages, size, icon, icon_bg, icon_color)
VALUES
('Physics', 'Chapter 10', 'Light – Reflection & Refraction', 'Comprehensive board revision with teacher annotations', 'Teacher''s Handwritten Notes', '#EBF3FF', 14, '4.2 MB', 'flash-outline', '#EBF3FF', '#1A56DB'),
('Chemistry', 'Chapter 1', 'Chemical Reactions & Equations', 'Reaction balancing methods & precipitate indicators', 'Revision Summary + Formulas', '#ECFDF3', 8, '2.8 MB', 'flask-outline', '#ECFDF3', '#12B76A'),
('Mathematics', 'Chapter 4', 'Quadratic Equations Masterclass', 'Discriminant analysis, roots nature & word problems', 'Formula Sheet + Solved Examples', '#FFF7ED', 10, '3.1 MB', 'calculator-outline', '#FFF7ED', '#EA580C');

-- 4.9 Seed Notifications
INSERT INTO notifications (roll_no, title, message, time_label, is_read, type)
VALUES
('2024-JEE-0842', 'Class Timetable Updated', 'Tomorrow Physics class rescheduled to 5:30 PM.', '10m ago', false, 'schedule'),
('2024-JEE-0842', 'Fee Reminder', 'Monthly tuition fee of ₹4,000 is due on 15 Sep 2026.', '1h ago', false, 'fee'),
('2024-JEE-0842', 'Test Result Published', 'Weekly Test #8 results are out. You scored 92/100!', '1d ago', true, 'result'),
('2024-JEE-0842', 'New Study Material', 'Notes for Chemistry Chapter 1 uploaded by Mr. Abhai Kumar.', '2d ago', true, 'material');

-- 4.10 Seed Master Subjects
INSERT INTO subjects (code, name, category, classes, faculty_id, faculty_name, monthly_fee_unit, icon, color)
VALUES
  ('PHY',  'Physics',          'Science',    '{"8", "9", "10", "11", "12"}', 'fac-phy',       'Mr. Rajesh Menon',    1000, 'flash-outline',       '#1A56DB'),
  ('CHEM', 'Chemistry',        'Science',    '{"8", "9", "10", "11", "12"}', 'fac-chem',      'Dr. Ramesh Nair',     1000, 'flask-outline',       '#12B76A'),
  ('MATH', 'Mathematics',      'Maths',      '{"6", "7", "8", "9", "10", "11", "12"}', 'fac-math', 'Mr. Arun K. Varma', 1000, 'calculator-outline',  '#F79009'),
  ('BIO',  'Biology',          'Science',    '{"6", "7", "8", "9", "10", "11", "12"}', 'fac-bio-lower', 'Mrs. Deepa Anoop / Dr. Suresh Kumar', 1000, 'leaf-outline', '#0284C7'),
  ('CS',   'Computer Science', 'Technology', '{"11", "12"}',                 'fac-cs',        'Ms. Ananya Sharma',   1000, 'code-slash-outline',  '#7C3AED'),
  ('SCI',  'Science',          'Science',    '{"6", "7", "8", "9"}',         'fac-bio-lower', 'Mrs. Deepa Anoop',    1000, 'planet-outline',      '#059669')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  classes = EXCLUDED.classes,
  faculty_id = EXCLUDED.faculty_id,
  faculty_name = EXCLUDED.faculty_name,
  monthly_fee_unit = EXCLUDED.monthly_fee_unit,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

