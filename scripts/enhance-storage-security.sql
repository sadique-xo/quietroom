-- Enhanced Storage Security: Public Buckets + RLS Authentication
-- This adds RLS policies to storage.objects while keeping buckets public for image display

-- STEP 1: Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop existing storage policies (if any)
DROP POLICY IF EXISTS "Users can view images in journal-entries" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- STEP 3: Create secure storage policies

-- Allow everyone to VIEW images (since buckets are public)
CREATE POLICY "Public read access for journal images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'journal-entries');

-- Allow authenticated users to UPLOAD only to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journal-entries' 
  AND (storage.foldername(name))[1] = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', '')
  AND auth.role() = 'authenticated'
);

-- Allow users to UPDATE only their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'journal-entries'
  AND (storage.foldername(name))[1] = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', '')
)
WITH CHECK (
  bucket_id = 'journal-entries'
  AND (storage.foldername(name))[1] = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', '')
  AND auth.role() = 'authenticated'
);

-- Allow users to DELETE only their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'journal-entries'
  AND (storage.foldername(name))[1] = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', '')
);

-- STEP 4: Same policies for thumbnails bucket
CREATE POLICY "Public read access for thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload thumbnails to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails'
  AND (storage.foldername(name))[1] = COALESCE(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', '')
  AND auth.role() = 'authenticated'
);

-- STEP 5: Verify storage policies
SELECT 'Storage RLS Policies:' as status;
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

SELECT 'Enhanced storage security enabled! ✅' as result;
SELECT 'Public display + RLS upload protection active.' as security_level; 