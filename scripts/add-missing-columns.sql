-- Add missing columns to existing entries table
-- Run this script as postgres role in Supabase SQL Editor

-- Check current table structure first
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add photo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE entries ADD COLUMN photo_url TEXT;
    RAISE NOTICE 'Added photo_url column';
  END IF;

  -- Add photo_thumbnail_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'photo_thumbnail_url'
  ) THEN
    ALTER TABLE entries ADD COLUMN photo_thumbnail_url TEXT;
    RAISE NOTICE 'Added photo_thumbnail_url column';
  END IF;

  -- Add photo_filename column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'photo_filename'
  ) THEN
    ALTER TABLE entries ADD COLUMN photo_filename TEXT;
    RAISE NOTICE 'Added photo_filename column';
  END IF;

  -- Add photo_size column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'photo_size'
  ) THEN
    ALTER TABLE entries ADD COLUMN photo_size INTEGER;
    RAISE NOTICE 'Added photo_size column';
  END IF;

  -- Add photo_format column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'photo_format'
  ) THEN
    ALTER TABLE entries ADD COLUMN photo_format TEXT;
    RAISE NOTICE 'Added photo_format column';
  END IF;

  -- Ensure user_id is TEXT type (for Clerk compatibility)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' 
    AND column_name = 'user_id' 
    AND data_type = 'uuid'
  ) THEN
    -- Drop unique constraint temporarily
    ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_user_id_date_key;
    
    -- Convert UUID to TEXT
    ALTER TABLE entries ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    
    -- Recreate unique constraint
    ALTER TABLE entries ADD CONSTRAINT entries_user_id_date_key UNIQUE(user_id, date);
    
    RAISE NOTICE 'Converted user_id from UUID to TEXT';
  END IF;

  RAISE NOTICE 'All required columns verified/added successfully!';
END $$;

-- Verify final table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND table_schema = 'public'
ORDER BY ordinal_position; 