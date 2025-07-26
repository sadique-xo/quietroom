import { supabase, DatabaseEntry, CreateEntryData } from './supabase'
import { uploadImage, deleteImage, ImageUploadResult } from './image-upload'

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD format
  photo: string; // base64 encoded image (legacy)
  photo_url?: string; // URL to stored image
  photo_thumbnail_url?: string; // URL to thumbnail
  photo_filename?: string; // Original filename
  photo_size?: number; // File size in bytes
  photo_format?: string; // Image format (jpg, png, webp)
  caption: string;
  timestamp: number;
}

export class SupabaseEntryStorage {
  /**
   * Get all entries for the current user
   */
  static async getEntries(userId: string): Promise<Entry[]> {
    try {
      const { data, error } = await supabase
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
        photo: dbEntry.photo,
        photo_url: dbEntry.photo_url,
        photo_thumbnail_url: dbEntry.photo_thumbnail_url,
        photo_filename: dbEntry.photo_filename,
        photo_size: dbEntry.photo_size,
        photo_format: dbEntry.photo_format,
        caption: dbEntry.caption,
        timestamp: dbEntry.timestamp,
      }))
    } catch (error) {
      console.error('Error in getEntries:', error)
      return []
    }
  }

  /**
   * Save a new entry or update existing entry for today
   */
  static async saveEntry(
    userId: string, 
    entry: Omit<Entry, 'id' | 'timestamp'>
  ): Promise<{ success: boolean; entry?: Entry; error?: string }> {
    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const error = 'Supabase environment variables are not configured. Please check your .env.local file.';
        console.error(error);
        return { success: false, error };
      }

      const timestamp = Date.now()
      
      // Handle image upload if needed
      let photo_url: string | undefined;
      let photo_thumbnail_url: string | undefined;
      let photo_filename: string | undefined;
      let photo_size: number | undefined;
      let photo_format: string | undefined;
      
      // If entry has a base64 photo, upload it to storage
      if (entry.photo && entry.photo.startsWith('data:image')) {
        const imageUploadResult = await uploadImage(userId, entry.photo);
        
        if (!imageUploadResult.success) {
          console.error('Image upload failed:', imageUploadResult.error);
          // Continue with base64 as fallback
        } else {
          photo_url = imageUploadResult.url;
          photo_thumbnail_url = imageUploadResult.thumbnailUrl;
          photo_filename = imageUploadResult.fileName;
          photo_size = imageUploadResult.fileSize;
          photo_format = imageUploadResult.fileFormat;
        }
      }

      const entryData: CreateEntryData = {
        user_id: userId,
        date: entry.date,
        photo: entry.photo, // Keep base64 for backward compatibility
        photo_url: photo_url || entry.photo_url,
        photo_thumbnail_url: photo_thumbnail_url || entry.photo_thumbnail_url,
        photo_filename: photo_filename || entry.photo_filename,
        photo_size: photo_size || entry.photo_size,
        photo_format: photo_format || entry.photo_format,
        caption: entry.caption,
        timestamp,
      }

      // Use upsert to handle the unique constraint (user_id, date)
      const { data, error } = await supabase
        .from('entries')
        .upsert(entryData, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error saving entry:', error)
        return { success: false, error: error.message }
      }

      if (!data) {
        const error = 'No data returned from Supabase after save operation';
        console.error(error);
        return { success: false, error };
      }

      // Convert back to our Entry interface
      const savedEntry: Entry = {
        id: data.id,
        date: data.date,
        photo: data.photo,
        photo_url: data.photo_url,
        photo_thumbnail_url: data.photo_thumbnail_url,
        photo_filename: data.photo_filename,
        photo_size: data.photo_size,
        photo_format: data.photo_format,
        caption: data.caption,
        timestamp: data.timestamp,
      }

      return { success: true, entry: savedEntry }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in saveEntry:', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Check if user has an entry for a specific date
   */
  static async hasEntryForDate(userId: string, date: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected when no entry exists
        console.error('Error checking entry for date:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error in hasEntryForDate:', error)
      return false
    }
  }

  /**
   * Get today's entry for the user
   */
  static async getTodaysEntry(userId: string): Promise<Entry | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
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
        photo: data.photo,
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
  static async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    try {
      // First get the entry to check if there's an image to delete
      const { data: entry, error: getError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .eq('id', entryId)
        .single();
        
      if (getError) {
        console.error('Error fetching entry before delete:', getError);
      } else if (entry && entry.photo_url) {
        // If there's a stored image, delete it
        await deleteImage(userId, entry.photo_url);
      }
      
      // Now delete the entry
      const { error } = await supabase
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
  static async exportEntries(userId: string): Promise<string> {
    try {
      const entries = await this.getEntries(userId)
      return JSON.stringify(entries, null, 2)
    } catch (error) {
      console.error('Error in exportEntries:', error)
      return '[]'
    }
  }

  /**
   * Clear all entries for the user
   */
  static async clearAllEntries(userId: string): Promise<boolean> {
    try {
      // First, get all entries to find images to delete
      const { data: entries, error: getError } = await supabase
        .from('entries')
        .select('id, photo_url')
        .eq('user_id', userId);
        
      if (!getError && entries) {
        // Delete all images from storage
        for (const entry of entries) {
          if (entry.photo_url) {
            await deleteImage(userId, entry.photo_url);
          }
        }
      }
      
      // Then delete all entries
      const { error } = await supabase
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