-- Fix Production Schema to Match Local
-- Run this as postgres role in Supabase SQL Editor

-- STEP 1: Add missing default value to photo column
-- ================================================

-- Add default value to photo column
ALTER TABLE public.entries 
ALTER COLUMN photo SET DEFAULT ''::text;

-- STEP 2: Make photo-related columns NOT NULL to match local
-- ========================================================

-- Make photo_url NOT NULL
ALTER TABLE public.entries 
ALTER COLUMN photo_url SET NOT NULL;

-- Make photo_filename NOT NULL  
ALTER TABLE public.entries 
ALTER COLUMN photo_filename SET NOT NULL;

-- Make photo_size NOT NULL
ALTER TABLE public.entries 
ALTER COLUMN photo_size SET NOT NULL;

-- Make photo_format NOT NULL
ALTER TABLE public.entries 
ALTER COLUMN photo_format SET NOT NULL;

-- STEP 3: Remove the unique constraint to match local
-- ==================================================

-- Drop the unique constraint that exists in production but not local
ALTER TABLE public.entries 
DROP CONSTRAINT IF EXISTS entries_user_id_date_entry_order_key;

-- STEP 4: Verify the changes
-- =========================

-- Show final table structure
SELECT 'Final table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show constraints
SELECT 'Table constraints:' as info;
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'entries' 
AND table_schema = 'public';

-- Show indexes
SELECT 'Table indexes:' as info;
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
  photo_default_exists BOOLEAN;
  photo_url_not_null BOOLEAN;
  photo_filename_not_null BOOLEAN;
  photo_size_not_null BOOLEAN;
  photo_format_not_null BOOLEAN;
  unique_constraint_exists BOOLEAN;
BEGIN
  -- Check photo default
  SELECT column_default = '''''::text' INTO photo_default_exists
  FROM information_schema.columns 
  WHERE table_name = 'entries' 
  AND column_name = 'photo'
  AND table_schema = 'public';
  
  -- Check NOT NULL constraints
  SELECT is_nullable = 'NO' INTO photo_url_not_null
  FROM information_schema.columns 
  WHERE table_name = 'entries' 
  AND column_name = 'photo_url'
  AND table_schema = 'public';
  
  SELECT is_nullable = 'NO' INTO photo_filename_not_null
  FROM information_schema.columns 
  WHERE table_name = 'entries' 
  AND column_name = 'photo_filename'
  AND table_schema = 'public';
  
  SELECT is_nullable = 'NO' INTO photo_size_not_null
  FROM information_schema.columns 
  WHERE table_name = 'entries' 
  AND column_name = 'photo_size'
  AND table_schema = 'public';
  
  SELECT is_nullable = 'NO' INTO photo_format_not_null
  FROM information_schema.columns 
  WHERE table_name = 'entries' 
  AND column_name = 'photo_format'
  AND table_schema = 'public';
  
  -- Check if unique constraint still exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'entries' 
    AND constraint_name = 'entries_user_id_date_entry_order_key'
    AND table_schema = 'public'
  ) INTO unique_constraint_exists;
  
  RAISE NOTICE '=== SCHEMA MATCHING VERIFICATION ===';
  RAISE NOTICE 'Photo default value: %', CASE WHEN photo_default_exists THEN '✅ Set' ELSE '❌ Missing' END;
  RAISE NOTICE 'Photo URL NOT NULL: %', CASE WHEN photo_url_not_null THEN '✅ Set' ELSE '❌ Missing' END;
  RAISE NOTICE 'Photo filename NOT NULL: %', CASE WHEN photo_filename_not_null THEN '✅ Set' ELSE '❌ Missing' END;
  RAISE NOTICE 'Photo size NOT NULL: %', CASE WHEN photo_size_not_null THEN '✅ Set' ELSE '❌ Missing' END;
  RAISE NOTICE 'Photo format NOT NULL: %', CASE WHEN photo_format_not_null THEN '✅ Set' ELSE '❌ Missing' END;
  RAISE NOTICE 'Unique constraint removed: %', CASE WHEN NOT unique_constraint_exists THEN '✅ Removed' ELSE '❌ Still exists' END;
  
  IF photo_default_exists AND photo_url_not_null AND photo_filename_not_null 
     AND photo_size_not_null AND photo_format_not_null AND NOT unique_constraint_exists THEN
    RAISE NOTICE '✅ Production schema now matches local schema!';
  ELSE
    RAISE NOTICE '⚠️ Some schema differences may still exist.';
  END IF;
END $$;
