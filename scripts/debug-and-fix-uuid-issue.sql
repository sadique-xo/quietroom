-- Debug and fix any remaining UUID issues
-- Run this script as postgres role in Supabase SQL Editor

-- STEP 1: Check current RLS policies
SELECT 'Current RLS Policies on entries table:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'entries';

-- STEP 2: Check if clerk_user_id function exists and works
SELECT 'Testing clerk_user_id function:' as info;
SELECT public.clerk_user_id() as current_user_id;

-- STEP 3: Check table constraints
SELECT 'Current table constraints:' as info;
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'entries';

-- STEP 4: Check for any triggers that might cause issues
SELECT 'Current triggers on entries table:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'entries';

-- STEP 5: Clear cache and recreate policies
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- Disable and re-enable RLS to clear any cache
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Recreate policies with explicit TEXT casting
CREATE POLICY "Users can view their own entries"
ON entries FOR SELECT
TO authenticated
USING (user_id::TEXT = (public.clerk_user_id())::TEXT);

CREATE POLICY "Users can create their own entries"
ON entries FOR INSERT
TO authenticated
WITH CHECK (user_id::TEXT = (public.clerk_user_id())::TEXT);

CREATE POLICY "Users can update their own entries"
ON entries FOR UPDATE
TO authenticated
USING (user_id::TEXT = (public.clerk_user_id())::TEXT)
WITH CHECK (user_id::TEXT = (public.clerk_user_id())::TEXT);

CREATE POLICY "Users can delete their own entries"
ON entries FOR DELETE
TO authenticated
USING (user_id::TEXT = (public.clerk_user_id())::TEXT);

-- STEP 6: Verify everything is working
SELECT 'Final verification:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND column_name = 'user_id';

SELECT 'RLS Policies after fix:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'entries';

SELECT 'UUID issue debug and fix completed! ✅' as result; 