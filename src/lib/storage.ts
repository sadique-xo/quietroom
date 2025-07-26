export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD format
  photo: string; // base64 encoded image
  caption: string;
  timestamp: number;
}

const STORAGE_KEY = 'quietroom_entries';

export class EntryStorage {
  static getEntries(): Entry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading entries from localStorage:', error);
      return [];
    }
  }

  static saveEntry(entry: Omit<Entry, 'id' | 'timestamp'>): boolean {
    try {
      const entries = this.getEntries();
      const today = new Date().toISOString().split('T')[0];
      
      // Check if entry already exists for today
      const existingEntryIndex = entries.findIndex(e => e.date === today);
      
      const newEntry: Entry = {
        ...entry,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      if (existingEntryIndex >= 0) {
        // Replace existing entry for today
        entries[existingEntryIndex] = newEntry;
      } else {
        // Add new entry
        entries.push(newEntry);
      }

      // Sort entries by date (newest first)
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (error) {
      console.error('Error saving entry to localStorage:', error);
      return false;
    }
  }

  static hasEntryForDate(date: string): boolean {
    const entries = this.getEntries();
    return entries.some(entry => entry.date === date);
  }

  static getTodaysEntry(): Entry | null {
    const today = new Date().toISOString().split('T')[0];
    const entries = this.getEntries();
    return entries.find(entry => entry.date === today) || null;
  }

  static deleteEntry(id: string): boolean {
    try {
      const entries = this.getEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries));
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      return false;
    }
  }

  static exportEntries(): string {
    const entries = this.getEntries();
    return JSON.stringify(entries, null, 2);
  }

  static clearAllEntries(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing entries:', error);
      return false;
    }
  }
} 