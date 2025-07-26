-- Create secure user-specific RLS policies
-- Run this AFTER confirming basic authentication works with permissive policies

-- STEP 1: Test the clerk_user_id function one more time
SELECT 'Final test of clerk_user_id function:' as status;
SELECT 
  public.clerk_user_id() as function_result,
  auth.jwt() ->> 'sub' as jwt_sub_claim,
  LENGTH(auth.jwt() ->> 'sub') as sub_length,
  auth.role() as current_role;

-- STEP 2: Drop the permissive testing policies
DROP POLICY IF EXISTS "Allow authenticated users to view entries" ON entries;
DROP POLICY IF EXISTS "Allow authenticated users to insert entries" ON entries;
DROP POLICY IF EXISTS "Allow authenticated users to update entries" ON entries;
DROP POLICY IF EXISTS "Allow authenticated users to delete entries" ON entries;

-- STEP 3: Create secure user-specific policies
CREATE POLICY "Users can view their own entries"
ON entries FOR SELECT
TO authenticated
USING (
  user_id = COALESCE(
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'user_id',
    ''
  )
);

CREATE POLICY "Users can create their own entries"
ON entries FOR INSERT
TO authenticated
WITH CHECK (
  user_id = COALESCE(
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'user_id',
    ''
  )
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own entries"
ON entries FOR UPDATE
TO authenticated
USING (
  user_id = COALESCE(
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'user_id',
    ''
  )
)
WITH CHECK (
  user_id = COALESCE(
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'user_id',
    ''
  )
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own entries"
ON entries FOR DELETE
TO authenticated
USING (
  user_id = COALESCE(
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'user_id',
    ''
  )
);

-- STEP 4: Verify final policies
SELECT 'Final RLS policies:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'entries';

SELECT 'Secure user-specific policies created! ✅' as result;
SELECT 'Users can now only access their own entries.' as security_note; 