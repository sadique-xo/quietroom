-- Fix Storage Bucket Access Issues (Alternative Approach)
-- Run this script as postgres role in the Supabase SQL editor

DO $$
BEGIN
    -- First verify we're running as postgres
    IF NOT (SELECT usesuper FROM pg_user WHERE usename = current_user) THEN
        RAISE EXCEPTION 'Must run as superuser/postgres role. Current user: %', current_user;
    END IF;

    -- 1. Verify storage schema exists and we have access
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        RAISE EXCEPTION 'Storage schema does not exist. Please verify Supabase storage is enabled.';
    END IF;

    -- 2. Verify buckets table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        RAISE EXCEPTION 'storage.buckets table does not exist. Please verify Supabase storage is properly set up.';
    END IF;

    -- 3. Verify objects table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        RAISE EXCEPTION 'storage.objects table does not exist. Please verify Supabase storage is properly set up.';
    END IF;

    -- 4. Verify clerk_user_id function exists
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clerk_user_id' AND pronamespace = 'public'::regnamespace) THEN
        RAISE EXCEPTION 'public.clerk_user_id() function does not exist. Please create it first.';
    END IF;

    -- If we get here, all prerequisites are met
    RAISE NOTICE 'Prerequisites verified successfully.';
END $$;

-- Now proceed with the actual policy setup
BEGIN;

    -- Enable RLS on buckets table
    ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
    
    -- Revoke all on buckets from public to start fresh
    REVOKE ALL ON storage.buckets FROM public;
    REVOKE ALL ON storage.buckets FROM anon;
    REVOKE ALL ON storage.buckets FROM authenticated;
    
    -- Grant necessary permissions
    GRANT SELECT ON storage.buckets TO anon;
    GRANT SELECT ON storage.buckets TO authenticated;
    
    -- Drop existing policies to start fresh
    DROP POLICY IF EXISTS "Authenticated users can see available buckets" ON storage.buckets;
    
    -- Create new bucket access policy
    CREATE POLICY "Authenticated users can see available buckets"
    ON storage.buckets FOR SELECT
    TO authenticated
    USING (
        id IN ('journal-entries', 'thumbnails', 'quietroom')
    );
    
    -- Enable RLS on objects table
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    
    -- Revoke all on objects from public to start fresh
    REVOKE ALL ON storage.objects FROM public;
    REVOKE ALL ON storage.objects FROM anon;
    REVOKE ALL ON storage.objects FROM authenticated;
    
    -- Grant necessary permissions
    GRANT SELECT ON storage.objects TO anon;
    GRANT ALL ON storage.objects TO authenticated;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can access their own journal images" ON storage.objects;
    DROP POLICY IF EXISTS "Thumbnails are publicly readable" ON storage.objects;
    DROP POLICY IF EXISTS "Users can insert their own thumbnails" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;
    
    -- Create new policies
    CREATE POLICY "Users can access their own journal images"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'journal-entries' 
        AND auth.role() = 'authenticated' 
        AND (storage.foldername(name))[1] = public.clerk_user_id()
    );
    
    CREATE POLICY "Thumbnails are publicly readable"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'thumbnails');
    
    CREATE POLICY "Users can manage their own thumbnails"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'thumbnails' 
        AND auth.role() = 'authenticated' 
        AND (storage.foldername(name))[1] = public.clerk_user_id()
    );

    -- Verify the buckets exist and set their privacy
    DO $$
    BEGIN
        -- Check journal-entries bucket
        IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'journal-entries') THEN
            RAISE NOTICE 'Creating journal-entries bucket...';
            INSERT INTO storage.buckets (id, name, public) VALUES ('journal-entries', 'journal-entries', false);
        ELSE
            UPDATE storage.buckets SET public = false WHERE id = 'journal-entries';
        END IF;

        -- Check thumbnails bucket
        IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'thumbnails') THEN
            RAISE NOTICE 'Creating thumbnails bucket...';
            INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', false);
        ELSE
            UPDATE storage.buckets SET public = false WHERE id = 'thumbnails';
        END IF;
    END $$;

COMMIT;

-- Verify setup
DO $$
DECLARE
    bucket_count int;
    policy_count int;
BEGIN
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
    SELECT COUNT(*) INTO policy_count FROM pg_policies 
    WHERE schemaname = 'storage' AND (tablename = 'buckets' OR tablename = 'objects');
    
    RAISE NOTICE 'Setup complete:';
    RAISE NOTICE '- Found % buckets', bucket_count;
    RAISE NOTICE '- Created % storage policies', policy_count;
    
    -- Additional checks
    RAISE NOTICE 'Verifying RLS is enabled:';
    FOR r IN (
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'storage' AND tablename IN ('buckets', 'objects')
    ) LOOP
        RAISE NOTICE '- % RLS enabled: %', r.tablename, r.rowsecurity;
    END LOOP;
END $$; 