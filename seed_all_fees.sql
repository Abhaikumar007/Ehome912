-- ==============================================================================
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

-- Verify count
SELECT count(*) as total_fees_seeded FROM fees_records;
