-- QuietRoom Production Setup - Part 2: Storage Buckets
-- Run this as postgres role in Supabase SQL Editor

-- NOTE: If you encounter issues with the storage extension,
-- you may need to contact Supabase support to enable it on your project.
-- This is typically pre-installed on Supabase projects.

-- STEP 1: Create storage buckets
-- =============================

-- First check if storage schema exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
  ) THEN
    RAISE NOTICE 'Storage schema does not exist. You may need to contact Supabase support.';
    -- Create schema if possible
    BEGIN
      CREATE SCHEMA IF NOT EXISTS storage;
      RAISE NOTICE 'Created storage schema.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create storage schema. Error: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Storage schema exists.';
  END IF;
END $$;

-- Check if buckets table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    RAISE NOTICE 'Storage buckets table does not exist. Creating it...';
    
    -- Create buckets table
    CREATE TABLE IF NOT EXISTS storage.buckets (
      id text NOT NULL PRIMARY KEY,
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
      id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      bucket_id text,
      name text,
      owner uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      last_accessed_at timestamptz DEFAULT now(),
      metadata jsonb,
      path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
      CONSTRAINT objects_buckets_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
    );
    
    RAISE NOTICE 'Created storage tables.';
  ELSE
    RAISE NOTICE 'Storage buckets table exists.';
  END IF;
END $$;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('journal-entries', 'journal-entries', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('thumbnails', 'thumbnails', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verify buckets were created
SELECT 'Bucket configuration:' as info;
SELECT 
  id, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
ORDER BY id;
