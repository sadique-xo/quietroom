-- QuietRoom Production Setup - Part 3: Storage Policies (Fixed for Production)
-- Run this as postgres role in Supabase SQL Editor

-- STEP 1: Create helper function for storage folder access
-- ====================================================

-- Create storage.foldername function if it doesn't exist
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] AS $$
BEGIN
  RETURN string_to_array(name, '/');
EXCEPTION WHEN OTHERS THEN
  RETURN ARRAY[]::text[];
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Set up storage buckets
-- ===========================

-- Create buckets with public=true (this is critical for image display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('journal-entries', 'journal-entries', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- STEP 3: Create bucket policies using Supabase's built-in functions
-- ===============================================================

-- Use Supabase's built-in policy creation function instead of direct SQL
-- This avoids ownership issues in production
SELECT storage.create_policy(
  'journal-entries', 
  'authenticated users can see journal entries bucket', 
  'SELECT',
  'authenticated',
  true
);

SELECT storage.create_policy(
  'thumbnails', 
  'authenticated users can see thumbnails bucket', 
  'SELECT',
  'authenticated',
  true
);

-- STEP 4: Create object policies using Supabase's built-in functions
-- ===============================================================

-- Journal entries bucket - read policy
SELECT storage.create_policy(
  'journal-entries', 
  'Public read access for journal entries', 
  'SELECT',
  'anon, authenticated',
  true
);

-- Journal entries bucket - write policies
SELECT storage.create_policy(
  'journal-entries', 
  'Users can insert their own journal images', 
  'INSERT',
  'authenticated',
  '(storage.foldername(name))[1] = public.clerk_user_id()'
);

SELECT storage.create_policy(
  'journal-entries', 
  'Users can update their own journal images', 
  'UPDATE',
  'authenticated',
  '(storage.foldername(name))[1] = public.clerk_user_id()'
);

SELECT storage.create_policy(
  'journal-entries', 
  'Users can delete their own journal images', 
  'DELETE',
  'authenticated',
  '(storage.foldername(name))[1] = public.clerk_user_id()'
);

-- Thumbnails bucket - read policy
SELECT storage.create_policy(
  'thumbnails', 
  'Thumbnails are publicly readable', 
  'SELECT',
  'anon, authenticated',
  true
);

-- Thumbnails bucket - write policies
SELECT storage.create_policy(
  'thumbnails', 
  'Users can insert their own thumbnails', 
  'INSERT',
  'authenticated',
  '(storage.foldername(name))[1] = public.clerk_user_id()'
);

SELECT storage.create_policy(
  'thumbnails', 
  'Users can update their own thumbnails', 
  'UPDATE',
  'authenticated',
  '(storage.foldername(name))[1] = public.clerk_user_id()'
);

SELECT storage.create_policy(
  'thumbnails', 
  'Users can delete their own thumbnails', 
  'DELETE',
  'authenticated',
  '(storage.foldername(name))[1] = public.clerk_user_id()'
);

-- STEP 5: Grant necessary permissions
-- =================================

-- These should work in production as they don't require table ownership
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon;

-- STEP 6: Verify configuration
-- =========================

-- Check buckets configuration
SELECT 'Storage buckets:' as info;
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('journal-entries', 'thumbnails')
ORDER BY id;

-- Check policies (this should work without ownership)
SELECT 'Storage policies:' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND (tablename = 'buckets' OR tablename = 'objects')
ORDER BY tablename, policyname;
