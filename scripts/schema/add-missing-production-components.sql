-- Add Missing Production Components
-- Run this as postgres role in Supabase SQL Editor
-- This adds the missing trigger and function from your local setup

-- STEP 1: Create the validation function
-- ====================================

CREATE OR REPLACE FUNCTION validate_daily_entry_limit()
RETURNS TRIGGER AS $$
DECLARE
  entry_count INTEGER;
BEGIN
  -- Count existing entries for this user on this date
  SELECT COUNT(*) INTO entry_count
  FROM public.entries
  WHERE user_id = NEW.user_id 
    AND date = NEW.date;
  
  -- Allow up to 10 entries per day
  IF entry_count >= 10 THEN
    RAISE EXCEPTION 'Daily limit reached. You can add up to 10 photos per day.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Create the trigger
-- =========================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS enforce_daily_entry_limit ON public.entries;

-- Create the trigger
CREATE TRIGGER enforce_daily_entry_limit 
  BEFORE INSERT ON public.entries 
  FOR EACH ROW 
  EXECUTE FUNCTION validate_daily_entry_limit();

-- STEP 3: Create missing indexes
-- =============================

-- Create the missing indexes that exist in your local setup
CREATE INDEX IF NOT EXISTS idx_entries_user_date_order 
ON public.entries USING btree (user_id, date, entry_order);

CREATE INDEX IF NOT EXISTS idx_entries_user_date_timestamp 
ON public.entries USING btree (user_id, date, "timestamp");

-- STEP 4: Verify the setup
-- ========================

-- Check if function exists
SELECT 'Validation function:' as info;
SELECT 
  proname, 
  prorettype::regtype, 
  prokind
FROM pg_proc 
WHERE proname = 'validate_daily_entry_limit'
AND pronamespace = 'public'::regnamespace;

-- Check if trigger exists
SELECT 'Trigger:' as info;
SELECT 
  tgname, 
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname = 'enforce_daily_entry_limit';

-- Check all indexes
SELECT 'All indexes on entries table:' as info;
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'entries' 
AND schemaname = 'public'
ORDER BY indexname;

-- Final verification
DO $$
DECLARE
  function_exists BOOLEAN;
  trigger_exists BOOLEAN;
  index_count INTEGER;
BEGIN
  -- Check function
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'validate_daily_entry_limit'
    AND pronamespace = 'public'::regnamespace
  ) INTO function_exists;
  
  -- Check trigger
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'enforce_daily_entry_limit'
  ) INTO trigger_exists;
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'entries' 
  AND schemaname = 'public';
  
  RAISE NOTICE '=== PRODUCTION COMPONENTS VERIFICATION ===';
  RAISE NOTICE 'Daily limit validation function: %', CASE WHEN function_exists THEN '✅ Created' ELSE '❌ Missing' END;
  RAISE NOTICE 'Daily limit trigger: %', CASE WHEN trigger_exists THEN '✅ Created' ELSE '❌ Missing' END;
  RAISE NOTICE 'Total indexes on entries table: %', index_count;
  
  IF function_exists AND trigger_exists AND index_count >= 5 THEN
    RAISE NOTICE '✅ Production setup now matches local setup!';
  ELSE
    RAISE NOTICE '⚠️ Some components may still be missing.';
  END IF;
END $$;
