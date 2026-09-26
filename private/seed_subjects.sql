-- ==============================================================================
-- EduHome: Subjects Table & Master Seed SQL for Supabase
-- Run this directly in Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Create Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
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

-- 2. Enable Row Level Security & Public Access
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Public subjects access'
  ) THEN
    CREATE POLICY "Public subjects access" ON subjects FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Seed Master Subjects
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
