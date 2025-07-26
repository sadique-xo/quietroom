-- Comprehensive fix for Clerk + Supabase Database Integration
-- Run this script as postgres role in Supabase SQL Editor

-- PART 1: Create clerk_user_id function
-- =====================================

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

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION public.clerk_user_id() TO authenticated;

-- PART 2: Fix entries table schema
-- ================================

-- Create or update the entries table with correct schema
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                    -- Clerk user IDs are text, not UUID
  date TEXT NOT NULL,                       -- Date in YYYY-MM-DD format
  photo TEXT NOT NULL,                      -- Base64 image (legacy)
  photo_url TEXT,                          -- URL to stored image
  photo_thumbnail_url TEXT,                -- URL to thumbnail
  photo_filename TEXT,                     -- Original filename
  photo_size INTEGER,                      -- File size in bytes
  photo_format TEXT,                       -- Image format (jpg, png, webp)
  caption TEXT NOT NULL,
  timestamp BIGINT NOT NULL,               -- Unix timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)                    -- Ensure one entry per user per day
);

-- Convert user_id from UUID to TEXT if needed
DO $$
BEGIN
  -- Check if user_id column is UUID type and convert it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' 
    AND column_name = 'user_id' 
    AND data_type = 'uuid'
  ) THEN
    -- First, drop the constraint temporarily if it exists
    ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_user_id_date_key;
    
    -- Convert UUID column to TEXT
    ALTER TABLE entries ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    
    -- Recreate the unique constraint
    ALTER TABLE entries ADD CONSTRAINT entries_user_id_date_key UNIQUE(user_id, date);
    
    RAISE NOTICE 'Converted user_id column from UUID to TEXT';
  ELSE
    RAISE NOTICE 'user_id column is already TEXT type';
  END IF;
END $$;

-- PART 3: Set up RLS policies
-- ===========================

-- Enable RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- Create new policies using our clerk_user_id function
CREATE POLICY "Users can view their own entries"
ON entries
FOR SELECT
TO authenticated
USING (user_id = public.clerk_user_id());

CREATE POLICY "Users can create their own entries"
ON entries
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "Users can update their own entries"
ON entries
FOR UPDATE
TO authenticated
USING (user_id = public.clerk_user_id())
WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "Users can delete their own entries"
ON entries
FOR DELETE
TO authenticated
USING (user_id = public.clerk_user_id());

-- PART 4: Create indexes for performance
-- ======================================

CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);

-- PART 5: Verification
-- ====================

-- Test the clerk_user_id function
DO $$
BEGIN
  RAISE NOTICE 'Testing clerk_user_id function...';
  
  -- This will show empty when run as postgres, but will work with JWT
  RAISE NOTICE 'clerk_user_id() result: %', public.clerk_user_id();
  
  RAISE NOTICE 'Setup completed successfully!';
END $$;

-- Show final table schema (run these separately if needed)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'entries' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Show policies (run these separately if needed)
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'entries' ORDER BY policyname; 