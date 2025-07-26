-- QuietRoom Storage Troubleshooting Script
-- Run this if you encounter issues with the storage extension

-- STEP 1: Check if storage extension exists
-- =======================================

-- List available extensions
SELECT 'Available extensions:' as info;
SELECT 
  name, 
  default_version, 
  installed_version, 
  comment 
FROM pg_available_extensions 
WHERE name = 'storage' OR name LIKE '%storage%'
ORDER BY name;

-- Check if storage schema exists
SELECT 'Storage schema check:' as info;
SELECT EXISTS(
  SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
) as storage_schema_exists;

-- STEP 2: Alternative approach for storage tables
-- ============================================

-- If the storage extension is unavailable, we can create the tables manually
DO $$
BEGIN
  -- Create schema if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
  ) THEN
    CREATE SCHEMA storage;
    RAISE NOTICE 'Created storage schema.';
  END IF;
  
  -- Create buckets table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    CREATE TABLE storage.buckets (
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
    RAISE NOTICE 'Created storage.buckets table.';
  END IF;
  
  -- Create objects table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) THEN
    CREATE TABLE storage.objects (
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
    
    -- Add path_tokens generation if possible
    BEGIN
      ALTER TABLE storage.objects 
      ALTER COLUMN path_tokens 
      SET DEFAULT string_to_array(name, '/');
      RAISE NOTICE 'Added path_tokens default.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not set path_tokens default: %', SQLERRM;
    END;
    
    -- Add foreign key if possible
    BEGIN
      ALTER TABLE storage.objects 
      ADD CONSTRAINT objects_buckets_fkey 
      FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);
      RAISE NOTICE 'Added foreign key constraint.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add foreign key: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Created storage.objects table.';
  END IF;
END $$;

-- STEP 3: Create helper functions
-- ============================

-- Create storage.foldername function if it doesn't exist
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] AS $$
BEGIN
  RETURN string_to_array(name, '/');
EXCEPTION WHEN OTHERS THEN
  RETURN ARRAY[]::text[];
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Contact Supabase Support
-- ==============================

-- If you're still having issues after running these scripts,
-- you'll need to contact Supabase support to enable the storage extension
-- on your project. The storage extension is typically pre-installed on
-- all Supabase projects, but there might be issues with your specific project.

-- Display message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STORAGE TROUBLESHOOTING ===';
  RAISE NOTICE 'If you continue to have issues with the storage extension:';
  RAISE NOTICE '1. Contact Supabase support at support@supabase.io';
  RAISE NOTICE '2. Provide your project reference ID';
  RAISE NOTICE '3. Request that they enable the storage extension on your project';
  RAISE NOTICE '';
  RAISE NOTICE 'The storage extension should be pre-installed on all Supabase projects.';
  RAISE NOTICE 'This script attempts to create the necessary tables manually as a workaround.';
END $$;
