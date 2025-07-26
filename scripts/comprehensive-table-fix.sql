-- Comprehensive entries table fix for Clerk + Supabase integration
-- Run this script as postgres role in Supabase SQL Editor

-- STEP 1: Show current table structure
SELECT 'Current table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Ensure clerk_user_id function exists
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'sub',           -- Try 'sub' claim first (Clerk's default)
    auth.jwt() ->> 'user_id',       -- Fall back to custom 'user_id' claim
    ''                              -- Default to empty string if neither exists
  );
$$;

GRANT EXECUTE ON FUNCTION public.clerk_user_id() TO authenticated;

-- STEP 3: Fix all table structure issues
DO $$
BEGIN
  -- Ensure table exists with basic structure
  CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    photo TEXT NOT NULL,
    caption TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Fix user_id column type if it's UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' 
    AND column_name = 'user_id' 
    AND data_type = 'uuid'
  ) THEN
    -- Drop constraints temporarily
    ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_user_id_date_key;
    ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_pkey;
    
    -- Convert UUID to TEXT
    ALTER TABLE entries ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    
    -- Recreate primary key and unique constraint
    ALTER TABLE entries ADD CONSTRAINT entries_pkey PRIMARY KEY (id);
    
    RAISE NOTICE 'Converted user_id from UUID to TEXT';
  END IF;

  -- Add missing image-related columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'photo_url') THEN
    ALTER TABLE entries ADD COLUMN photo_url TEXT;
    RAISE NOTICE 'Added photo_url column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'photo_thumbnail_url') THEN
    ALTER TABLE entries ADD COLUMN photo_thumbnail_url TEXT;
    RAISE NOTICE 'Added photo_thumbnail_url column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'photo_filename') THEN
    ALTER TABLE entries ADD COLUMN photo_filename TEXT;
    RAISE NOTICE 'Added photo_filename column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'photo_size') THEN
    ALTER TABLE entries ADD COLUMN photo_size INTEGER;
    RAISE NOTICE 'Added photo_size column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'photo_format') THEN
    ALTER TABLE entries ADD COLUMN photo_format TEXT;
    RAISE NOTICE 'Added photo_format column';
  END IF;

  -- Ensure created_at column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'created_at') THEN
    ALTER TABLE entries ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  END IF;

  -- Fix data types for existing columns
  -- Ensure date is TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' 
    AND column_name = 'date' 
    AND data_type != 'text'
  ) THEN
    ALTER TABLE entries ALTER COLUMN date TYPE TEXT USING date::TEXT;
    RAISE NOTICE 'Fixed date column type to TEXT';
  END IF;

  -- Ensure timestamp is BIGINT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' 
    AND column_name = 'timestamp' 
    AND data_type NOT IN ('bigint', 'integer')
  ) THEN
    ALTER TABLE entries ALTER COLUMN timestamp TYPE BIGINT USING EXTRACT(EPOCH FROM timestamp::TIMESTAMPTZ)::BIGINT;
    RAISE NOTICE 'Fixed timestamp column type to BIGINT';
  END IF;

  -- Add unique constraint for user_id + date if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'entries' 
    AND constraint_name = 'entries_user_id_date_key'
  ) THEN
    ALTER TABLE entries ADD CONSTRAINT entries_user_id_date_key UNIQUE(user_id, date);
    RAISE NOTICE 'Added unique constraint for user_id + date';
  END IF;

  RAISE NOTICE 'Table structure fixes completed successfully!';
END $$;

-- STEP 4: Enable RLS and set up policies
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- Create RLS policies
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

-- STEP 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);

-- STEP 6: Verify final structure
SELECT 'Final table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show policies
SELECT 'RLS Policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'entries';

-- Show constraints
SELECT 'Table Constraints:' as info;
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'entries';

SELECT 'Schema fix completed! ✅' as result; 