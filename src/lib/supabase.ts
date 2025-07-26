import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface DatabaseEntry {
  id: string
  user_id: string
  date: string
  photo?: string // Base64 image (legacy field) - now optional for backward compatibility
  photo_url: string // Image URL from bucket storage - now required
  photo_thumbnail_url?: string // Thumbnail URL
  photo_filename: string // Original filename - now required
  photo_size: number // File size in bytes - now required
  photo_format: string // Image format (jpg, png, webp) - now required
  caption: string
  timestamp: number
  created_at: string
  entry_order?: number // Order within the day (1-10)
}

// Type for creating new entries (without generated fields)
export interface CreateEntryData {
  user_id: string
  date: string
  photo?: string // Legacy field - optional
  photo_url: string // Image URL from bucket - required
  photo_thumbnail_url?: string // Thumbnail URL
  photo_filename: string // Original filename - required
  photo_size: number // File size - required
  photo_format: string // Image format - required
  caption: string
  timestamp: number
  entry_order?: number // Order of entry within the day (1-10)
} 