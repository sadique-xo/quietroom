-- QuietRoom Production Setup - Part 3: Manual Storage Policies
-- Run this as postgres role in Supabase SQL Editor
-- This approach manually creates storage policies when you own the storage tables

-- STEP 1: Create bucket policies
-- ============================

-- Allow all users to see the buckets (needed for bucket listing)
DROP POLICY IF EXISTS "Allow bucket listing" ON storage.buckets;
CREATE POLICY "Allow bucket listing"
ON storage.buckets FOR SELECT
TO anon, authenticated
USING (
  id IN ('journal-entries', 'thumbnails')
);

-- STEP 2: Create object policies for journal-entries bucket
-- =======================================================

-- Public read access for journal entries (since bucket is public)
DROP POLICY IF EXISTS "Public read journal entries" ON storage.objects;
CREATE POLICY "Public read journal entries"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'journal-entries');

-- Users can only insert files in their own folder
DROP POLICY IF EXISTS "Users insert own journal entries" ON storage.objects;
CREATE POLICY "Users insert own journal entries"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journal-entries' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- Users can only update their own files
DROP POLICY IF EXISTS "Users update own journal entries" ON storage.objects;
CREATE POLICY "Users update own journal entries"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'journal-entries' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
)
WITH CHECK (
  bucket_id = 'journal-entries' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- Users can only delete their own files
DROP POLICY IF EXISTS "Users delete own journal entries" ON storage.objects;
CREATE POLICY "Users delete own journal entries"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'journal-entries' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- STEP 3: Create object policies for thumbnails bucket
-- ==================================================

-- Public read access for thumbnails
DROP POLICY IF EXISTS "Public read thumbnails" ON storage.objects;
CREATE POLICY "Public read thumbnails"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'thumbnails');

-- Users can only insert thumbnails in their own folder
DROP POLICY IF EXISTS "Users insert own thumbnails" ON storage.objects;
CREATE POLICY "Users insert own thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- Users can only update their own thumbnails
DROP POLICY IF EXISTS "Users update own thumbnails" ON storage.objects;
CREATE POLICY "Users update own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
)
WITH CHECK (
  bucket_id = 'thumbnails' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- Users can only delete their own thumbnails
DROP POLICY IF EXISTS "Users delete own thumbnails" ON storage.objects;
CREATE POLICY "Users delete own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- STEP 4: Verify policies
-- =====================

-- Check RLS is enabled
SELECT 'RLS status:' as info;
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage'
  AND tablename IN ('buckets', 'objects')
ORDER BY tablename;

-- Check policies
SELECT 'Storage policies:' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- STEP 5: Final verification
-- ========================

DO $$
DECLARE
  bucket_policies_count INTEGER;
  object_policies_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_policies_count 
  FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'buckets';
  
  SELECT COUNT(*) INTO object_policies_count 
  FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects';
  
  RAISE NOTICE '=== STORAGE POLICIES SETUP COMPLETE ===';
  RAISE NOTICE 'Bucket policies created: %', bucket_policies_count;
  RAISE NOTICE 'Object policies created: %', object_policies_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Storage is now configured with:';
  RAISE NOTICE '- Public buckets for image display';
  RAISE NOTICE '- User-specific folder access control';
  RAISE NOTICE '- Clerk JWT integration for user identification';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for production use! ✅';
END $$;
