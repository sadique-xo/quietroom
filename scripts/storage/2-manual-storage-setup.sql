-- QuietRoom Production Setup - Part 2: Manual Storage Setup
-- Run this as postgres role in Supabase SQL Editor
-- This approach manually creates storage infrastructure when the storage extension is not available

-- STEP 1: Check and create storage schema
-- =====================================

-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- STEP 2: Create storage tables manually
-- ====================================

-- Create buckets table
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- Create objects table
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[]
);

-- Add foreign key constraint
ALTER TABLE storage.objects 
DROP CONSTRAINT IF EXISTS objects_buckets_fkey;

ALTER TABLE storage.objects 
ADD CONSTRAINT objects_buckets_fkey 
FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);

-- STEP 3: Create helper functions
-- ============================

-- Create storage.foldername function
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] AS $$
BEGIN
  RETURN string_to_array(name, '/');
EXCEPTION WHEN OTHERS THEN
  RETURN ARRAY[]::text[];
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Create and configure buckets
-- ==================================

-- Insert buckets with public=true (critical for image display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('journal-entries', 'journal-entries', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- STEP 5: Enable RLS and grant permissions
-- ======================================

-- Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON SCHEMA storage TO postgres;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- STEP 6: Verify setup
-- ==================

-- Check storage schema exists
SELECT 'Storage schema exists:' as info;
SELECT EXISTS(
  SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
) as storage_schema_exists;

-- Check tables exist
SELECT 'Storage tables:' as info;
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'storage'
ORDER BY table_name;

-- Check buckets configuration
SELECT 'Storage buckets:' as info;
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
ORDER BY id;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '=== MANUAL STORAGE SETUP COMPLETE ===';
  RAISE NOTICE 'Storage schema and tables created manually.';
  RAISE NOTICE 'Buckets are configured as public for image display.';
  RAISE NOTICE 'Ready for storage policies setup.';
END $$;
