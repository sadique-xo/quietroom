-- ============================================================
-- ENABLE MULTIPLE PHOTOS PER DAY (UP TO 10)
-- ============================================================
-- This script removes the unique constraint and adds daily entry limit validation
-- Run this script as postgres role in Supabase SQL Editor

SELECT 'Starting multiple photos per day migration...' as status;

-- STEP 1: Remove the unique constraint that limits one entry per day
DO $$
BEGIN
  -- Check if the unique constraint exists and remove it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'entries' 
    AND constraint_name = 'entries_user_id_date_key'
    AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE entries DROP CONSTRAINT entries_user_id_date_key;
    RAISE NOTICE 'Removed unique constraint (user_id, date) - now allowing multiple entries per day';
  ELSE
    RAISE NOTICE 'Unique constraint (user_id, date) was not found - may already be removed';
  END IF;
END $$;

-- STEP 2: Add a function to count daily entries for a user
CREATE OR REPLACE FUNCTION public.count_daily_entries(p_user_id TEXT, p_date TEXT)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM entries 
  WHERE user_id = p_user_id 
  AND date = p_date;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION public.count_daily_entries(TEXT, TEXT) TO authenticated;

-- STEP 3: Add a function to validate daily entry limit (max 10)
CREATE OR REPLACE FUNCTION public.validate_daily_entry_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Count existing entries for this user and date
  SELECT count_daily_entries(NEW.user_id, NEW.date) INTO current_count;
  
  -- Allow updates to existing entries
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;
  
  -- For inserts, check if we're at the limit
  IF current_count >= 10 THEN
    RAISE EXCEPTION 'Daily entry limit reached. You can add up to 10 photos per day.'
      USING ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$;

-- STEP 4: Create trigger to enforce daily limit
DROP TRIGGER IF EXISTS enforce_daily_entry_limit ON entries;
CREATE TRIGGER enforce_daily_entry_limit
  BEFORE INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION validate_daily_entry_limit();

-- STEP 5: Add entry order column for sorting multiple entries per day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' 
    AND column_name = 'entry_order'
  ) THEN
    ALTER TABLE entries ADD COLUMN entry_order INTEGER DEFAULT 1;
    RAISE NOTICE 'Added entry_order column for sorting multiple daily entries';
  ELSE
    RAISE NOTICE 'entry_order column already exists';
  END IF;
END $$;

-- STEP 6: Update existing entries to have entry_order = 1
UPDATE entries SET entry_order = 1 WHERE entry_order IS NULL;

-- STEP 7: Create indexes for better performance with multiple entries
CREATE INDEX IF NOT EXISTS idx_entries_user_date_order ON entries(user_id, date, entry_order);
CREATE INDEX IF NOT EXISTS idx_entries_user_date_timestamp ON entries(user_id, date, timestamp);

-- STEP 8: Update RLS policies to work with multiple entries
-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- Recreate policies for multiple entries
CREATE POLICY "Users can view their own entries" ON entries
  FOR SELECT
  USING (user_id = clerk_user_id());

CREATE POLICY "Users can insert their own entries" ON entries
  FOR INSERT
  WITH CHECK (user_id = clerk_user_id());

CREATE POLICY "Users can update their own entries" ON entries
  FOR UPDATE
  USING (user_id = clerk_user_id())
  WITH CHECK (user_id = clerk_user_id());

CREATE POLICY "Users can delete their own entries" ON entries
  FOR DELETE
  USING (user_id = clerk_user_id());

-- Verify the changes
SELECT 'Migration completed successfully! ✅' as result;
SELECT 'Users can now add up to 10 photos per day' as new_capability;

-- Show current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND table_schema = 'public'
ORDER BY ordinal_position; 