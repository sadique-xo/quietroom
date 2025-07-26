-- Create bucket policies for storage access
-- First, create the buckets if they don't exist (this may need to be done through the UI)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can access their own journal images" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;

-- Journal entries bucket policies
-- Users can only access their own files
CREATE POLICY "Users can access their own journal images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'journal-entries' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = public.clerk_user_id());

-- Thumbnails bucket policies
-- Public read access for thumbnails
CREATE POLICY "Thumbnails are publicly readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'thumbnails');

-- Only authenticated users can insert their own thumbnails
CREATE POLICY "Users can insert their own thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated' AND (storage.foldername(name))[2] = public.clerk_user_id());

-- Only authenticated users can update their own thumbnails
CREATE POLICY "Users can update their own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated' AND (storage.foldername(name))[2] = public.clerk_user_id())
WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated' AND (storage.foldername(name))[2] = public.clerk_user_id());

-- Only authenticated users can delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated' AND (storage.foldername(name))[2] = public.clerk_user_id()); 