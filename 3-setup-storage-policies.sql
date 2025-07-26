-- QuietRoom Production Setup - Part 3: Storage Policies
-- Run this as postgres role in Supabase SQL Editor

-- STEP 1: Enable RLS on storage tables
-- ===================================

-- Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- STEP 2: Create bucket policies
-- ============================

-- Bucket Policies
DROP POLICY IF EXISTS "Authenticated users can see available buckets" ON storage.buckets;
CREATE POLICY "Authenticated users can see available buckets"
ON storage.buckets FOR SELECT
TO authenticated
USING (
  id IN ('journal-entries', 'thumbnails')
);

-- STEP 3: Create object policies
-- ============================

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

-- STEP 4: Grant necessary permissions
-- =================================

GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Verify policies
SELECT 'Storage policies:' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;
