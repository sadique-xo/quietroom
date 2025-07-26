-- Enable Row Level Security on entries table
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- Create policy for SELECT operations
-- This allows users to view only their own entries
CREATE POLICY "Users can view their own entries"
ON entries
FOR SELECT
TO authenticated
USING (user_id = public.clerk_user_id());

-- Create policy for INSERT operations
-- This allows users to create entries with their user ID
CREATE POLICY "Users can create their own entries"
ON entries
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.clerk_user_id());

-- Create policy for UPDATE operations
-- This allows users to update only their own entries
CREATE POLICY "Users can update their own entries"
ON entries
FOR UPDATE
TO authenticated
USING (user_id = public.clerk_user_id())
WITH CHECK (user_id = public.clerk_user_id());

-- Create policy for DELETE operations
-- This allows users to delete only their own entries
CREATE POLICY "Users can delete their own entries"
ON entries
FOR DELETE
TO authenticated
USING (user_id = public.clerk_user_id());

-- Note: These policies work with Clerk authentication because:
-- 1. The Clerk JWT template sets the "sub" claim to the Clerk user ID
-- 2. Our custom public.clerk_user_id() function returns the Clerk user ID from the JWT
-- 3. We're passing the Clerk JWT to Supabase in the Authorization header
