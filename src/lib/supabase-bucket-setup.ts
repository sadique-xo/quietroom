import { supabase } from './supabase';

// Constants for bucket configuration
const JOURNAL_ENTRIES_BUCKET = 'journal-entries';
const THUMBNAILS_BUCKET = 'thumbnails';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Creates the necessary storage buckets for the QuietRoom app.
 * This function should be run once during initial setup.
 */
export async function createStorageBuckets() {
  try {
    // 1. Create journal entries bucket (private, user-specific access)
    const { error: journalError } = await supabase.storage.createBucket(
      JOURNAL_ENTRIES_BUCKET,
      { 
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES
      }
    );
    
    if (journalError) {
      console.error('Error creating journal entries bucket:', journalError);
      return false;
    }

    // 2. Create thumbnails bucket (public read access)
    const { error: thumbnailsError } = await supabase.storage.createBucket(
      THUMBNAILS_BUCKET,
      { 
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES
      }
    );

    if (thumbnailsError) {
      console.error('Error creating thumbnails bucket:', thumbnailsError);
      return false;
    }

    console.log('Storage buckets created successfully');
    return true;
  } catch (error) {
    console.error('Error in createStorageBuckets:', error);
    return false;
  }
}

/**
 * Sets up RLS (Row Level Security) policies for the storage buckets.
 * This function should be run after creating the buckets.
 * Note: This function executes SQL queries and requires admin privileges.
 */
export async function setupBucketPolicies() {
  try {
    // 1. RLS Policy for journal entries - Users can only access their own files
    const journalPolicyQuery = `
      BEGIN;
      -- First, remove any existing policies
      DROP POLICY IF EXISTS "Users can only access their own journal images" ON storage.objects;
      
      -- Create policy for journal entries
      CREATE POLICY "Users can only access their own journal images"
      ON storage.objects FOR ALL
      USING (
        bucket_id = '${JOURNAL_ENTRIES_BUCKET}' AND 
        auth.uid()::text = SPLIT_PART(name, '/', 1)
      );
      COMMIT;
    `;
    
    // 2. RLS Policies for thumbnails - Public read, restricted write
    const thumbnailsPolicyQuery = `
      BEGIN;
      -- First, remove any existing policies
      DROP POLICY IF EXISTS "Thumbnails are publicly readable" ON storage.objects;
      DROP POLICY IF EXISTS "Only authenticated users can upload thumbnails" ON storage.objects;
      
      -- Create read policy for thumbnails (public read)
      CREATE POLICY "Thumbnails are publicly readable"
      ON storage.objects FOR SELECT
      USING (bucket_id = '${THUMBNAILS_BUCKET}');
      
      -- Create write policy for thumbnails (user-restricted write)
      CREATE POLICY "Only authenticated users can upload thumbnails"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = '${THUMBNAILS_BUCKET}' AND 
        auth.uid()::text = SPLIT_PART(name, '/', 2)
      );
      COMMIT;
    `;

    // Execute the policies (requires admin access)
    // Note: The following might need to be executed via Supabase dashboard SQL editor
    // as it requires admin privileges
    console.log('SQL for journal entries bucket policy:', journalPolicyQuery);
    console.log('SQL for thumbnails bucket policy:', thumbnailsPolicyQuery);

    console.log('Please execute these SQL queries in the Supabase dashboard SQL editor.');
    
    return true;
  } catch (error) {
    console.error('Error in setupBucketPolicies:', error);
    return false;
  }
}

/**
 * Utility function to check if the storage buckets exist.
 */
export async function checkBucketsExist() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return { success: false, journalExists: false, thumbnailsExists: false };
    }
    
    const journalExists = buckets.some(bucket => bucket.name === JOURNAL_ENTRIES_BUCKET);
    const thumbnailsExists = buckets.some(bucket => bucket.name === THUMBNAILS_BUCKET);
    
    return { 
      success: true, 
      journalExists, 
      thumbnailsExists,
      buckets: buckets.map(b => b.name)
    };
  } catch (error) {
    console.error('Error in checkBucketsExist:', error);
    return { success: false, journalExists: false, thumbnailsExists: false };
  }
}

/**
 * Helper function for consistent file path generation
 * Format: userId/timestamp-randomString.extension
 */
export function generateFilePath(userId: string, fileName: string) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  
  return `${userId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Export bucket names as constants to be used throughout the app
 */
export const BUCKETS = {
  JOURNAL_ENTRIES: JOURNAL_ENTRIES_BUCKET,
  THUMBNAILS: THUMBNAILS_BUCKET
}; 