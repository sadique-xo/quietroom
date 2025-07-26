"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EntryStorage, Entry } from "@/lib/storage";
import { QuoteService, Quote } from "@/lib/quotes";
import EntryCard from "@/components/EntryCard";

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load entries and daily quote
    const loadData = () => {
      setEntries(EntryStorage.getEntries());
      setDailyQuote(QuoteService.getDailyQuote());
      setIsLoading(false);
    };

    loadData();

    // Listen for storage changes (when new entries are added)
    const handleStorageChange = () => {
      setEntries(EntryStorage.getEntries());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleEntryClick = (entry: Entry) => {
    // Could navigate to entry detail view in the future
    console.log('Entry clicked:', entry);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sanctuary-lavender/20 to-sanctuary-white flex items-center justify-center">
        <div className="breathing w-16 h-16 rounded-full glass"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sanctuary-lavender/20 to-sanctuary-white">
      {/* Hero Section with Daily Quote - 60% viewport height as per design */}
      <div className="h-[60vh] flex items-center justify-center px-sanctuary-md pt-sanctuary-lg">
        <div className="glass p-sanctuary-lg text-center max-w-2xl w-full animate-fade-in">
          <h1 className="text-display-medium font-sf-pro text-sanctuary-navy mb-sanctuary-md">
            Welcome to Your Sanctuary
          </h1>
          {dailyQuote && (
            <>
              <p className="text-body-large text-sanctuary-sage mb-sanctuary-sm italic leading-relaxed">
                &ldquo;{dailyQuote.text}&rdquo;
              </p>
              <p className="text-caption text-sanctuary-sage font-medium">
                — {dailyQuote.author}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Entry Feed with proper spacing */}
      <div className="px-sanctuary-md pb-sanctuary-xl">
        <div className="max-w-4xl mx-auto">
          {/* Section Header with breathing space */}
          <div className="flex items-center justify-between mb-sanctuary-lg">
            <h2 className="text-display-medium font-sf-pro text-sanctuary-navy">Your Reflections</h2>
            <div className="glass px-sanctuary-xs py-2">
              <span className="text-caption text-sanctuary-sage font-medium">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>
          
          {entries.length > 0 ? (
            <div className="space-y-sanctuary-lg">
              {entries.map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onClick={() => handleEntryClick(entry)}
                />
              ))}
            </div>
          ) : (
            /* Empty State with generous spacing */
            <div className="glass p-sanctuary-xl text-center">
              <div className="w-20 h-20 mx-auto mb-sanctuary-md rounded-full bg-sanctuary-lavender/20 flex items-center justify-center breathing">
                <svg className="w-10 h-10 text-sanctuary-lavender" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-body-large font-sf-pro text-sanctuary-navy mb-sanctuary-xs">
                Start Your Daily Ritual
              </h3>
              <p className="text-body-medium text-sanctuary-sage mb-sanctuary-lg max-w-md mx-auto leading-relaxed">
                Capture one sacred moment, one reflection, every day.
              </p>
              <Link href="/new" className="glass-button px-sanctuary-lg py-sanctuary-xs text-body-medium text-sanctuary-navy font-medium inline-block">
                Create Your First Entry
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button with proper positioning */}
      <Link 
        href="/new"
        className="fixed bottom-28 right-sanctuary-md glass-button p-sanctuary-xs rounded-full shadow-glass-hover z-cards group"
      >
        <svg className="w-6 h-6 text-sanctuary-navy transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
}
