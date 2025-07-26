-- Fix user_id column type from UUID to TEXT for Clerk compatibility
-- Run this script as postgres role in Supabase SQL Editor

-- Check current user_id column type
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND column_name = 'user_id';

-- Convert user_id from UUID to TEXT if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' 
    AND column_name = 'user_id' 
    AND data_type = 'uuid'
  ) THEN
    -- Drop unique constraint temporarily (it references user_id)
    ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_user_id_date_key;
    
    -- Convert UUID column to TEXT
    ALTER TABLE entries ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    
    -- Recreate the unique constraint
    ALTER TABLE entries ADD CONSTRAINT entries_user_id_date_key UNIQUE(user_id, date);
    
    RAISE NOTICE 'Successfully converted user_id column from UUID to TEXT';
  ELSE
    RAISE NOTICE 'user_id column is already TEXT type, no conversion needed';
  END IF;
END $$;

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND column_name = 'user_id';

SELECT 'user_id column fix completed! ✅' as result; 