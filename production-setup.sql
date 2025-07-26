-- QuietRoom Production Setup Script
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

-- STEP 4: Set up Storage
-- =====================

-- Make sure storage extension is enabled
CREATE EXTENSION IF NOT EXISTS "storage";

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('journal-entries', 'journal-entries', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('thumbnails', 'thumbnails', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- STEP 5: Set up Storage RLS Policies
-- ==================================

-- Bucket Policies
DROP POLICY IF EXISTS "Authenticated users can see available buckets" ON storage.buckets;
CREATE POLICY "Authenticated users can see available buckets"
ON storage.buckets FOR SELECT
TO authenticated
USING (
  id IN ('journal-entries', 'thumbnails')
);

-- Journal entries bucket policies
DROP POLICY IF EXISTS "Users can access their own journal images" ON storage.objects;
CREATE POLICY "Users can access their own journal images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'journal-entries' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- Thumbnails bucket policies
DROP POLICY IF EXISTS "Thumbnails are publicly readable" ON storage.objects;
CREATE POLICY "Thumbnails are publicly readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "Users can insert their own thumbnails" ON storage.objects;
CREATE POLICY "Users can insert their own thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
CREATE POLICY "Users can update their own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
)
WITH CHECK (
  bucket_id = 'thumbnails' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- STEP 6: Grant necessary permissions
-- ==================================
GRANT ALL ON SCHEMA storage TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres;

GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

GRANT ALL ON public.entries TO authenticated;

-- STEP 7: Verification
-- ===================
DO $$
DECLARE
    bucket_count int;
    policy_count int;
BEGIN
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname IN ('storage', 'public');
    
    RAISE NOTICE 'Setup verification:';
    RAISE NOTICE '- Buckets created: %', bucket_count;
    RAISE NOTICE '- Policies created: %', policy_count;
    
    -- Show bucket details
    RAISE NOTICE 'Bucket configuration:';
    FOR r IN (
        SELECT id, public, file_size_limit, allowed_mime_types 
        FROM storage.buckets 
        ORDER BY id
    ) LOOP
        RAISE NOTICE 'Bucket: %', r.id;
        RAISE NOTICE '  - Public: %', r.public;
        RAISE NOTICE '  - Size limit: % bytes', r.file_size_limit;
        RAISE NOTICE '  - Allowed types: %', r.allowed_mime_types;
    END LOOP;
    
    -- Show entries table structure
    RAISE NOTICE 'Entries table structure:';
    FOR r IN (
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'entries' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
    ) LOOP
        RAISE NOTICE '  - %: % (%)', r.column_name, r.data_type, 
            CASE WHEN r.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
    END LOOP;
END $$;

-- IMPORTANT: After running this script, configure JWT settings in Supabase Dashboard:
-- 1. Go to Authentication > Settings > JWT Settings
-- 2. Set JWT Key URL to your Clerk JWKS URL (e.g., https://clerk.room.sadique.co/.well-known/jwks.json)
-- 3. Set JWT Default Role to: authenticated
-- 4. Set JWT Issuer to your Clerk domain (e.g., https://clerk.room.sadique.co)
