-- QuietRoom Production Setup - Minimal Storage Configuration
-- Run this as postgres role in Supabase SQL Editor
-- This approach uses only what's available without schema permissions

-- STEP 1: Create helper function in public schema
-- ==============================================

-- Create a helper function in public schema (we have access to this)
CREATE OR REPLACE FUNCTION public.foldername(name text)
RETURNS text[] AS $$
BEGIN
  RETURN string_to_array(name, '/');
EXCEPTION WHEN OTHERS THEN
  RETURN ARRAY[]::text[];
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Try to update bucket configuration using Supabase's approach
-- ==================================================================

-- Attempt to update bucket configuration
-- This should work if the buckets exist and we have basic access
DO $$
BEGIN
  -- Try to update journal-entries bucket to public
  UPDATE storage.buckets 
  SET public = true 
  WHERE id = 'journal-entries';
  
  IF FOUND THEN
    RAISE NOTICE 'Updated journal-entries bucket to public';
  ELSE
    RAISE NOTICE 'Could not update journal-entries bucket';
  END IF;
  
  -- Try to update thumbnails bucket to public
  UPDATE storage.buckets 
  SET public = true 
  WHERE id = 'thumbnails';
  
  IF FOUND THEN
    RAISE NOTICE 'Updated thumbnails bucket to public';
  ELSE
    RAISE NOTICE 'Could not update thumbnails bucket';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error updating buckets: %', SQLERRM;
END $$;

-- STEP 3: Try to create policies using basic SQL
-- =============================================

-- Try to create bucket policies
DO $$
BEGIN
  -- Create bucket listing policy
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Allow bucket listing" ON storage.buckets FOR SELECT TO anon, authenticated USING (id IN (''journal-entries'', ''thumbnails''))';
  RAISE NOTICE 'Created bucket listing policy';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create bucket policy: %', SQLERRM;
END $$;

-- Try to create object policies
DO $$
BEGIN
  -- Journal entries read policy
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Public read journal entries" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = ''journal-entries'')';
  RAISE NOTICE 'Created journal entries read policy';
  
  -- Journal entries write policies
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Users insert own journal entries" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''journal-entries'' AND (public.foldername(name))[1] = public.clerk_user_id())';
  RAISE NOTICE 'Created journal entries insert policy';
  
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Users update own journal entries" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''journal-entries'' AND (public.foldername(name))[1] = public.clerk_user_id()) WITH CHECK (bucket_id = ''journal-entries'' AND (public.foldername(name))[1] = public.clerk_user_id())';
  RAISE NOTICE 'Created journal entries update policy';
  
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Users delete own journal entries" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''journal-entries'' AND (public.foldername(name))[1] = public.clerk_user_id())';
  RAISE NOTICE 'Created journal entries delete policy';
  
  -- Thumbnails policies
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Public read thumbnails" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = ''thumbnails'')';
  RAISE NOTICE 'Created thumbnails read policy';
  
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Users insert own thumbnails" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''thumbnails'' AND (public.foldername(name))[1] = public.clerk_user_id())';
  RAISE NOTICE 'Created thumbnails insert policy';
  
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Users update own thumbnails" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''thumbnails'' AND (public.foldername(name))[1] = public.clerk_user_id()) WITH CHECK (bucket_id = ''thumbnails'' AND (public.foldername(name))[1] = public.clerk_user_id())';
  RAISE NOTICE 'Created thumbnails update policy';
  
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Users delete own thumbnails" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''thumbnails'' AND (public.foldername(name))[1] = public.clerk_user_id())';
  RAISE NOTICE 'Created thumbnails delete policy';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create object policies: %', SQLERRM;
END $$;

-- STEP 4: Verify what we can access
-- ================================

-- Try to check bucket configuration
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE id IN ('journal-entries', 'thumbnails');
  RAISE NOTICE 'Found % storage buckets', bucket_count;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Cannot access storage.buckets: %', SQLERRM;
END $$;

-- Try to check policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'storage';
  RAISE NOTICE 'Found % storage policies', policy_count;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Cannot access storage policies: %', SQLERRM;
END $$;

-- STEP 5: Alternative approach - use Supabase UI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== ALTERNATIVE SETUP APPROACH ===';
  RAISE NOTICE 'If the above policies failed, you may need to:';
  RAISE NOTICE '1. Go to Supabase Dashboard > Storage > Policies';
  RAISE NOTICE '2. Manually create the policies through the UI';
  RAISE NOTICE '3. Set buckets to public in Storage > Settings';
  RAISE NOTICE '';
  RAISE NOTICE 'Required policies for journal-entries bucket:';
  RAISE NOTICE '- SELECT: anon, authenticated (for public read)';
  RAISE NOTICE '- INSERT: authenticated (with user folder check)';
  RAISE NOTICE '- UPDATE: authenticated (with user folder check)';
  RAISE NOTICE '- DELETE: authenticated (with user folder check)';
  RAISE NOTICE '';
  RAISE NOTICE 'Required policies for thumbnails bucket:';
  RAISE NOTICE '- Same as journal-entries';
  RAISE NOTICE '';
  RAISE NOTICE 'User folder check: (storage.foldername(name))[1] = public.clerk_user_id()';
END $$;
