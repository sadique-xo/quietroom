-- QuietRoom Production Setup - Public Buckets Configuration
-- Run this as postgres role in Supabase SQL Editor

-- STEP 1: Make storage buckets public
-- ===================================

-- Update journal-entries bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'journal-entries';

-- Update thumbnails bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'thumbnails';

-- STEP 2: Verify bucket settings
-- ============================

SELECT 
  id as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id IN ('journal-entries', 'thumbnails');

-- STEP 3: Create or update storage tables if needed
-- ==============================================

-- Make sure buckets exist with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('journal-entries', 'journal-entries', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- STEP 4: Update RLS policies for public access
-- ===========================================

-- Allow public access to journal-entries bucket objects
DROP POLICY IF EXISTS "Public read access for journal entries" ON storage.objects;
CREATE POLICY "Public read access for journal entries"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'journal-entries');

-- Keep user-specific policies for write operations
DROP POLICY IF EXISTS "Users can manage their own journal images" ON storage.objects;
CREATE POLICY "Users can manage their own journal images"
ON storage.objects FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  bucket_id = 'journal-entries' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
)
WITH CHECK (
  bucket_id = 'journal-entries' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = public.clerk_user_id()
);

-- STEP 5: Final verification
-- =======================

DO $$
BEGIN
  RAISE NOTICE '=== PUBLIC BUCKETS CONFIGURATION COMPLETE ===';
  RAISE NOTICE 'Journal entries bucket is now public: %', 
    (SELECT public FROM storage.buckets WHERE id = 'journal-entries');
  RAISE NOTICE 'Thumbnails bucket is now public: %', 
    (SELECT public FROM storage.buckets WHERE id = 'thumbnails');
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Public buckets allow anyone to read the files without authentication.';
  RAISE NOTICE 'This is required for displaying images in your application.';
END $$;
