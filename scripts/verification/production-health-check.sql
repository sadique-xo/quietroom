-- Production Health Check Script
-- Run this to verify your production setup is working correctly

-- STEP 1: Check Database Components
-- ================================

-- Check if entries table exists and has correct structure
SELECT 'Database Health Check:' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entries' AND table_schema = 'public') 
    THEN '✅ Entries table exists'
    ELSE '❌ Entries table missing'
  END as table_status;

-- Check if JWT functions exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clerk_user_id' AND pronamespace = 'public'::regnamespace)
    THEN '✅ clerk_user_id function exists'
    ELSE '❌ clerk_user_id function missing'
  END as jwt_function_status;

-- Check if daily limit function exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_daily_entry_limit' AND pronamespace = 'public'::regnamespace)
    THEN '✅ Daily limit function exists'
    ELSE '❌ Daily limit function missing'
  END as limit_function_status;

-- Check if trigger exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_daily_entry_limit')
    THEN '✅ Daily limit trigger exists'
    ELSE '❌ Daily limit trigger missing'
  END as trigger_status;

-- STEP 2: Check Storage Components
-- ===============================

-- Check if storage buckets exist
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE id IN ('journal-entries', 'thumbnails');
  
  IF bucket_count = 2 THEN
    RAISE NOTICE '✅ Storage buckets exist (journal-entries, thumbnails)';
  ELSE
    RAISE NOTICE '❌ Storage buckets missing or incomplete (found % buckets)', bucket_count;
  END IF;
END $$;

-- Check if buckets are public
DO $$
DECLARE
  journal_public BOOLEAN;
  thumbnails_public BOOLEAN;
BEGIN
  SELECT public INTO journal_public FROM storage.buckets WHERE id = 'journal-entries';
  SELECT public INTO thumbnails_public FROM storage.buckets WHERE id = 'thumbnails';
  
  IF journal_public AND thumbnails_public THEN
    RAISE NOTICE '✅ Storage buckets are public (required for image display)';
  ELSE
    RAISE NOTICE '❌ Storage buckets are not public (images may not display)';
  END IF;
END $$;

-- Check storage policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'storage';
  
  IF policy_count >= 8 THEN
    RAISE NOTICE '✅ Storage policies configured (% policies found)', policy_count;
  ELSE
    RAISE NOTICE '❌ Storage policies may be missing (% policies found)', policy_count;
  END IF;
END $$;

-- STEP 3: Check RLS Policies
-- ==========================

-- Check entries table RLS
DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE tablename = 'entries' AND schemaname = 'public';
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'entries' AND schemaname = 'public';
  
  IF rls_enabled AND policy_count >= 4 THEN
    RAISE NOTICE '✅ Entries table RLS enabled with policies (% policies)', policy_count;
  ELSE
    RAISE NOTICE '❌ Entries table RLS may not be properly configured';
  END IF;
END $$;

-- STEP 4: Final Health Summary
-- ============================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== PRODUCTION HEALTH SUMMARY ===';
  RAISE NOTICE 'If all checks above show ✅, your production setup is ready!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy your application with correct environment variables';
  RAISE NOTICE '2. Test user registration and authentication';
  RAISE NOTICE '3. Test image upload functionality';
  RAISE NOTICE '4. Monitor for any errors in production';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your QuietRoom production environment is configured!';
END $$;
