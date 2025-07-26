import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface DatabaseEntry {
  id: string
  user_id: string
  date: string
  photo: string
  caption: string
  timestamp: number
  created_at: string
}

// Type for creating new entries (without generated fields)
export interface CreateEntryData {
  user_id: string
  date: string
  photo: string
  caption: string
  timestamp: number
} 