-- QuietRoom Production Setup - Part 1: Tables and Functions
-- Run this as postgres role in Supabase SQL Editor

-- STEP 1: JWT Configuration for Clerk
-- ===================================

-- Create helper functions for Clerk JWT integration
CREATE OR REPLACE FUNCTION public.get_auth_user_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(current_setting('request.jwt.claims', true)::json->>'sub', '');
EXCEPTION
  WHEN others THEN RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clerk_user_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN public.get_auth_user_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.clerk_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id() TO authenticated;

-- STEP 2: Create Database Tables
-- =============================

-- Create entries table with proper structure
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  photo TEXT,
  caption TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT,
  photo_thumbnail_url TEXT,
  photo_filename TEXT,
  photo_size INTEGER,
  photo_format TEXT,
  entry_order INTEGER DEFAULT 1
);

-- Add unique constraint for user_id + date + entry_order
ALTER TABLE public.entries ADD CONSTRAINT entries_user_id_date_entry_order_key UNIQUE(user_id, date, entry_order);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON public.entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON public.entries(timestamp);

-- STEP 3: Enable Row Level Security
-- ================================

-- Enable RLS on entries table
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for entries table
CREATE POLICY "Users can view their own entries"
ON public.entries FOR SELECT
TO authenticated
USING (user_id = public.clerk_user_id());

CREATE POLICY "Users can create their own entries"
ON public.entries FOR INSERT
TO authenticated
WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "Users can update their own entries"
ON public.entries FOR UPDATE
TO authenticated
USING (user_id = public.clerk_user_id())
WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "Users can delete their own entries"
ON public.entries FOR DELETE
TO authenticated
USING (user_id = public.clerk_user_id());

-- Grant permissions
GRANT ALL ON public.entries TO authenticated;

-- Verify table setup
SELECT 'Table setup complete!' as result;
SELECT 'Entries table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;
