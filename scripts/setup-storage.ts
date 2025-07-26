import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Constants for bucket configuration
const JOURNAL_ENTRIES_BUCKET = 'journal-entries';
const THUMBNAILS_BUCKET = 'thumbnails';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Environment setup
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for input
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Initialize supabase client
async function initializeSupabase(): Promise<SupabaseClient> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n📝 Supabase configuration not found in environment variables.');
    console.log('Please provide your Supabase credentials:');
    
    if (!supabaseUrl) {
      supabaseUrl = await prompt('Supabase URL (e.g., https://xuavrofgcyrbhsqvtqyf.supabase.co): ');
    }
    
    if (!supabaseAnonKey) {
      supabaseAnonKey = await prompt('Supabase Anon Key (find in Project Settings > API): ');
    }
    
    // Save to .env.local
    console.log('\n📝 Would you like to save these credentials to .env.local? (y/n)');
    const saveCreds = await prompt('> ');
    
    if (saveCreds.toLowerCase() === 'y') {
      try {
        const envContent = `# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
`;
        fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
        console.log('✅ Credentials saved to .env.local');
      } catch (error) {
        console.error('❌ Error saving credentials:', error);
        console.log('You may need to manually create a .env.local file with the following content:');
        console.log(`
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
`);
      }
    }
  }
  
  return createClient(supabaseUrl!, supabaseAnonKey!);
}

/**
 * Creates the necessary storage buckets for the QuietRoom app.
 */
async function createStorageBuckets(supabase: SupabaseClient) {
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
 */
async function setupBucketPolicies() {
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

    console.log('\n📝 SQL for journal entries bucket policy:');
    console.log(journalPolicyQuery);
    console.log('\n📝 SQL for thumbnails bucket policy:');
    console.log(thumbnailsPolicyQuery);

    console.log('\n⚠️ Please execute these SQL queries in the Supabase dashboard SQL editor.');
    
    return true;
  } catch (error) {
    console.error('Error in setupBucketPolicies:', error);
    return false;
  }
}

/**
 * Utility function to check if the storage buckets exist.
 */
async function checkBucketsExist(supabase: SupabaseClient) {
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

async function main() {
  console.log('🚀 QuietRoom Storage Setup');
  console.log('==========================\n');

  // Initialize Supabase client
  console.log('🔑 Setting up Supabase connection...');
  const supabase = await initializeSupabase();
  
  // Check existing buckets
  console.log('\n🔍 Checking if buckets already exist...');
  const { success, journalExists, thumbnailsExists, buckets } = await checkBucketsExist(supabase);
  
  if (success) {
    console.log('Current buckets:', buckets || []);
    
    if (journalExists && thumbnailsExists) {
      console.log('✅ All required buckets already exist!');
    } else {
      console.log('⏳ Creating missing storage buckets...');
      const created = await createStorageBuckets(supabase);
      
      if (created) {
        console.log('✅ Storage buckets created successfully!');
      } else {
        console.error('❌ Failed to create storage buckets.');
        rl.close();
        return;
      }
    }
  } else {
    console.error('❌ Failed to check existing buckets. Make sure Supabase is properly configured.');
    rl.close();
    return;
  }
  
  // Set up bucket policies
  console.log('\n📝 Setting up bucket policies...');
  await setupBucketPolicies();
  
  console.log('\n🎉 Storage setup process completed!');
  console.log('\nNext Steps:');
  console.log('1. Execute the SQL queries shown above in the Supabase dashboard SQL editor');
  console.log('2. Proceed to Phase 3: Journal Images Enhancement');
  console.log('3. Update database schema as per Phase 4: Migration Strategy');

  rl.close();
}

// Run the setup
main().catch(error => {
  console.error('Error in setup process:', error);
  rl.close();
  process.exit(1);
}); 