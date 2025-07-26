-- Fix Storage Bucket Access Issues
-- This script addresses the "Found 0 buckets" problem by:
-- 1. Adding RLS policies for storage.buckets table
-- 2. Fixing inconsistent storage.objects policies
-- 3. Ensuring consistent folder structure approach

-- PART 1: Enable RLS on storage.buckets and add access policies
-- ============================================================

-- Enable RLS on storage.buckets table if not already enabled
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing bucket policies if they exist
DROP POLICY IF EXISTS "Authenticated users can see available buckets" ON storage.buckets;

-- Allow authenticated users to see the buckets they need access to
CREATE POLICY "Authenticated users can see available buckets"
ON storage.buckets FOR SELECT
TO authenticated
USING (
  id IN ('journal-entries', 'thumbnails', 'quietroom')
);

-- PART 2: Fix storage.objects policies for consistency
-- ====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can access their own journal images" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can only access their own journal images" ON storage.objects;
DROP POLICY IF EXISTS "Only authenticated users can upload thumbnails" ON storage.objects;

-- Journal entries bucket policies (using consistent folder structure: userId/filename)
-- Users can only access files in their own folder
CREATE POLICY "Users can access their own journal images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'journal-entries' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- Thumbnails bucket policies 
-- Public read access for thumbnails
CREATE POLICY "Thumbnails are publicly readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'thumbnails');

-- Authenticated users can insert their own thumbnails (using folder structure: thumbnails/userId/filename)
CREATE POLICY "Users can insert their own thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- Authenticated users can update their own thumbnails
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

-- Authenticated users can delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- Quietroom bucket policies (if needed)
-- This bucket might be for general app assets
CREATE POLICY "Public read access for quietroom bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'quietroom');

-- Only authenticated users can manage quietroom assets
CREATE POLICY "Authenticated users can manage quietroom assets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'quietroom');

-- PART 3: Verification queries
-- ============================

-- These queries can be run to verify the setup:
-- 
-- 1. Check if RLS is enabled on storage.buckets:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE tablename = 'buckets' AND schemaname = 'storage';
--
-- 2. List policies on storage.buckets:
-- SELECT * FROM pg_policies WHERE tablename = 'buckets' AND schemaname = 'storage';
--
-- 3. List policies on storage.objects:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
--
-- 4. Test bucket listing (should work for authenticated users):
-- SELECT * FROM storage.buckets; 