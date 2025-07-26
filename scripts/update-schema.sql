-- Update the entries table to add new columns for image URLs
ALTER TABLE entries
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS photo_filename TEXT,
ADD COLUMN IF NOT EXISTS photo_size INTEGER,
ADD COLUMN IF NOT EXISTS photo_format TEXT;

-- Create index on user_id and date for faster queries
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);

-- Note: we're keeping the original 'photo' column for backward compatibility
-- It will be removed after the migration is complete 