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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Teachers / Faculty Table
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL DEFAULT '123456',
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Super Admin',
  subjects TEXT DEFAULT 'Physics & Chemistry',
  avatar TEXT DEFAULT 'RK',
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
  current_due NUMERIC DEFAULT 4000,
  due_date TEXT DEFAULT '15 Sep 2026',
  days_left INT DEFAULT 5,
  months_paid_on_time INT DEFAULT 2,
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

-- ==============================================================================
-- 4. SEED SAMPLE DATA
-- ==============================================================================

-- 4.1 Seed Students
INSERT INTO students (roll_no, pin, name, class_name, batch, avatar, phone, streak, accuracy, tests_completed, top_percent)
VALUES
('2024-JEE-0842', '1234', 'Arjun S', 'Class 12', 'JEE Target (Batch A)', 'AS', '9876543210', 12, 86, 16, 8),
('2024-JEE-0843', '1234', 'Akhil S', 'Class 12', 'JEE Target (Batch A)', 'AK', '9876543211', 10, 81, 14, 12),
('2024-NEET-0105', '1234', 'Ananya R', 'Class 12', 'NEET Achievers', 'AR', '9876543212', 8, 88, 15, 10);

-- 4.2 Seed Teachers
INSERT INTO teachers (faculty_id, pin, name, role, subjects, avatar, phone)
VALUES
('FAC-2024-042', '123456', 'Mr. R Madhusudanan', 'Super Admin', 'Physics & Chemistry', 'RM', '9123456780');

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
('2024-JEE-0842', 'New Study Material', 'Notes for Chemistry Chapter 1 uploaded by Mr. R Madhusudanan.', '2d ago', true, 'material');
