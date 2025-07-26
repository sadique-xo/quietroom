import fs from 'fs';
import path from 'path';
import { supabase } from '../src/lib/supabase';

/**
 * Script to test storage bucket access and update image upload settings
 */
async function testStorageBuckets() {
  console.log('Testing Supabase Storage Bucket Access...');
  
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('📦 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Test journal-entries bucket
    if (buckets.some(b => b.name === 'journal-entries')) {
      // Test uploading a small file to the journal-entries bucket
      const testData = 'test content';
      const testFilePath = 'test-user-123/test-file.txt';
      
      console.log(`\n📤 Testing upload to journal-entries bucket...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('journal-entries')
        .upload(testFilePath, testData, {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError);
      } else {
        console.log('✅ Upload test successful!');
        
        // Get the URL of the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('journal-entries')
          .getPublicUrl(testFilePath);
          
        console.log('📄 File URL:', publicUrl);
        
        // Test deleting the file
        console.log(`\n🗑️ Testing file deletion...`);
        const { error: deleteError } = await supabase.storage
          .from('journal-entries')
          .remove([testFilePath]);
          
        if (deleteError) {
          console.error('❌ Delete test failed:', deleteError);
        } else {
          console.log('✅ Delete test successful!');
        }
      }
    } else {
      console.error('❌ journal-entries bucket not found!');
    }
    
  } catch (error) {
    console.error('Error in bucket test:', error);
  }
}

// Run the test
testStorageBuckets().catch(console.error); 