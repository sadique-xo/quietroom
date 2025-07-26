-- Update JWT helper functions
CREATE OR REPLACE FUNCTION public.get_auth_user_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(current_setting('request.jwt.claims', true)::json->>'sub', '');
EXCEPTION
  WHEN others THEN RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clerk_user_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN public.get_auth_user_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
