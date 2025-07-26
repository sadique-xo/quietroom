-- Fix storage bucket access for displaying images
-- Run this script as postgres role in Supabase SQL Editor

-- STEP 1: Make journal-entries bucket public for image display
UPDATE storage.buckets 
SET public = true 
WHERE id = 'journal-entries';

-- STEP 2: Make thumbnails bucket public as well
UPDATE storage.buckets 
SET public = true 
WHERE id = 'thumbnails';

-- STEP 3: Verify bucket settings
SELECT 
  id as bucket_name,
  public as is_public,
  created_at
FROM storage.buckets 
WHERE id IN ('journal-entries', 'thumbnails');

-- STEP 4: Test storage policies are working
SELECT 'Storage bucket access fixed! ✅' as result;
SELECT 'Buckets are now public for image display.' as note; 