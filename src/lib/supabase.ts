import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface DatabaseEntry {
  id: string
  user_id: string
  date: string
  photo: string // Base64 image (legacy field)
  photo_url?: string // New field for image URL
  photo_thumbnail_url?: string // New field for thumbnail URL
  photo_filename?: string // New field for original filename
  photo_size?: number // New field for file size in bytes
  photo_format?: string // New field for image format (jpg, png, webp)
  caption: string
  timestamp: number
  created_at: string
}

// Type for creating new entries (without generated fields)
export interface CreateEntryData {
  user_id: string
  date: string
  photo: string // Keep legacy field for backward compatibility
  photo_url?: string // New field for image URL
  photo_thumbnail_url?: string // New field for thumbnail URL
  photo_filename?: string // New field for original filename
  photo_size?: number // New field for file size in bytes
  photo_format?: string // New field for image format
  caption: string
  timestamp: number
} 