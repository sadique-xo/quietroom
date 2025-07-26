"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SupabaseEntryStorage, Entry } from "@/lib/supabase-storage";
import { QuoteService, Quote } from "@/lib/quotes";
import EntryCard from "@/components/EntryCard";
import { useUser, SignInButton } from "@clerk/nextjs";
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
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load entries and daily quote
    const loadData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const [userEntries] = await Promise.all([
          SupabaseEntryStorage.getEntries(user.id),
        ]);
        
        setEntries(userEntries);
        setDailyQuote(QuoteService.getDailyQuote());
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    if (isLoaded) {
      loadData();
    }
  }, [user?.id, isLoaded, user]);

  const handleEntryClick = (entry: Entry) => {
    // Could navigate to entry detail view in the future
    console.log('Entry clicked:', entry);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="breathing w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
          </div>
          <p className="text-slate-600 font-medium">Loading your sanctuary...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="glass p-8 rounded-3xl shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Lock className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to QuietRoom
            </h1>
            <p className="text-slate-600 mb-8 leading-relaxed text-lg">
              Your sacred digital sanctuary for daily reflection and presence.
            </p>
            <SignInButton mode="modal">
              <button className="glass-button px-8 py-4 text-base text-slate-800 font-semibold w-full rounded-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Sign In to Begin</span>
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header with Logo */}
      <div className="pt-8 pb-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="glass px-6 py-3 rounded-2xl shadow-lg flex items-center space-x-3">
            <Image
              src="/images/Icon v3.webp"
              alt="QuietRoom Icon"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <Image
              src="/images/Website Logo.webp"
              alt="QuietRoom"
              width={120}
              height={24}
              className="h-6 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Hero Section with Daily Quote - 60% viewport height as per design */}
      <div className="h-[60vh] flex items-center justify-center px-4 pt-8">
        <div className="glass p-8 text-center max-w-2xl w-full animate-gentle-fade rounded-3xl shadow-xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Your Sanctuary
          </h1>
          {dailyQuote && (
            <>
              <p className="text-xl text-slate-600 mb-4 italic leading-relaxed">
                &ldquo;{dailyQuote.text}&rdquo;
              </p>
              <p className="text-sm text-slate-500 font-medium flex items-center justify-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>— {dailyQuote.author}</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Entry Feed with proper spacing */}
      <div className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Section Header with breathing space */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800">Your Reflections</h2>
            </div>
            <div className="glass px-4 py-2 rounded-full">
              <span className="text-sm text-slate-600 font-medium flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
              </span>
            </div>
          </div>
          
          {entries.length > 0 ? (
            <div className="space-y-6">
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
            <div className="glass p-12 text-center rounded-3xl shadow-xl">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center breathing">
                <Plus className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                Start Your Daily Ritual
              </h3>
              <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                Capture one sacred moment, one reflection, every day.
              </p>
              <Link href="/new" className="glass-button px-8 py-4 text-lg text-slate-800 font-semibold rounded-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-2 mx-auto">
                <Plus className="w-5 h-5" />
                <span>Create Your First Entry</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button with proper positioning */}
      <Link 
        href="/new"
        className="fixed bottom-28 right-4 glass-button p-5 rounded-full shadow-xl z-10 group hover:scale-110 transition-all duration-300"
      >
        <Plus className="w-7 h-7 text-slate-800" />
      </Link>
    </div>
  );
}
