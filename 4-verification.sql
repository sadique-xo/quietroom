-- QuietRoom Production Setup - Part 4: Verification
-- Run this as postgres role in Supabase SQL Editor

-- STEP 1: Verify database structure
-- ===============================

-- Check tables
SELECT 'Database tables:' as info;
SELECT 
  table_schema, 
  table_name 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'storage') 
AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

-- Check entries table structure
SELECT 'Entries table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Verify RLS policies
-- =========================

-- Check RLS is enabled
SELECT 'RLS status:' as info;
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname IN ('public', 'storage')
AND tablename IN ('entries', 'buckets', 'objects')
ORDER BY schemaname, tablename;

-- Check policies
SELECT 'RLS policies:' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies 
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- STEP 3: Verify storage buckets
-- ============================

-- Check buckets
SELECT 'Storage buckets:' as info;
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
ORDER BY id;

-- STEP 4: Verify JWT functions
-- ==========================

-- Check JWT functions
SELECT 'JWT functions:' as info;
SELECT 
  proname, 
  prorettype::regtype, 
  prokind
FROM pg_proc 
WHERE proname IN ('clerk_user_id', 'get_auth_user_id')
AND pronamespace = 'public'::regnamespace
ORDER BY proname;

-- STEP 5: Final verification message
-- ================================

DO $$
DECLARE
  entries_count INTEGER;
  buckets_count INTEGER;
  policies_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO entries_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entries';
  SELECT COUNT(*) INTO buckets_count FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets';
  SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE schemaname IN ('public', 'storage');
  
  RAISE NOTICE '=== SETUP VERIFICATION SUMMARY ===';
  RAISE NOTICE 'Entries table: %', CASE WHEN entries_count > 0 THEN '✓ Created' ELSE '✗ Missing' END;
  RAISE NOTICE 'Storage buckets: %', CASE WHEN buckets_count > 0 THEN '✓ Created' ELSE '✗ Missing' END;
  RAISE NOTICE 'RLS policies: %', CASE WHEN policies_count > 0 THEN '✓ Created (' || policies_count || ' policies)' ELSE '✗ Missing' END;
  
  IF entries_count > 0 AND buckets_count > 0 AND policies_count > 0 THEN
    RAISE NOTICE 'All components successfully set up! ✓';
  ELSE
    RAISE NOTICE 'Some components are missing. Please check the logs. ✗';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Remember to configure JWT settings in Supabase Dashboard:';
  RAISE NOTICE '1. Go to Authentication > Settings > JWT Settings';
  RAISE NOTICE '2. Set JWT Key URL to your Clerk JWKS URL';
  RAISE NOTICE '3. Set JWT Default Role to: authenticated';
  RAISE NOTICE '4. Set JWT Issuer to your Clerk domain';
END $$;
