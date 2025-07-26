-- ============================================================
-- SIMPLE RLS VERIFICATION - Easy to Read Results
-- ============================================================
-- This gives you the key information in a simple format

-- 1. Check RLS Status
SELECT 'RLS ENABLED?' as question, 
       CASE WHEN rowsecurity THEN 'YES ✅' ELSE 'NO ❌' END as answer
FROM pg_tables 
WHERE tablename = 'entries' AND schemaname = 'public';

-- 2. Check Function Exists  
SELECT 'clerk_user_id FUNCTION EXISTS?' as question,
       CASE WHEN COUNT(*) > 0 THEN 'YES ✅' ELSE 'NO ❌' END as answer
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' AND p.proname = 'clerk_user_id';

-- 3. Count RLS Policies
SELECT 'HOW MANY RLS POLICIES?' as question,
       COUNT(*)::text || ' policies' as answer,
       CASE WHEN COUNT(*) = 4 THEN '✅ CORRECT' ELSE '❌ NEED 4' END as status
FROM pg_policies 
WHERE tablename = 'entries' AND schemaname = 'public';

-- 4. List Policy Names
SELECT 'EXISTING POLICY NAMES:' as info_type,
       policyname as policy_name,
       cmd as for_operation
FROM pg_policies 
WHERE tablename = 'entries' AND schemaname = 'public'
ORDER BY cmd;

-- 5. Test Function
SELECT 'FUNCTION TEST:' as info_type,
       public.clerk_user_id() as returns_value,
       CASE 
         WHEN public.clerk_user_id() = '' THEN 'Empty (normal for postgres role)'
         WHEN public.clerk_user_id() IS NULL THEN 'NULL'
         ELSE 'Has value: ' || public.clerk_user_id()
       END as explanation; 