import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else {
  console.log('No .env.local file found');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined');
console.log('Supabase Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 15)}...` : 'undefined');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase credentials not found in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  
  try {
    // First, let's try a simpler test - check health status
    try {
      const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey || ''
        }
      });
      console.log('API Health status:', healthCheck.status, healthCheck.statusText);
    } catch (error) {
      console.error('Health check failed:', error);
    }

    // Test basic connection
    console.log('Testing database query...');
    // Just get a count of rows using the count parameter
    const { count, error: countError } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Connection error:', countError);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase database!');
    console.log(`Total entries in database: ${count}`);
    
    // Check storage buckets
    console.log('\n📦 Checking storage buckets...');
    
    try {
      // List all buckets first
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Error listing buckets:', bucketsError);
        console.log('Note: Listing buckets often requires admin privileges');
      } else {
        console.log('Available buckets:', buckets?.map(b => b.name) || []);
      }
      
      // Try to list files in journal-entries bucket (empty path lists root directory)
      console.log('\nChecking journal-entries bucket:');
      const { data: journalFiles, error: journalError } = await supabase.storage.from('journal-entries').list('');
      
      if (journalError) {
        console.error('❌ Error accessing journal-entries bucket:', journalError);
      } else {
        console.log('✅ Successfully accessed journal-entries bucket');
        console.log(`Found ${journalFiles?.length || 0} files/folders at root level`);
        if (journalFiles && journalFiles.length > 0) {
          console.log('Sample items:', journalFiles.slice(0, 3));
        }
      }
      
      // Try to list files in thumbnails bucket
      console.log('\nChecking thumbnails bucket:');
      const { data: thumbnailFiles, error: thumbnailError } = await supabase.storage.from('thumbnails').list('');
      
      if (thumbnailError) {
        console.error('❌ Error accessing thumbnails bucket:', thumbnailError);
      } else {
        console.log('✅ Successfully accessed thumbnails bucket');
        console.log(`Found ${thumbnailFiles?.length || 0} files/folders at root level`);
        if (thumbnailFiles && thumbnailFiles.length > 0) {
          console.log('Sample items:', thumbnailFiles.slice(0, 3));
        }
      }
    } catch (error) {
      console.error('❌ Error checking storage buckets:', error);
    }
    
    // Check entries table
    console.log('\n📝 Checking entries table...');
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .limit(5);
    
    if (entriesError) {
      console.error('❌ Error fetching entries:', entriesError);
      return;
    }
    
    console.log(`✅ Successfully retrieved entries! Found ${entries?.length || 0} entries.`);
    
    if (entries && entries.length > 0) {
      // Display entries (sanitize output to not show full images)
      console.log('\nSample entries (truncated):');
      entries.forEach((entry, index) => {
        const sanitizedEntry = {
          ...entry,
          // Truncate photo field if it's base64 to avoid console overflow
          photo: entry.photo?.startsWith('data:image') 
            ? entry.photo.substring(0, 30) + '... [truncated]' 
            : entry.photo
        };
        console.log(`\nEntry ${index + 1}:`);
        console.log(JSON.stringify(sanitizedEntry, null, 2));
      });
    } else {
      console.log('No entries found in the database.');
    }
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testConnection().catch(error => {
  console.error('Unhandled error:', error);
}); 