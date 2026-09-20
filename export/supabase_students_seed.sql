--
-- Supabase PostgreSQL Seed: Students & Companion Records
-- Generated: 2026-09-20T04:42:17.675Z
-- Total: 4
--
BEGIN;

-- Student: Arjun S (2024-JEE-0842)
INSERT INTO students (roll_no, pin, name, class_name, batch, avatar, phone, streak, accuracy, tests_completed, top_percent) VALUES ('2024-JEE-0842', '1234', 'Arjun S', 'Class 12', 'JEE Target (Batch A)', 'AS', '9876543210', 10, 85, 14, 10) ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, class_name = EXCLUDED.class_name, batch = EXCLUDED.batch, phone = EXCLUDED.phone;
INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history) VALUES ('2024-JEE-0842', 90, 45, 50, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;
INSERT INTO fees_records (roll_no, current_due, due_date, days_left, months_paid_on_time, loyalty_months, recent_payments) VALUES ('2024-JEE-0842', 1, '25 Sep 2026', 5, 2, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;
INSERT INTO progress_records (roll_no, tests_attended, highest_score, top_percent, total_students, improvement, accuracy, incorrect) VALUES ('2024-JEE-0842', 14, 92, 10, 1200, 15, 85, 15) ON CONFLICT (roll_no) DO NOTHING;

-- Student: Priya Nair (2024-MED-0311)
INSERT INTO students (roll_no, pin, name, class_name, batch, avatar, phone, streak, accuracy, tests_completed, top_percent) VALUES ('2024-MED-0311', '1234', 'Priya Nair', 'Class 12', 'NEET Achievers', 'PN', '9123456780', 10, 85, 14, 10) ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, class_name = EXCLUDED.class_name, batch = EXCLUDED.batch, phone = EXCLUDED.phone;
INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history) VALUES ('2024-MED-0311', 90, 45, 50, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;
INSERT INTO fees_records (roll_no, current_due, due_date, days_left, months_paid_on_time, loyalty_months, recent_payments) VALUES ('2024-MED-0311', 1, '25 Sep 2026', 5, 2, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;
INSERT INTO progress_records (roll_no, tests_attended, highest_score, top_percent, total_students, improvement, accuracy, incorrect) VALUES ('2024-MED-0311', 14, 92, 10, 1200, 15, 85, 15) ON CONFLICT (roll_no) DO NOTHING;

-- Student: Rohan Sharma (2024-CBSE-0199)
INSERT INTO students (roll_no, pin, name, class_name, batch, avatar, phone, streak, accuracy, tests_completed, top_percent) VALUES ('2024-CBSE-0199', '1234', 'Rohan Sharma', 'Class 10', 'Class 10-A (CBSE)', 'RS', '9988776655', 10, 85, 14, 10) ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, class_name = EXCLUDED.class_name, batch = EXCLUDED.batch, phone = EXCLUDED.phone;
INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history) VALUES ('2024-CBSE-0199', 90, 45, 50, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;
INSERT INTO fees_records (roll_no, current_due, due_date, days_left, months_paid_on_time, loyalty_months, recent_payments) VALUES ('2024-CBSE-0199', 1, '25 Sep 2026', 5, 2, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;
INSERT INTO progress_records (roll_no, tests_attended, highest_score, top_percent, total_students, improvement, accuracy, incorrect) VALUES ('2024-CBSE-0199', 14, 92, 10, 1200, 15, 85, 15) ON CONFLICT (roll_no) DO NOTHING;

-- Student: Sneha Gupta (2024-CBSE-0245)
INSERT INTO students (roll_no, pin, name, class_name, batch, avatar, phone, streak, accuracy, tests_completed, top_percent) VALUES ('2024-CBSE-0245', '1234', 'Sneha Gupta', 'Class 10', 'Class 10-A (CBSE)', 'SG', '9811223344', 10, 85, 14, 10) ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, class_name = EXCLUDED.class_name, batch = EXCLUDED.batch, phone = EXCLUDED.phone;
INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history) VALUES ('2024-CBSE-0245', 90, 45, 50, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;
INSERT INTO fees_records (roll_no, current_due, due_date, days_left, months_paid_on_time, loyalty_months, recent_payments) VALUES ('2024-CBSE-0245', 1, '25 Sep 2026', 5, 2, '[]'::jsonb, '[]'::jsonb) ON CONFLICT (roll_no) DO NOTHING;
INSERT INTO progress_records (roll_no, tests_attended, highest_score, top_percent, total_students, improvement, accuracy, incorrect) VALUES ('2024-CBSE-0245', 14, 92, 10, 1200, 15, 85, 15) ON CONFLICT (roll_no) DO NOTHING;

COMMIT;