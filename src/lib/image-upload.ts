import { supabase } from './supabase';

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
  
  return `${userId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Convert a base64 string to a File object
 */
export function base64ToFile(base64String: string, fileName: string): File | null {
  try {
    // Extract the MIME type and base64 data
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      console.error('Invalid base64 string format');
      return null;
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Convert base64 to binary
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new File(byteArrays, fileName, { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to file:', error);
    return null;
  }
}

/**
 * Upload an image to Supabase Storage
 * @param userId - The user ID
 * @param imageData - Can be a base64 string or a File object
 * @param fileName - Optional filename, will be generated if not provided
 */
export async function uploadImage(
  userId: string,
  imageData: string | File,
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    // Validate inputs
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }
    
    if (!imageData) {
      return { success: false, error: 'Image data is required' };
    }
    
    let file: File;
    let fileFormat: string;
    
    // Convert base64 to File if needed
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      const generatedFileName = fileName || `image-${Date.now()}.jpg`;
      const convertedFile = base64ToFile(imageData, generatedFileName);
      
      if (!convertedFile) {
        return { success: false, error: 'Failed to convert base64 to file' };
      }
      
      file = convertedFile;
      fileFormat = file.type.split('/')[1] || 'jpg';
    } else if (imageData instanceof File) {
      file = imageData;
      fileFormat = file.type.split('/')[1] || 'jpg';
    } else {
      return { success: false, error: 'Invalid image data format' };
    }
    
    // Generate a unique path for the file
    const actualFileName = fileName || file.name || `image-${Date.now()}.${fileFormat}`;
    const filePath = generateFilePath(userId, actualFileName);
    
    // Upload the file to the journal-entries bucket
    const { data, error } = await supabase.storage
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
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.JOURNAL_ENTRIES)
      .getPublicUrl(filePath);
    
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
export async function deleteImage(userId: string, url: string): Promise<boolean> {
  try {
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
    
    // Delete the file
    const { error } = await supabase.storage
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