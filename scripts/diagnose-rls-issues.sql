-- ============================================================
-- DETAILED RLS DIAGNOSTICS - FIND SPECIFIC ISSUES
-- ============================================================
-- This script provides detailed analysis of what's causing RLS validation failures
-- Run this in Supabase SQL Editor to see exactly what needs fixing

-- ============================================================
-- 1. DETAILED SETUP ANALYSIS
-- ============================================================

SELECT '🔍 DETAILED DIAGNOSTICS REPORT' as section_title;
SELECT '=================================' as separator;

-- Check 1: RLS Status Detail
SELECT 
  'RLS STATUS' as check_name,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED - SECURITY RISK!'
  END as status
FROM pg_tables 
WHERE tablename = 'entries' AND schemaname = 'public';

-- Check 2: Function Existence and Details
SELECT 
  'FUNCTION ANALYSIS' as check_name,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  CASE 
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
    ELSE '⚠️ NOT SECURITY DEFINER'
  END as security_status
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' AND p.proname = 'clerk_user_id'
UNION ALL
SELECT 
  'FUNCTION CHECK' as check_name,
  'clerk_user_id' as function_name,
  'MISSING' as return_type,
  'NONE' as arguments,
  false as security_definer,
  '❌ FUNCTION NOT FOUND!' as security_status
WHERE NOT EXISTS (
  SELECT 1 FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid 
  WHERE n.nspname = 'public' AND p.proname = 'clerk_user_id'
);

-- Check 3: Detailed Policy Analysis
SELECT 
  'POLICY DETAILS' as check_name,
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE 
    WHEN roles = '{authenticated}' THEN '✅ CORRECT ROLE'
    ELSE '❌ WRONG ROLE: ' || array_to_string(roles, ',')
  END as role_check,
  CASE 
    WHEN qual LIKE '%clerk_user_id%' OR with_check LIKE '%clerk_user_id%' THEN '✅ USES FUNCTION'
    WHEN qual LIKE '%user_id%' OR with_check LIKE '%user_id%' THEN '⚠️ BASIC CHECK'
    ELSE '❌ NO USER CHECK'
  END as user_check
FROM pg_policies 
WHERE tablename = 'entries' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Check 4: Missing Policies
WITH expected_policies AS (
  SELECT unnest(ARRAY[
    'Users can view their own entries',
    'Users can create their own entries', 
    'Users can update their own entries',
    'Users can delete their own entries'
  ]) as expected_name,
  unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as expected_cmd
),
existing_policies AS (
  SELECT policyname as existing_name, cmd as existing_cmd
  FROM pg_policies 
  WHERE tablename = 'entries' AND schemaname = 'public'
)
SELECT 
  'MISSING POLICIES' as check_name,
  ep.expected_name as missing_policy,
  ep.expected_cmd as missing_operation,
  '❌ NOT FOUND' as status
FROM expected_policies ep
LEFT JOIN existing_policies ex ON ep.expected_name = ex.existing_name AND ep.expected_cmd = ex.existing_cmd
WHERE ex.existing_name IS NULL;

-- ============================================================
-- 2. FUNCTION TESTING
-- ============================================================

SELECT '🧪 FUNCTION TESTING' as section_title;
SELECT '==================' as separator;

-- Test the function directly
SELECT 
  'CLERK_USER_ID FUNCTION TEST' as test_name,
  public.clerk_user_id() as function_result,
  CASE 
    WHEN public.clerk_user_id() IS NULL THEN '⚠️ Returns NULL'
    WHEN public.clerk_user_id() = '' THEN '⚠️ Returns empty string'
    WHEN LENGTH(public.clerk_user_id()) > 0 THEN '✅ Returns: ' || public.clerk_user_id()
    ELSE '❌ Unexpected result'
  END as analysis;

-- Test JWT claims
SELECT 
  'JWT CLAIMS ANALYSIS' as test_name,
  auth.role() as current_role,
  auth.jwt() ->> 'sub' as sub_claim,
  auth.jwt() ->> 'user_id' as user_id_claim,
  auth.jwt() ->> 'role' as role_claim,
  CASE 
    WHEN auth.jwt() IS NULL THEN '⚠️ No JWT available (running as postgres)'
    WHEN auth.jwt() ->> 'sub' IS NOT NULL THEN '✅ Has sub claim'
    WHEN auth.jwt() ->> 'user_id' IS NOT NULL THEN '✅ Has user_id claim'
    ELSE '❌ No user identifier in JWT'
  END as jwt_status;

-- ============================================================
-- 3. TABLE STRUCTURE ANALYSIS
-- ============================================================

SELECT '📋 TABLE STRUCTURE' as section_title;
SELECT '==================' as separator;

