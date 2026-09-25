-- ==============================================================================
-- EduHome Student Seed Script (49 Students from CSV + Demo Arjun S)
-- Run this directly in Supabase Dashboard -> SQL Editor -> Run
-- Safe to run multiple times (uses ON CONFLICT)
-- ==============================================================================

-- 1. Insert / Update Students
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

-- 2. Initialize Attendance Records for All Students
INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history)
SELECT roll_no, 90, 45, 50, '[]'::jsonb, '[]'::jsonb
FROM students
WHERE roll_no != '2024-JEE-0842'
ON CONFLICT (roll_no) DO NOTHING;

-- 3. Seed Verified Fees Records for All Students
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 4000;
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS subjects TEXT DEFAULT 'Physics, Chemistry, Maths';
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'due';
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS joining_date TEXT;
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS school TEXT;

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

-- 4. Initialize Progress Records for All Students
INSERT INTO progress_records (roll_no, tests_attended, highest_score, top_percent, total_students, improvement, accuracy, incorrect)
SELECT roll_no, 12, 90, 10, 1200, 14, 85, 15
FROM students
WHERE roll_no != '2024-JEE-0842'
ON CONFLICT (roll_no) DO NOTHING;
