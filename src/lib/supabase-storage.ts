import { supabase as defaultSupabase, DatabaseEntry, CreateEntryData } from './supabase'
import { uploadImage, deleteImage, ImageUploadResult } from './image-upload'
import { SupabaseClient } from '@supabase/supabase-js'

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD format
  photo_url: string; // URL to stored image - required
  photo_thumbnail_url?: string; // URL to thumbnail
  photo_filename: string; // Original filename - required
  photo_size: number; // File size in bytes - required
  photo_format: string; // Image format (jpg, png, webp) - required
  caption: string;
  timestamp: number;
  entry_order?: number; // Order within the day (1-10)
}

export class SupabaseEntryStorage {
  /**
   * Get all entries for the current user
   */
  static async getEntries(userId: string, customClient?: SupabaseClient): Promise<Entry[]> {
    const client = customClient || defaultSupabase;
    try {
      const { data, error } = await client
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching entries:', error)
        return []
      }

      // Convert database entries to our Entry interface
      return (data || []).map((dbEntry: DatabaseEntry) => ({
        id: dbEntry.id,
        date: dbEntry.date,
        photo_url: dbEntry.photo_url,
        photo_thumbnail_url: dbEntry.photo_thumbnail_url,
        photo_filename: dbEntry.photo_filename,
        photo_size: dbEntry.photo_size,
        photo_format: dbEntry.photo_format,
        caption: dbEntry.caption,
        timestamp: dbEntry.timestamp,
        entry_order: dbEntry.entry_order,
      }))
    } catch (error) {
      console.error('Error in getEntries:', error)
      return []
    }
  }

  /**
   * Save a new entry for today (up to 10 entries per day)
   */
  static async saveEntry(
    userId: string, 
    entry: Omit<Entry, 'id' | 'timestamp'> & { imageFile?: File }, // Add imageFile parameter
    customClient?: SupabaseClient
  ): Promise<{ success: boolean; entry?: Entry; error?: string }> {
    const client = customClient || defaultSupabase;
    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const error = 'Supabase environment variables are not configured. Please check your .env.local file.';
        console.error(error);
        return { success: false, error };
      }

      // Check daily limit first
      const hasReachedLimit = await this.hasReachedDailyLimit(userId, entry.date, client);
      if (hasReachedLimit) {
        return { success: false, error: 'Daily limit reached. You can add up to 10 photos per day.' };
      }

      // Get current entry count to determine entry_order
      const currentCount = await this.getEntriesCountForDate(userId, entry.date, client);
      const entryOrder = currentCount + 1;

      // Add detailed logging for debugging
      console.log('saveEntry called with:', {
        userId,
        entry: {
          date: entry.date,
          caption: entry.caption,
          entryOrder,
          currentCount,
          hasImageFile: !!entry.imageFile,
          imageFileInfo: entry.imageFile ? {
            name: entry.imageFile.name,
            size: entry.imageFile.size,
            type: entry.imageFile.type
          } : 'none'
        }
      });

      // Require image file for new entries
      if (!entry.imageFile) {
        return { success: false, error: 'Image file is required for journal entries' };
      }

      const timestamp = Date.now();
      
      // Upload image to storage
      console.log('Uploading image file for user:', userId);
      const imageUploadResult = await uploadImage(userId, entry.imageFile, undefined, client);
      
      if (!imageUploadResult.success) {
        console.error('Image upload failed:', imageUploadResult.error);
        return { success: false, error: `Image upload failed: ${imageUploadResult.error}` };
      }

      console.log('Image upload successful, got URL:', imageUploadResult.url);

      // Ensure all required fields are present
      if (!imageUploadResult.url || !imageUploadResult.fileName || 
          imageUploadResult.fileSize === undefined || !imageUploadResult.fileFormat) {
        return { success: false, error: 'Image upload succeeded but missing required metadata' };
      }

      const entryData: CreateEntryData = {
        user_id: userId,
        date: entry.date,
        photo: '', // Keep empty for legacy compatibility
        photo_url: imageUploadResult.url,
        photo_thumbnail_url: imageUploadResult.thumbnailUrl,
        photo_filename: imageUploadResult.fileName,
        photo_size: imageUploadResult.fileSize,
        photo_format: imageUploadResult.fileFormat,
        caption: entry.caption,
        timestamp,
        entry_order: entryOrder,
      }

      console.log('About to insert entryData:', {
        user_id: entryData.user_id,
        date: entryData.date,
        caption: entryData.caption,
        timestamp: entryData.timestamp,
        photo_url: entryData.photo_url,
        photo_filename: entryData.photo_filename,
        photo_size: entryData.photo_size,
        photo_format: entryData.photo_format,
        entry_order: entryData.entry_order
      });

      // Insert new entry (no longer using upsert since we allow multiple entries per day)
      const { data, error } = await client
        .from('entries')
        .insert(entryData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error saving entry - FULL ERROR OBJECT:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        return { success: false, error: `Database error: ${error.message} (Code: ${error.code})` }
      }

      if (!data) {
        const error = 'No data returned from Supabase after save operation';
        console.error(error);
        return { success: false, error };
      }

      console.log('Successfully saved entry:', data.id);

      // Convert back to our Entry interface
      const savedEntry: Entry = {
        id: data.id,
        date: data.date,
        photo_url: data.photo_url,
        photo_thumbnail_url: data.photo_thumbnail_url,
        photo_filename: data.photo_filename,
        photo_size: data.photo_size,
        photo_format: data.photo_format,
        caption: data.caption,
        timestamp: data.timestamp,
        entry_order: data.entry_order,
      }

      return { success: true, entry: savedEntry }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('CATCH block - Error in saveEntry:', error);
      console.error('CATCH block - Error type:', typeof error);
      console.error('CATCH block - Error constructor:', error?.constructor?.name);
      return { success: false, error: `Unexpected error: ${errorMessage}` }
    }
  }

  /**
   * Get count of entries for a specific date
   */
  static async getEntriesCountForDate(userId: string, date: string, customClient?: SupabaseClient): Promise<number> {
    const client = customClient || defaultSupabase;
    try {
      const { data, error } = await client
        .from('entries')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)

      if (error) {
        console.error('Error checking entries for date:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Error in getEntriesCountForDate:', error)
      return 0
    }
  }

  /**
   * Check if user has reached daily limit (10 entries)
   */
  static async hasReachedDailyLimit(userId: string, date: string, customClient?: SupabaseClient): Promise<boolean> {
    const count = await this.getEntriesCountForDate(userId, date, customClient);
    return count >= 10;
  }

  /**
   * Get entries for a specific date (up to 10 per day)
   */
  static async getEntriesForDate(userId: string, date: string, customClient?: SupabaseClient): Promise<Entry[]> {
    const client = customClient || defaultSupabase;
    try {
      const { data, error } = await client
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('entry_order', { ascending: true })
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error fetching entries for date:', error)
        return []
      }

      // Convert database entries to our Entry interface
      return (data || []).map((dbEntry: DatabaseEntry) => ({
        id: dbEntry.id,
        date: dbEntry.date,
        photo_url: dbEntry.photo_url,
        photo_thumbnail_url: dbEntry.photo_thumbnail_url,
        photo_filename: dbEntry.photo_filename,
        photo_size: dbEntry.photo_size,
        photo_format: dbEntry.photo_format,
        caption: dbEntry.caption,
        timestamp: dbEntry.timestamp,
        entry_order: dbEntry.entry_order,
      }))
    } catch (error) {
      console.error('Error in getEntriesForDate:', error)
      return []
    }
  }

  /**
   * Check if user has any entries for a specific date
   * @deprecated Use getEntriesCountForDate instead for better functionality
   */
  static async hasEntryForDate(userId: string, date: string, customClient?: SupabaseClient): Promise<boolean> {
    const count = await this.getEntriesCountForDate(userId, date, customClient);
    return count > 0;
  }

  /**
   * Get today's entry for the user
   */
  static async getTodaysEntry(userId: string, customClient?: SupabaseClient): Promise<Entry | null> {
    const client = customClient || defaultSupabase;
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await client
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching today\'s entry:', error)
        return null
      }

      if (!data) return null

      return {
        id: data.id,
        date: data.date,
        photo_url: data.photo_url,
        photo_thumbnail_url: data.photo_thumbnail_url,
        photo_filename: data.photo_filename,
        photo_size: data.photo_size,
        photo_format: data.photo_format,
        caption: data.caption,
        timestamp: data.timestamp,
      }
    } catch (error) {
      console.error('Error in getTodaysEntry:', error)
      return null
    }
  }

  /**
   * Delete an entry by ID
   */
  static async deleteEntry(userId: string, entryId: string, customClient?: SupabaseClient): Promise<boolean> {
    const client = customClient || defaultSupabase;
    try {
      // First get the entry to check if there's an image to delete
      const { data: entry, error: getError } = await client
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .eq('id', entryId)
        .single();
        
      if (getError) {
        console.error('Error fetching entry before delete:', getError);
      } else if (entry && entry.photo_url) {
        // If there's a stored image, delete it
        await deleteImage(userId, entry.photo_url, client);
      }
      
      // Now delete the entry
      const { error } = await client
        .from('entries')
        .delete()
        .eq('user_id', userId)
        .eq('id', entryId)

      if (error) {
        console.error('Error deleting entry:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteEntry:', error)
      return false
    }
  }

  /**
   * Export all entries for the user
   */
  static async exportEntries(userId: string, customClient?: SupabaseClient): Promise<string> {
    const client = customClient || defaultSupabase;
    try {
      const entries = await this.getEntries(userId, client)
      return JSON.stringify(entries, null, 2)
    } catch (error) {
      console.error('Error in exportEntries:', error)
      return '[]'
    }
  }

  /**
   * Clear all entries for the user
   */
  static async clearAllEntries(userId: string, customClient?: SupabaseClient): Promise<boolean> {
    const client = customClient || defaultSupabase;
    try {
      // First, get all entries to find images to delete
      const { data: entries, error: getError } = await client
        .from('entries')
        .select('id, photo_url')
        .eq('user_id', userId);
        
      if (!getError && entries) {
        // Delete all images from storage
        for (const entry of entries) {
          if (entry.photo_url) {
            await deleteImage(userId, entry.photo_url, client);
          }
        }
      }
      
      // Then delete all entries
      const { error } = await client
        .from('entries')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error('Error clearing entries:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in clearAllEntries:', error)
      return false
    }
  }
} 