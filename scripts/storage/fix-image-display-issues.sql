-- Fix Image Display Issues in Production
-- Run this as postgres role in Supabase SQL Editor

-- STEP 1: Ensure buckets are public
-- ================================

-- Make sure journal-entries bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'journal-entries';

-- Make sure thumbnails bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'thumbnails';

-- STEP 2: Create comprehensive public read policies
-- ================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access for journal entries" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for thumbnails" ON storage.objects;

-- Create public read policy for journal entries
CREATE POLICY "Public read access for journal entries"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'journal-entries');

-- Create public read policy for thumbnails
CREATE POLICY "Public read access for thumbnails"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'thumbnails');

-- STEP 3: Ensure user-specific write policies
-- ==========================================

-- Journal entries write policies
DROP POLICY IF EXISTS "Users insert own journal entries" ON storage.objects;
CREATE POLICY "Users insert own journal entries"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journal-entries' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

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

DROP POLICY IF EXISTS "Users delete own journal entries" ON storage.objects;
CREATE POLICY "Users delete own journal entries"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'journal-entries' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- Thumbnails write policies
DROP POLICY IF EXISTS "Users insert own thumbnails" ON storage.objects;
CREATE POLICY "Users insert own thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

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

DROP POLICY IF EXISTS "Users delete own thumbnails" ON storage.objects;
CREATE POLICY "Users delete own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- STEP 4: Verify configuration
-- ===========================

-- Check bucket settings
SELECT 'Bucket configuration:' as info;
SELECT 
  id, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('journal-entries', 'thumbnails')
ORDER BY id;

-- Check policies
SELECT 'Storage policies:' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'storage'
  AND (tablename = 'buckets' OR tablename = 'objects')
ORDER BY tablename, policyname;

-- STEP 5: Final verification
-- ========================

DO $$
DECLARE
  journal_public BOOLEAN;
  thumbnails_public BOOLEAN;
  read_policies_count INTEGER;
BEGIN
  -- Check if buckets are public
  SELECT public INTO journal_public FROM storage.buckets WHERE id = 'journal-entries';
  SELECT public INTO thumbnails_public FROM storage.buckets WHERE id = 'thumbnails';
  
  -- Count read policies
  SELECT COUNT(*) INTO read_policies_count 
  FROM pg_policies 
  WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND cmd = 'SELECT';
  
  RAISE NOTICE '=== IMAGE DISPLAY FIX VERIFICATION ===';
  RAISE NOTICE 'Journal entries bucket public: %', COALESCE(journal_public, false);
  RAISE NOTICE 'Thumbnails bucket public: %', COALESCE(thumbnails_public, false);
  RAISE NOTICE 'Public read policies: %', read_policies_count;
  RAISE NOTICE '';
  
  IF COALESCE(journal_public, false) AND COALESCE(thumbnails_public, false) AND read_policies_count >= 2 THEN
    RAISE NOTICE '✅ Storage is configured for public image access!';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Also ensure your next.config.ts has the correct Supabase URL:';
    RAISE NOTICE 'hostname: ''vttbnrudkjwjgamavjal.supabase.co''';
    RAISE NOTICE '';
    RAISE NOTICE 'Then redeploy your application.';
  ELSE
    RAISE NOTICE '❌ Storage configuration may still have issues.';
  END IF;
END $$;
