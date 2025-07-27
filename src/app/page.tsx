"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SupabaseEntryStorage, Entry } from "@/lib/supabase-storage";
import { QuoteService, Quote } from "@/lib/quotes";
import EntryCard from "@/components/EntryCard";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase-auth";
import { 
  Lock, 
  Heart, 
  Plus, 
  Sparkles, 
  BookOpen, 
  Calendar
} from "lucide-react";

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const { supabase, isLoading: isSupabaseLoading } = useSupabaseClient();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesByDate, setEntriesByDate] = useState<Record<string, Entry[]>>({});
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load entries and daily quote
    const loadData = async () => {
      if (!user?.id || isSupabaseLoading) {
        setIsLoading(false);
        return;
      }

      try {
        const [userEntries] = await Promise.all([
          SupabaseEntryStorage.getEntries(user.id, supabase),
        ]);
        
        // Group entries by date
        const grouped = userEntries.reduce((acc: Record<string, Entry[]>, entry) => {
          if (!acc[entry.date]) {
            acc[entry.date] = [];
          }
          acc[entry.date].push(entry);
          return acc;
        }, {});
        
        // Sort entries within each date by entry_order and timestamp
        Object.keys(grouped).forEach(date => {
          grouped[date].sort((a, b) => {
            // If both have entry_order, sort by that first
            if (a.entry_order && b.entry_order) {
              return a.entry_order - b.entry_order;
            }
            // Otherwise sort by timestamp
            return a.timestamp - b.timestamp;
          });
        });
        
        setEntries(userEntries);
        setEntriesByDate(grouped);
        setDailyQuote(QuoteService.getDailyQuote());
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    if (isLoaded && !isSupabaseLoading) {
      loadData();
    }
  }, [user?.id, isLoaded, user, supabase, isSupabaseLoading]);

  const handleEntryClick = (entry: Entry) => {
    // Could navigate to entry detail view in the future
    console.log('Entry clicked:', entry);
  };

  if (!isLoaded || isLoading || isSupabaseLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center mobile-container">
          <div className="breathing w-12 h-12 sm:w-16 sm:h-16 rounded-full nav-glass flex items-center justify-center mb-4 mx-auto">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-accent animate-pulse" />
          </div>
          <p className="text-sm sm:text-base text-secondary font-medium">Loading your sanctuary...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="mobile-container tablet-container desktop-container">
          <div className="text-center max-w-sm mx-auto">
            <div className="card-modern p-6 sm:p-8 animate-gentle-fade">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h1 className="font-italiana text-xl sm:text-2xl md:text-3xl mb-3 sm:mb-4 text-primary">
                Welcome to QuietRoom
              </h1>
              <p className="text-sm sm:text-base text-secondary mb-6 sm:mb-8 leading-relaxed">
                Your sacred digital sanctuary for daily reflection and presence.
              </p>
              <SignInButton mode="modal">
                <button className="glass-button px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold w-full rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Sign In to Begin</span>
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Floating Header with logo - fixed position and spacing */}
      <div className="w-full flex justify-center pt-safe-top pt-4 sm:pt-6">
        <div 
          className="px-4 sm:px-6 py-3 sm:py-4 rounded-[20px] sm:rounded-[24px] flex items-center space-x-3 sm:space-x-4 animate-gentle-fade nav-glass"
        >
          <Image
            src="/images/Icon v3.webp"
            alt="QuietRoom Icon"
            width={36}
            height={36}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg"
            priority
          />
          <Image
            src="/images/Website Logo.webp"
            alt="QuietRoom"
            width={140}
            height={28}
            className="h-6 sm:h-8 w-auto"
            priority
          />
        </div>
      </div>

      {/* Hero Section with mobile-optimized spacing */}
      <div className="min-h-[40vh] sm:min-h-[50vh] flex items-center justify-center pt-6 sm:pt-10">
        <div className="mobile-container tablet-container desktop-container">
          <div className="card-modern p-4 sm:p-6 md:p-8 text-center max-w-lg sm:max-w-2xl w-full mx-auto animate-gentle-fade">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="font-italiana text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-4 sm:mb-6 text-primary">
              Welcome to Your Sanctuary
            </h1>
            {dailyQuote && (
              <>
                <p className="text-sm sm:text-base md:text-lg text-secondary mb-3 sm:mb-4 italic leading-relaxed">
                  &ldquo;{dailyQuote.text}&rdquo;
                </p>
                <p className="text-xs sm:text-sm text-secondary font-medium flex items-center justify-center space-x-1 sm:space-x-2">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>— {dailyQuote.author}</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Entry Feed with mobile-optimized layout */}
      <div className="pb-32">
        <div className="mobile-container tablet-container desktop-container">
          {/* Section Header with mobile-first layout */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h2 className="font-italiana text-lg sm:text-xl md:text-2xl lg:text-3xl text-primary">Your Reflections</h2>
            </div>
            <div className="nav-glass px-3 sm:px-4 py-1.5 sm:py-2 rounded-full self-start sm:self-auto">
              <span className="text-xs sm:text-sm text-secondary font-medium flex items-center space-x-1 sm:space-x-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
              </span>
            </div>
          </div>
          
          {Object.keys(entriesByDate).length > 0 ? (
            <div className="space-y-6 sm:space-y-8">
              {Object.entries(entriesByDate)
                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // Sort dates descending
                .map(([date, dateEntries]) => (
                  <div key={date} className="space-y-4 sm:space-y-6 animate-slide-up">
                    {/* Mobile-optimized Date Header */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-italiana text-base sm:text-lg font-semibold text-primary">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <p className="text-xs sm:text-sm text-secondary">
                          {dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Mobile-first Responsive Grid */}
                    <div className={dateEntries.length > 1 
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6" 
                      : "space-y-4 sm:space-y-6"
                    }>
                      {dateEntries.map((entry) => (
                        <div key={entry.id} className="relative">
                          <EntryCard 
                            entry={entry} 
                            onClick={() => handleEntryClick(entry)}
                            isMultiple={dateEntries.length > 1}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            /* Mobile-optimized Empty State */
            <div className="card-modern p-6 sm:p-8 md:p-12 text-center animate-gentle-fade">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center breathing">
                <Plus className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" />
              </div>
              <h3 className="font-italiana text-lg sm:text-xl md:text-2xl text-primary mb-2 sm:mb-3">
                Start Your Daily Ritual
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-secondary mb-6 sm:mb-8 max-w-xs sm:max-w-md mx-auto leading-relaxed">
                Capture sacred moments and reflections, every day.
              </p>
              <Link href="/new" className="glass-button px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center space-x-2 mx-auto max-w-fit">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Create Your First Entry</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
