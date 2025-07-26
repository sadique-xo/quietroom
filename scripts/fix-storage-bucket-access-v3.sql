-- Fix Storage Bucket Access Issues (Corrected Version)
-- Run this script as postgres role in the Supabase SQL editor

-- First, verify we're running as postgres and have proper access
DO $$
DECLARE
    current_role text;
    has_storage boolean;
    has_buckets boolean;
BEGIN
    -- Check current role
    SELECT current_user INTO current_role;
    
    IF current_role != 'postgres' THEN
        RAISE EXCEPTION 'Must run as postgres role. Current role: %', current_role;
    END IF;

    -- Check if storage schema exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = 'storage'
    ) INTO has_storage;

    IF NOT has_storage THEN
        RAISE EXCEPTION 'Storage schema does not exist. Please enable Storage in your Supabase project.';
    END IF;

    -- Check if buckets table exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'storage' 
        AND table_name = 'buckets'
    ) INTO has_buckets;

    IF NOT has_buckets THEN
        RAISE EXCEPTION 'storage.buckets table does not exist. Please enable Storage in your Supabase project.';
    END IF;

    -- If we get here, we're good to proceed
    RAISE NOTICE 'Running as %. Storage schema and buckets table verified.', current_role;
END $$;

-- Now proceed with the actual setup
BEGIN;
    -- 1. Set up storage.buckets access
    ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

    -- Grant basic access
    GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated;
    GRANT ALL ON storage.buckets TO postgres;
    GRANT SELECT ON storage.buckets TO anon, authenticated;

    -- 2. Set up storage.objects access
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    
    GRANT ALL ON storage.objects TO postgres;
    GRANT SELECT ON storage.objects TO anon, authenticated;
    GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

    -- 3. Create bucket policies
    -- First, drop existing policies
    DROP POLICY IF EXISTS "Authenticated users can see available buckets" ON storage.buckets;
    DROP POLICY IF EXISTS "Users can access their own journal images" ON storage.objects;
    DROP POLICY IF EXISTS "Thumbnails are publicly readable" ON storage.objects;
    DROP POLICY IF EXISTS "Users can manage their own thumbnails" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Authenticated users can see available buckets"
    ON storage.buckets FOR SELECT
    TO authenticated
    USING (
        id IN ('journal-entries', 'thumbnails', 'quietroom')
    );

    CREATE POLICY "Users can access their own journal images"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'journal-entries' 
        AND auth.role() = 'authenticated' 
        AND (storage.foldername(name))[1] = auth.uid()
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
        AND (storage.foldername(name))[1] = auth.uid()
    );

    -- 4. Ensure buckets exist with correct settings
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
        ('journal-entries', 'journal-entries', false),
        ('thumbnails', 'thumbnails', false)
    ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public;

    -- 5. Verify setup
    DO $$
    DECLARE
        bucket_count int;
        policy_count int;
    BEGIN
        SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
        SELECT COUNT(*) INTO policy_count 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND (tablename = 'buckets' OR tablename = 'objects');

        RAISE NOTICE 'Setup complete:';
        RAISE NOTICE '- Found % buckets', bucket_count;
        RAISE NOTICE '- Created % storage policies', policy_count;
        
        -- Show bucket details
        RAISE NOTICE 'Bucket configuration:';
        FOR r IN (
            SELECT id, public 
            FROM storage.buckets 
            ORDER BY id
        ) LOOP
            RAISE NOTICE '- Bucket: %, Public: %', r.id, r.public;
        END LOOP;

        -- Show RLS status
        RAISE NOTICE 'RLS Status:';
        FOR r IN (
            SELECT tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'storage' 
            AND tablename IN ('buckets', 'objects')
        ) LOOP
            RAISE NOTICE '- %: RLS %', r.tablename, 
                CASE WHEN r.rowsecurity THEN 'enabled' ELSE 'disabled' END;
        END LOOP;
    END $$;
COMMIT; 