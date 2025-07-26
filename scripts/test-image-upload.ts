import { uploadImage } from '../src/lib/image-upload';
import fs from 'fs';
import path from 'path';

async function testImageUpload() {
  // Test user ID (this would be the Clerk user ID in production)
  const userId = 'test-user-123';
  
  // Sample image (using a base64 encoded small test image)
  // This is a tiny 1x1 pixel transparent PNG
  const sampleBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  console.log('Testing image upload to Supabase Storage...');
  
  try {
    // Test uploading a base64 image
    const uploadResult = await uploadImage(userId, sampleBase64Image, 'test-image.png');
    
    console.log('Upload result:', uploadResult);
    
    if (uploadResult.success) {
      console.log('✅ Image upload successful!');
      console.log('Image URL:', uploadResult.url);
      console.log('File name:', uploadResult.fileName);
      console.log('File size:', uploadResult.fileSize, 'bytes');
      console.log('File format:', uploadResult.fileFormat);
    } else {
      console.error('❌ Image upload failed:', uploadResult.error);
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testImageUpload().catch(console.error); 