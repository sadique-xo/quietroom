-- Fix entries table schema to work with Clerk user IDs
-- This ensures user_id column is TEXT type, not UUID

-- Check current table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'entries';

-- Create or update the entries table with correct schema
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                    -- Clerk user IDs are text, not UUID
  date TEXT NOT NULL,                       -- Date in YYYY-MM-DD format
  photo TEXT NOT NULL,                      -- Base64 image (legacy)
  photo_url TEXT,                          -- URL to stored image
  photo_thumbnail_url TEXT,                -- URL to thumbnail
  photo_filename TEXT,                     -- Original filename
  photo_size INTEGER,                      -- File size in bytes
  photo_format TEXT,                       -- Image format (jpg, png, webp)
  caption TEXT NOT NULL,
  timestamp BIGINT NOT NULL,               -- Unix timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)                    -- Ensure one entry per user per day
);

-- If table already exists but user_id is UUID type, we need to convert it
DO $$
BEGIN
  -- Check if user_id column is UUID type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' 
    AND column_name = 'user_id' 
    AND data_type = 'uuid'
  ) THEN
    -- Convert UUID column to TEXT
    ALTER TABLE entries ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    RAISE NOTICE 'Converted user_id column from UUID to TEXT';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);

-- Enable RLS (if not already enabled)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'entries' 
AND table_schema = 'public'
ORDER BY ordinal_position; 