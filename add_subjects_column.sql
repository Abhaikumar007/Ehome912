-- ==============================================================================
-- EduHome: Add Native Subjects Columns for Permanent Cross-Portal Sync
-- Run this in Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Add subjects column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS subjects TEXT;

-- 2. Add subjects column to fees_records table
ALTER TABLE fees_records ADD COLUMN IF NOT EXISTS subjects TEXT;

-- 3. Backfill subjects from fees_records JSONB loyalty_months into the native subjects columns
DO $$
DECLARE
  r RECORD;
  enrolled_subs TEXT;
BEGIN
  FOR r IN SELECT roll_no, loyalty_months FROM fees_records LOOP
    IF r.loyalty_months IS NOT NULL THEN
      SELECT string_agg(sub::text, ', ')
      INTO enrolled_subs
      FROM (
        SELECT jsonb_array_elements_text(elem->'__enrolled_subjects') AS sub
        FROM jsonb_array_elements(r.loyalty_months) elem
        WHERE elem ? '__enrolled_subjects'
      ) s;
      
      IF enrolled_subs IS NOT NULL AND enrolled_subs <> '' THEN
        -- Update fees_records
        UPDATE fees_records SET subjects = enrolled_subs WHERE roll_no = r.roll_no;
        -- Update students
        UPDATE students SET subjects = enrolled_subs WHERE roll_no = r.roll_no;
      END IF;
    END IF;
  END LOOP;
END $$;
