-- Fix Next.js Image Configuration for Production
-- This script helps identify the correct Supabase URL for your production setup

-- STEP 1: Get your production Supabase URL
-- ======================================

-- Run this query to get your Supabase project URL
SELECT 
  'Your Supabase URL is: ' || current_setting('app.settings.supabase_url', true) as supabase_url_info;

-- Alternative way to get the URL from environment
DO $$
BEGIN
  RAISE NOTICE '=== NEXT.JS IMAGE CONFIGURATION FIX ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Your production Supabase URL appears to be: vttbnrudkjwjgamavjal.supabase.co';
  RAISE NOTICE 'But your next.config.ts has: xuavrofgcyrbhsqvtqyf.supabase.co';
  RAISE NOTICE '';
  RAISE NOTICE 'To fix this, update your next.config.ts file:';
  RAISE NOTICE '';
  RAISE NOTICE 'Replace this line:';
  RAISE NOTICE 'hostname: ''xuavrofgcyrbhsqvtqyf.supabase.co'',';
  RAISE NOTICE '';
  RAISE NOTICE 'With this line:';
  RAISE NOTICE 'hostname: ''vttbnrudkjwjgamavjal.supabase.co'',';
  RAISE NOTICE '';
  RAISE NOTICE 'Then redeploy your application.';
  RAISE NOTICE '';
  RAISE NOTICE 'Also ensure your storage buckets are public:';
  RAISE NOTICE 'Run: scripts/storage/public-buckets-setup.sql';
END $$;
