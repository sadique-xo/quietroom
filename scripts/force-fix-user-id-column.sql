-- COMPREHENSIVE FIX: Force user_id column to TEXT type
-- Run this script as postgres role in Supabase SQL Editor

-- STEP 1: Check current state
SELECT 'CURRENT TABLE STRUCTURE:' as status;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'entries' 
ORDER BY ordinal_position;

-- STEP 2: Check constraints that might be blocking the change
SELECT 'CURRENT CONSTRAINTS:' as status;
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'entries';

-- STEP 3: Force fix the user_id column type
DO $$
BEGIN
  -- Drop ALL constraints that reference user_id
  ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_pkey CASCADE;
  ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_user_id_date_key CASCADE;
  ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_user_id_key CASCADE;
  
  -- Drop and recreate the table with correct schema
  DROP TABLE IF EXISTS entries_backup;
  
  -- Create backup if entries table has data
  IF EXISTS (SELECT 1 FROM entries LIMIT 1) THEN
    CREATE TABLE entries_backup AS SELECT * FROM entries;
    RAISE NOTICE 'Created backup table with existing data';
  END IF;
  
  -- Drop and recreate the table with correct types
  DROP TABLE entries CASCADE;
  
  CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,                    -- TEXT for Clerk user IDs
    date TEXT NOT NULL,                       -- Date in YYYY-MM-DD format
    photo TEXT DEFAULT '',                    -- Base64 image (legacy, optional)
    photo_url TEXT NOT NULL,                  -- URL to stored image (required)
    photo_thumbnail_url TEXT,                 -- URL to thumbnail
    photo_filename TEXT NOT NULL,             -- Original filename (required)
    photo_size INTEGER NOT NULL,              -- File size in bytes (required)
    photo_format TEXT NOT NULL,               -- Image format (required)
    caption TEXT NOT NULL,
    timestamp BIGINT NOT NULL,               -- Unix timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)                    -- Ensure one entry per user per day
  );
  
  -- Restore data if backup exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entries_backup') THEN
    INSERT INTO entries (
      id, user_id, date, photo, photo_url, photo_thumbnail_url, 
      photo_filename, photo_size, photo_format, caption, timestamp, created_at
    )
    SELECT 
      id, 
      user_id::TEXT,  -- Force cast any existing UUID values to TEXT
      date, 
      COALESCE(photo, ''),
      COALESCE(photo_url, ''),
      photo_thumbnail_url,
      COALESCE(photo_filename, ''),
      COALESCE(photo_size, 0),
      COALESCE(photo_format, ''),
      caption, 
      timestamp, 
      created_at
    FROM entries_backup
    WHERE photo_url IS NOT NULL 
    AND photo_filename IS NOT NULL 
    AND photo_size IS NOT NULL 
    AND photo_format IS NOT NULL;
    
    DROP TABLE entries_backup;
    RAISE NOTICE 'Restored data from backup';
  END IF;
  
  RAISE NOTICE 'Successfully recreated entries table with TEXT user_id';
END $$;

-- STEP 4: Enable RLS and recreate policies
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Ensure clerk_user_id function exists
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'user_id',
    ''
  );
$$;
GRANT EXECUTE ON FUNCTION public.clerk_user_id() TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- Create RLS policies with explicit TEXT casting
CREATE POLICY "Users can view their own entries"
ON entries FOR SELECT
TO authenticated
USING (user_id = public.clerk_user_id());

CREATE POLICY "Users can create their own entries"
ON entries FOR INSERT
TO authenticated
WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "Users can update their own entries"
ON entries FOR UPDATE
TO authenticated
USING (user_id = public.clerk_user_id())
WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "Users can delete their own entries"
ON entries FOR DELETE
TO authenticated
USING (user_id = public.clerk_user_id());

-- STEP 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);

-- STEP 6: Final verification
SELECT 'FINAL TABLE STRUCTURE:' as status;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'entries' 
ORDER BY ordinal_position;

SELECT 'RLS POLICIES:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'entries';

SELECT 'USER_ID COLUMN FIXED! ✅' as result; 