-- ============================================================
-- STEP-BY-STEP RLS DIAGNOSTIC
-- ============================================================
-- Run each section separately to see detailed results
-- Copy and paste each section one at a time

-- ============================================================
-- STEP 1: CHECK RLS BASICS
-- ============================================================

SELECT 'STEP 1: RLS BASICS' as step_title;

-- Check if RLS is enabled
SELECT 
  'RLS Status Check' as test_name,
  tablename,
  rowsecurity as is_rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as status
FROM pg_tables 
WHERE tablename = 'entries' AND schemaname = 'public';

-- Check function existence
SELECT 
  'Function Check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'clerk_user_id'
    ) THEN '✅ clerk_user_id function EXISTS'
    ELSE '❌ clerk_user_id function MISSING'
  END as status;

-- ============================================================
-- STEP 2: CHECK POLICIES IN DETAIL
-- ============================================================

SELECT 'STEP 2: POLICY ANALYSIS' as step_title;

-- Count policies
SELECT 
  'Policy Count' as test_name,
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ All 4 policies exist'
    WHEN COUNT(*) > 0 THEN '⚠️ Only ' || COUNT(*) || ' policies (need 4)'
    ELSE '❌ NO policies found'
  END as status
FROM pg_policies 
WHERE tablename = 'entries' AND schemaname = 'public';

-- List all existing policies
SELECT 
  'Existing Policies' as test_name,
  policyname as policy_name,
  cmd as operation,
  permissive as is_permissive,
  array_to_string(roles, ', ') as applies_to_roles
FROM pg_policies 
WHERE tablename = 'entries' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- ============================================================
-- STEP 3: TEST FUNCTION BEHAVIOR
-- ============================================================

SELECT 'STEP 3: FUNCTION TESTING' as step_title;

-- Test clerk_user_id function
SELECT 
  'clerk_user_id() Test' as test_name,
  public.clerk_user_id() as function_returns,
  CASE 
    WHEN public.clerk_user_id() IS NULL THEN 'Returns NULL'
    WHEN public.clerk_user_id() = '' THEN 'Returns empty string (normal when not authenticated)'
    ELSE 'Returns: ' || public.clerk_user_id()
  END as interpretation;

-- Check JWT details
SELECT 
  'JWT Analysis' as test_name,
  auth.role() as current_database_role,
  CASE 
    WHEN auth.jwt() IS NULL THEN 'No JWT (normal for postgres role)'
    ELSE 'JWT is present'
  END as jwt_status,
  auth.jwt() ->> 'sub' as jwt_sub_claim,
  auth.jwt() ->> 'role' as jwt_role_claim;

-- ============================================================
-- STEP 4: CHECK SPECIFIC POLICY CONTENT
-- ============================================================

SELECT 'STEP 4: POLICY CONTENT ANALYSIS' as step_title;

-- Analyze SELECT policy
SELECT 
  'SELECT Policy Analysis' as check_type,
  policyname,
  qual as policy_condition,
  CASE 
    WHEN qual LIKE '%clerk_user_id%' THEN '✅ Uses clerk_user_id function'
    WHEN qual LIKE '%user_id%' THEN '⚠️ Has user_id check but may not use function'
    ELSE '❌ No user identification logic'
  END as analysis
FROM pg_policies 
WHERE tablename = 'entries' AND cmd = 'SELECT';

-- Analyze INSERT policy
SELECT 
  'INSERT Policy Analysis' as check_type,
  policyname,
  with_check as policy_condition,
  CASE 
    WHEN with_check LIKE '%clerk_user_id%' THEN '✅ Uses clerk_user_id function'
    WHEN with_check LIKE '%user_id%' THEN '⚠️ Has user_id check but may not use function'
    ELSE '❌ No user identification logic'
  END as analysis
FROM pg_policies 
WHERE tablename = 'entries' AND cmd = 'INSERT';

-- ============================================================
-- STEP 5: IDENTIFY MISSING COMPONENTS
-- ============================================================

SELECT 'STEP 5: MISSING COMPONENTS' as step_title;

-- Check for missing policies by name
WITH expected_policies AS (
  VALUES 
    ('Users can view their own entries', 'SELECT'),
    ('Users can create their own entries', 'INSERT'),
    ('Users can update their own entries', 'UPDATE'),
    ('Users can delete their own entries', 'DELETE')
)
SELECT 
  'Missing Policy Check' as check_type,
  ep.column1 as expected_policy_name,
  ep.column2 as expected_operation,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'entries' 
      AND policyname = ep.column1 
      AND cmd = ep.column2
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM expected_policies ep;

SELECT 'DIAGNOSIS COMPLETE' as final_message;
SELECT 'Run each step above separately if you want to see specific details' as instruction; 