import { supabase } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const BUCKETS = {
  JOURNAL_ENTRIES: 'journal-entries',
  THUMBNAILS: 'thumbnails'
};

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  fileFormat?: string;
}

/**
 * Helper function for consistent file path generation
 * Format: userId/timestamp-randomString.extension
 */
export function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Ensure we're using the correct user ID format
  // This should match the 'sub' claim from Clerk's JWT
  return `${userId}/${timestamp}-${randomString}.${extension}`;
}

// Base64 conversion functions removed - we now only work with File objects

/**
 * Check if storage is available
 */
async function isStorageAvailable(client?: SupabaseClient): Promise<boolean> {
  try {
    const supabaseClient = client || supabase;
    const { error } = await supabaseClient.storage.listBuckets();
    if (error) {
      console.error('Storage error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Storage not available:', error);
    return false;
  }
}

/**
 * Upload an image file to Supabase Storage
 * @param userId - The user ID
 * @param imageFile - The image File object to upload
 * @param fileName - Optional filename, will be generated if not provided
 * @param customClient - Optional authenticated Supabase client
 */
export async function uploadImage(
  userId: string,
  imageFile: File,
  fileName?: string,
  customClient?: SupabaseClient
): Promise<ImageUploadResult> {
  try {
    // Use custom client if provided (authenticated), otherwise use default
    const supabaseClient = customClient || supabase;
    
    // Check if storage is available
    const storageAvailable = await isStorageAvailable(supabaseClient);
    if (!storageAvailable) {
      return { 
        success: false, 
        error: 'Storage is not available. Please ensure Storage is enabled in your Supabase project.' 
      };
    }

    // Validate inputs
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }
    
    if (!imageFile || !(imageFile instanceof File)) {
      return { success: false, error: 'Valid image file is required' };
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }
    
    const file = imageFile;
    const fileFormat = file.type.split('/')[1] || 'jpg';
    
    // Generate a unique path for the file
    const actualFileName = fileName || file.name || `image-${Date.now()}.${fileFormat}`;
    const filePath = generateFilePath(userId, actualFileName);
    
    console.log('Uploading image:', {
      userId,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      usingCustomClient: !!customClient
    });
    
    // Upload the file to the journal-entries bucket using the authenticated client
    const { error } = await supabaseClient.storage
      .from(BUCKETS.JOURNAL_ENTRIES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabaseClient.storage
      .from(BUCKETS.JOURNAL_ENTRIES)
      .getPublicUrl(filePath);
    
    console.log('Image upload successful:', {
      filePath,
      publicUrl,
      fileSize: file.size
    });
    
    return {
      success: true,
      url: publicUrl,
      fileName: actualFileName,
      fileSize: file.size,
      fileFormat
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in uploadImage:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(userId: string, url: string, customClient?: SupabaseClient): Promise<boolean> {
  try {
    const supabaseClient = customClient || supabase;
    
    // Extract the file path from the URL
    const baseStorageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKETS.JOURNAL_ENTRIES}/`;
    
    if (!url.includes(baseStorageUrl)) {
      console.error('Invalid storage URL format');
      return false;
    }
    
    const filePath = url.replace(baseStorageUrl, '');
    
    // Ensure the user only deletes their own files
    if (!filePath.startsWith(userId + '/')) {
      console.error('User does not have permission to delete this file');
      return false;
    }
    
    // Delete the file using the authenticated client
    const { error } = await supabaseClient.storage
      .from(BUCKETS.JOURNAL_ENTRIES)
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
} 