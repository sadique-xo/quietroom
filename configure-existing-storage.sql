-- QuietRoom Production Setup - Configure Existing Storage
-- Run this as postgres role in Supabase SQL Editor
-- This works with Supabase's existing storage infrastructure

-- STEP 1: Create helper functions that work with existing storage
-- ============================================================

-- Create storage.foldername function if it doesn't exist
-- This function is needed for the RLS policies
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] AS $$
BEGIN
  RETURN string_to_array(name, '/');
EXCEPTION WHEN OTHERS THEN
  RETURN ARRAY[]::text[];
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Update bucket configuration using INSERT...ON CONFLICT
-- ============================================================

-- This approach works even if buckets already exist
-- It will update the configuration to make them public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('journal-entries', 'journal-entries', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- STEP 3: Create RLS policies for existing tables
-- ==============================================

-- Bucket policies - allow users to see the buckets
DROP POLICY IF EXISTS "Allow bucket listing" ON storage.buckets;
CREATE POLICY "Allow bucket listing"
ON storage.buckets FOR SELECT
TO anon, authenticated
USING (
  id IN ('journal-entries', 'thumbnails')
);

-- Object policies for journal-entries bucket
DROP POLICY IF EXISTS "Public read journal entries" ON storage.objects;
CREATE POLICY "Public read journal entries"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'journal-entries');

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

-- Object policies for thumbnails bucket
DROP POLICY IF EXISTS "Public read thumbnails" ON storage.objects;
CREATE POLICY "Public read thumbnails"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'thumbnails');

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
-- ==========================

-- Check bucket configuration
SELECT 'Current bucket configuration:' as info;
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('journal-entries', 'thumbnails')
ORDER BY id;

-- Check policies
SELECT 'Storage policies created:' as info;
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
  policy_count INTEGER;
BEGIN
  -- Check if buckets are public
  SELECT public INTO journal_public FROM storage.buckets WHERE id = 'journal-entries';
  SELECT public INTO thumbnails_public FROM storage.buckets WHERE id = 'thumbnails';
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'storage';
  
  RAISE NOTICE '=== STORAGE CONFIGURATION COMPLETE ===';
  RAISE NOTICE 'Journal entries bucket public: %', COALESCE(journal_public, false);
  RAISE NOTICE 'Thumbnails bucket public: %', COALESCE(thumbnails_public, false);
  RAISE NOTICE 'Storage policies created: %', policy_count;
  RAISE NOTICE '';
  
  IF COALESCE(journal_public, false) AND COALESCE(thumbnails_public, false) AND policy_count > 0 THEN
    RAISE NOTICE '✅ Storage is ready for production use!';
  ELSE
    RAISE NOTICE '⚠️  Some configuration may be missing. Check the results above.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update your production environment variables';
  RAISE NOTICE '2. Deploy your application';
  RAISE NOTICE '3. Test image upload functionality';
END $$;
