"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SupabaseEntryStorage, Entry } from "@/lib/supabase-storage";
import { useUser } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase-auth";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Sparkles
} from "lucide-react";
import { formatDateForStorage } from "@/lib/date-utils";
import EntryCard from "@/components/EntryCard";

export default function CalendarPage() {
  const { user, isLoaded } = useUser();
  const { supabase, isLoading: isSupabaseLoading } = useSupabaseClient();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntries, setSelectedEntries] = useState<Entry[]>([]);
  const [selectedDateString, setSelectedDateString] = useState<string>("");

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const loadEntries = async () => {
      if (!user?.id || isSupabaseLoading) return;
      
      const userEntries = await SupabaseEntryStorage.getEntries(user.id, supabase);
      setEntries(userEntries);
    };

    if (isLoaded && user && !isSupabaseLoading) {
      loadEntries();
    }
  }, [user?.id, isLoaded, user, supabase, isSupabaseLoading]);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return {
      daysInMonth,
      startingDayOfWeek,
      year,
      month
    };
  };

  const hasEntryForDate = (date: Date) => {
    const dateString = formatDateForStorage(date);
    return entries.some(entry => entry.date === dateString);
  };

  const getEntriesForDate = (date: Date) => {
    const dateString = formatDateForStorage(date);
    return entries.filter(entry => entry.date === dateString)
      .sort((a, b) => (a.entry_order || 0) - (b.entry_order || 0));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedEntries([]);
    setSelectedDateString("");
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const clickedDateString = formatDateForStorage(clickedDate);
    const dayEntries = getEntriesForDate(clickedDate);
    setSelectedEntries(dayEntries);
    setSelectedDateString(clickedDateString);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Show loading state while checking authentication
  if (!isLoaded || isSupabaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center mobile-container">
          <div className="breathing w-12 h-12 sm:w-16 sm:h-16 rounded-full nav-glass flex items-center justify-center mb-4 mx-auto">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-accent animate-pulse" />
          </div>
          <p className="text-sm sm:text-base text-secondary font-medium">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-xs sm:max-w-md mx-auto mobile-container">
          <div className="card-modern p-6 sm:p-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            <h1 className="font-italiana text-xl sm:text-2xl text-primary mb-3 sm:mb-4">
              Sign In Required
            </h1>
            <p className="text-sm sm:text-base text-secondary mb-6">
              Please sign in to view your calendar
            </p>
            <Link href="/sign-in" className="glass-button px-6 py-3 text-sm sm:text-base font-semibold rounded-xl hover:scale-[1.02] transition-all duration-200">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mobile-container tablet-container desktop-container pt-6 sm:pt-8 pb-32">
        {/* Mobile-optimized Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="font-italiana text-2xl sm:text-3xl text-primary">
              Calendar
            </h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-secondary">
            Track your daily reflections
          </p>
        </div>

        {/* Mobile-optimized Calendar Navigation */}
        <div className="card-modern p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button 
              onClick={() => navigateMonth('prev')}
              className="glass-button p-2.5 sm:p-3 rounded-full hover:scale-105 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <h2 className="font-italiana text-lg sm:text-xl text-primary">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={() => navigateMonth('next')}
              className="glass-button p-2.5 sm:p-3 rounded-full hover:scale-105 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Mobile-optimized Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs sm:text-sm text-secondary font-semibold py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Mobile-optimized Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const dateString = formatDateForStorage(date);
              const hasEntry = hasEntryForDate(date);
              const isToday = isCurrentMonth && today.getDate() === day;
              const isSelected = selectedDateString === dateString;
              
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square text-sm sm:text-base font-medium rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center min-h-[44px] ${
                    isSelected
                      ? 'bg-black text-white font-bold'
                      : isToday 
                        ? 'bg-gradient-to-r from-accent/30 to-accent/20 text-primary font-bold border-2 border-accent/40' 
                        : hasEntry 
                          ? 'bg-gradient-to-r from-accent/15 to-accent/10 text-primary font-semibold glass-button' 
                          : 'text-secondary hover:bg-white/40 glass-button'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entry Cards using EntryCard component */}
        {selectedEntries.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <h3 className="font-italiana text-lg sm:text-xl text-primary">
                {new Date(selectedEntries[0].date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                {selectedEntries.length > 1 && (
                  <span className="text-sm text-secondary ml-2">
                    ({selectedEntries.length} entries)
                  </span>
                )}
              </h3>
            </div>
            
            {selectedEntries.map((entry) => (
              <EntryCard 
                key={entry.id} 
                entry={entry} 
                isMultiple={selectedEntries.length > 1}
              />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="card-modern p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <p className="text-base sm:text-lg text-primary font-medium mb-1 sm:mb-2">
              Select a date with an entry to view it
            </p>
            <p className="text-xs sm:text-sm text-secondary">
              Dates with entries are highlighted
            </p>
          </div>
        ) : (
          <div className="card-modern p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h3 className="font-italiana text-lg sm:text-xl text-primary mb-2">No Entries Yet</h3>
            <p className="text-sm sm:text-base md:text-lg text-secondary">
              Start your daily ritual to see your reflections here
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 