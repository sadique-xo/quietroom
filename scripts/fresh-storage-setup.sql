-- Fresh Storage Setup Script
-- Run this as postgres role in Supabase SQL Editor

-- 1. First make sure we have the storage extension
CREATE EXTENSION IF NOT EXISTS "storage";

-- 2. Create fresh tables
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    CONSTRAINT buckets_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    CONSTRAINT objects_pkey PRIMARY KEY (id),
    CONSTRAINT objects_buckets_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- 3. Create the buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('journal-entries', 'journal-entries', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('thumbnails', 'thumbnails', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Set up RLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions
GRANT ALL ON SCHEMA storage TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres;

GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- 6. Create policies

-- Bucket Policies
DROP POLICY IF EXISTS "Authenticated users can see available buckets" ON storage.buckets;
CREATE POLICY "Authenticated users can see available buckets"
ON storage.buckets FOR SELECT
TO authenticated
USING (
    id IN ('journal-entries', 'thumbnails')
);

-- Object Policies for journal-entries
DROP POLICY IF EXISTS "Journal entries access" ON storage.objects;
CREATE POLICY "Journal entries access"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'journal-entries' 
    AND auth.role() = 'authenticated'
    AND auth.uid() = (storage.foldername(name))[1]
);

-- Object Policies for thumbnails
DROP POLICY IF EXISTS "Thumbnails are publicly readable" ON storage.objects;
CREATE POLICY "Thumbnails are publicly readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "Users can manage their thumbnails" ON storage.objects;
CREATE POLICY "Users can manage their thumbnails"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
    AND auth.uid() = (storage.foldername(name))[1]
);

-- 7. Verify setup
DO $$
DECLARE
    bucket_count int;
    policy_count int;
BEGIN
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'storage';
    
    RAISE NOTICE 'Setup verification:';
    RAISE NOTICE '- Buckets created: %', bucket_count;
    RAISE NOTICE '- Storage policies created: %', policy_count;
    
    -- Show bucket details
    RAISE NOTICE 'Bucket configuration:';
    FOR r IN (
        SELECT id, public, file_size_limit, allowed_mime_types 
        FROM storage.buckets 
        ORDER BY id
    ) LOOP
        RAISE NOTICE 'Bucket: %', r.id;
        RAISE NOTICE '  - Public: %', r.public;
        RAISE NOTICE '  - Size limit: % bytes', r.file_size_limit;
        RAISE NOTICE '  - Allowed types: %', r.allowed_mime_types;
    END LOOP;
END $$; 