-- Check table structure
SELECT 
  'COLUMN ANALYSIS' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'user_id' AND data_type = 'text' THEN '✅ TEXT type'
    WHEN column_name = 'user_id' AND data_type != 'text' THEN '⚠️ Type: ' || data_type
    WHEN column_name = 'user_id' THEN '✅ user_id column exists'
    ELSE ''
  END as analysis
FROM information_schema.columns 
WHERE table_name = 'entries' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  'INDEX ANALYSIS' as check_name,
  indexname,
  indexdef,
  CASE 
    WHEN indexdef LIKE '%user_id%' THEN '✅ user_id indexed'
    ELSE 'ℹ️ Other index'
  END as analysis
FROM pg_indexes 
WHERE tablename = 'entries' AND schemaname = 'public';

-- ============================================================
-- 4. ACTUAL DATA TESTING
-- ============================================================

SELECT '📊 DATA TESTING' as section_title;
SELECT '===============' as separator;

-- Create minimal test data
INSERT INTO entries (user_id, date, photo_url, photo_filename, photo_size, photo_format, caption, timestamp)
VALUES 
  ('diagnostic_user_1', '2024-12-01', 'https://test.com/1.jpg', 'test1.jpg', 1000, 'jpg', 'Test 1', 1733020800000),
  ('diagnostic_user_2', '2024-12-02', 'https://test.com/2.jpg', 'test2.jpg', 2000, 'jpg', 'Test 2', 1733107200000)
ON CONFLICT (user_id, date) DO NOTHING;

-- Test data visibility
SELECT 
  'DATA VISIBILITY TEST' as test_name,
  COUNT(*) as total_entries,
  COUNT(DISTINCT user_id) as unique_users,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data inserted successfully'
    ELSE '❌ No data could be inserted'
  END as insert_test
FROM entries 
WHERE user_id IN ('diagnostic_user_1', 'diagnostic_user_2');

-- Test user isolation
SELECT 
  'USER ISOLATION TEST' as test_name,
  user_id,
  COUNT(*) as entry_count,
  'Each user should only see their own data' as expected_behavior
FROM entries 
WHERE user_id IN ('diagnostic_user_1', 'diagnostic_user_2')
GROUP BY user_id;

-- ============================================================
-- 5. SPECIFIC ISSUE IDENTIFICATION
-- ============================================================

SELECT '🚨 ISSUE IDENTIFICATION' as section_title;
SELECT '=======================' as separator;

-- Issue 1: Check for common problems
SELECT 
  'COMMON ISSUES CHECK' as issue_category,
  'RLS Enabled' as issue_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'entries' AND schemaname = 'public' AND rowsecurity = false
    ) THEN '❌ CRITICAL: RLS is disabled on entries table'
    ELSE '✅ RLS is enabled'
  END as status
UNION ALL
SELECT 
  'COMMON ISSUES CHECK' as issue_category,
  'Function Exists' as issue_type,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'clerk_user_id'
    ) THEN '❌ CRITICAL: clerk_user_id function missing'
    ELSE '✅ Function exists'
  END as status
UNION ALL
SELECT 
  'COMMON ISSUES CHECK' as issue_category,
  'Policy Count' as issue_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'entries') < 4 
    THEN '❌ CRITICAL: Missing RLS policies (found ' || 
         (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'entries') || ', need 4)'
    ELSE '✅ All policies present'
  END as status;

-- Issue 2: Check for permission problems
SELECT 
  'PERMISSION ISSUES' as issue_category,
  'Function Permissions' as issue_type,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc p 
      WHERE p.proname = 'clerk_user_id' AND p.prosecdef = true
    ) THEN '⚠️ Function not SECURITY DEFINER'
    ELSE '✅ Function has correct permissions'
  END as status;

-- ============================================================
-- 6. RECOMMENDED FIXES
-- ============================================================

SELECT '🔧 RECOMMENDED FIXES' as section_title;
SELECT '===================' as separator;

-- Generate fix recommendations based on issues found
SELECT 
  'FIX RECOMMENDATIONS' as category,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'entries' AND rowsecurity = true
    ) THEN '1. Enable RLS: ALTER TABLE entries ENABLE ROW LEVEL SECURITY;'
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'clerk_user_id'
    ) THEN '2. Create clerk_user_id function (see create-clerk-user-function.sql)'
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'entries') < 4 
    THEN '3. Create missing RLS policies (see create-rls-policies.sql)'
    ELSE '✅ No critical issues found! Check warnings above.'
  END as recommended_action;

-- ============================================================
-- 7. CLEANUP
-- ============================================================

-- Remove diagnostic test data
DELETE FROM entries WHERE user_id IN ('diagnostic_user_1', 'diagnostic_user_2');

SELECT '🧹 DIAGNOSTIC COMPLETE' as final_status;
SELECT 'Check the results above for specific issues marked with ❌ or ⚠️' as instruction; 