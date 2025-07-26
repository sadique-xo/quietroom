-- Create function to extract Clerk user ID from JWT
-- This function is used by RLS policies to get the current user's ID from the JWT token

CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'sub',           -- Try 'sub' claim first (Clerk's default)
    auth.jwt() ->> 'user_id',       -- Fall back to custom 'user_id' claim
    ''                              -- Default to empty string if neither exists
  );
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION public.clerk_user_id() TO authenticated;

-- Test the function (this should return the current user's ID when authenticated)
-- SELECT public.clerk_user_id(); 