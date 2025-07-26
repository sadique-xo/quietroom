-- Configure Supabase to use Clerk's JWT
-- For Supabase instances with restricted permissions

-- Create a helper function to get user ID from JWT claims
CREATE OR REPLACE FUNCTION public.get_auth_user_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(current_setting('request.jwt.claims', true)::json->>'sub', '');
EXCEPTION
  WHEN others THEN RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a custom function to cast Clerk's string IDs to text
-- This avoids modifying the auth.uid() function directly
CREATE OR REPLACE FUNCTION public.clerk_user_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN public.get_auth_user_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the configuration
SELECT public.get_auth_user_id() as user_id_from_jwt;

-- Note: For the JWT verification to work properly, you need to configure
-- the JWT settings in the Supabase Dashboard:
-- 1. Go to Authentication > Settings > JWT Settings or Third Party Auth
-- 2. Set JWT Key URL to: https://generous-ladybug-13.clerk.accounts.dev/.well-known/jwks.json
-- 3. Set JWT Default Role to: authenticated
-- 4. Set JWT Issuer to: https://generous-ladybug-13.clerk.accounts.dev 