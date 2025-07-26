-- Debug and fix RLS policies for entries table
-- Run this script as postgres role in Supabase SQL Editor

-- STEP 1: Test the clerk_user_id function
SELECT 'Testing clerk_user_id function:' as status;
SELECT 
  public.clerk_user_id() as clerk_function_result,
  auth.jwt() ->> 'sub' as jwt_sub_claim,
  auth.jwt() ->> 'user_id' as jwt_user_id_claim,
  auth.role() as current_role;

-- STEP 2: Check current RLS policies
SELECT 'Current RLS policies:' as status;
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

-- STEP 3: Drop existing policies and recreate with better logic
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- STEP 4: Create more permissive policies for debugging
-- Temporarily allow all authenticated users to test
CREATE POLICY "Allow authenticated users to view entries"
ON entries FOR SELECT
TO authenticated
USING (true);  -- Temporarily permissive

CREATE POLICY "Allow authenticated users to insert entries"
ON entries FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');  -- Check role only

CREATE POLICY "Allow authenticated users to update entries"
ON entries FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete entries"
ON entries FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- STEP 5: Test if policies work
SELECT 'Testing policies - this should show table structure:' as status;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
ORDER BY ordinal_position;

-- STEP 6: After testing, we'll create proper user-specific policies
-- But first let's see if the basic authentication works

SELECT 'Temporary permissive policies created for debugging! ✅' as result;
SELECT 'Next: Test your app, then run the secure policies script.' as next_step; 