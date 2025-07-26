-- Update entries table to make photo field optional (since we're using bucket storage only)
-- Run this script as postgres role in Supabase SQL Editor

-- Step 1: Make photo column nullable (for legacy base64 data)
ALTER TABLE entries ALTER COLUMN photo DROP NOT NULL;

-- Step 2: Make sure photo_url and related fields are required
ALTER TABLE entries ALTER COLUMN photo_url SET NOT NULL;
ALTER TABLE entries ALTER COLUMN photo_filename SET NOT NULL;
ALTER TABLE entries ALTER COLUMN photo_size SET NOT NULL;
ALTER TABLE entries ALTER COLUMN photo_format SET NOT NULL;

-- Step 3: Update photo field to empty string for existing entries (optional)
UPDATE entries SET photo = '' WHERE photo IS NULL;

-- Step 4: Set default values for the photo field
ALTER TABLE entries ALTER COLUMN photo SET DEFAULT '';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND column_name IN ('photo', 'photo_url', 'photo_filename', 'photo_size', 'photo_format')
ORDER BY ordinal_position;

SELECT 'Photo field is now optional, bucket storage fields are required! ✅' as result; 