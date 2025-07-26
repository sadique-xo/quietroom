-- ============================================================
-- QUICK RLS ISSUE CHECKER
-- ============================================================
-- Run this script to see exactly what RLS issues need fixing

SELECT '🔍 QUICK RLS DIAGNOSIS' as title;

-- 1. Is RLS enabled?
SELECT 
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS is ENABLED'
    ELSE '❌ CRITICAL: RLS is DISABLED on entries table!'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'entries' AND schemaname = 'public';

-- 2. Does clerk_user_id function exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'clerk_user_id'
    ) THEN '✅ clerk_user_id function EXISTS'
    ELSE '❌ CRITICAL: clerk_user_id function MISSING!'
  END as function_status;

-- 3. How many RLS policies exist?
SELECT 
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ All 4 RLS policies exist'
    WHEN COUNT(*) > 0 THEN '⚠️ Only ' || COUNT(*) || ' policies found (need 4)'
    ELSE '❌ CRITICAL: NO RLS policies found!'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'entries' AND schemaname = 'public';

-- 4. List existing policies
SELECT 
  'EXISTING POLICIES:' as label,
  policyname as policy_name,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'entries' AND schemaname = 'public'
ORDER BY cmd;

-- 5. Test the function
SELECT 
  'FUNCTION TEST:' as label,
  public.clerk_user_id() as function_result,
  CASE 
    WHEN public.clerk_user_id() = '' THEN 'Returns empty string (normal when not authenticated)'
    WHEN public.clerk_user_id() IS NULL THEN 'Returns NULL'
    ELSE 'Returns: ' || public.clerk_user_id()
  END as interpretation;

-- 6. Check JWT status
SELECT 
  'JWT STATUS:' as label,
  auth.role() as current_role,
  CASE 
    WHEN auth.jwt() IS NULL THEN 'No JWT (normal for postgres role)'
    ELSE 'JWT present'
  END as jwt_status;

-- 7. Show what needs fixing
SELECT 
  'WHAT TO FIX:' as priority,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'entries' AND schemaname = 'public' AND rowsecurity = true
    ) THEN 'URGENT: Run scripts/create-rls-policies.sql to enable RLS'
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'clerk_user_id'
    ) THEN 'URGENT: Run scripts/create-clerk-user-function.sql'
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'entries') < 4 
    THEN 'URGENT: Run scripts/create-rls-policies.sql to add missing policies'
    ELSE '✅ All critical components are in place!'
  END as action_needed; 