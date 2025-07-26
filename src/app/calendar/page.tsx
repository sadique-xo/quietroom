"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SupabaseEntryStorage, Entry } from "@/lib/supabase-storage";
import { useUser } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase-auth";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Heart,
  Clock,
  Image as ImageIcon,
  Sparkles
} from "lucide-react";

export default function CalendarPage() {
  const { user, isLoaded } = useUser();
  const { supabase, isLoading: isSupabaseLoading } = useSupabaseClient();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

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
    const dateString = date.toISOString().split('T')[0];
    return entries.some(entry => entry.date === dateString);
  };

  const getEntryForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return entries.find(entry => entry.date === dateString);
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
    setSelectedEntry(null);
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const entry = getEntryForDate(clickedDate);
    setSelectedEntry(entry || null);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Show loading state while checking authentication
  if (!isLoaded || isSupabaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="breathing w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
          </div>
          <p className="text-slate-600 font-medium">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="glass p-8 rounded-3xl shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <CalendarIcon className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              Sign In Required
            </h1>
            <p className="text-slate-600 mb-6">
              Please sign in to view your calendar
            </p>
            <Link href="/sign-in" className="glass-button px-6 py-3 text-slate-800 font-semibold rounded-2xl hover:scale-105 transition-all duration-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="mobile-container tablet-container desktop-container pt-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Calendar
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            Track your daily reflections
          </p>
        </div>

        {/* Calendar Navigation */}
        <div className="glass p-6 mb-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigateMonth('prev')}
              className="glass-button p-3 rounded-full hover:scale-105 transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5 text-slate-800" />
            </button>
            <h2 className="text-xl text-slate-800 font-bold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={() => navigateMonth('next')}
              className="glass-button p-3 rounded-full hover:scale-105 transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5 text-slate-800" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-sm text-slate-600 font-semibold py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const hasEntry = hasEntryForDate(date);
              const isToday = isCurrentMonth && today.getDate() === day;
              
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square glass-button text-base font-medium relative rounded-2xl transition-all duration-300 hover:scale-105 ${
                    isToday 
                      ? 'bg-gradient-to-r from-purple-100/50 to-blue-100/50 text-purple-600 font-bold border-2 border-purple-300' 
                      : hasEntry 
                        ? 'bg-gradient-to-r from-purple-50/50 to-blue-50/50 text-slate-800 font-semibold' 
                        : 'text-slate-600 hover:bg-white/20'
                  }`}
                >
                  {day}
                  {/* Entry indicator */}
                  {hasEntry && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entry Preview */}
        {selectedEntry ? (
          <div className="glass p-6 rounded-3xl shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <Heart className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl text-slate-800 font-bold">
                {new Date(selectedEntry.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
            </div>
            <div className="mb-4 relative">
              <Image 
                src={selectedEntry.photo_url} 
                alt="Entry photo"
                width={400}
                height={192}
                className="w-full h-48 object-cover rounded-2xl shadow-lg"
              />
              <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2">
                <ImageIcon className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <p className="text-lg text-slate-700 italic leading-relaxed mb-4">
              &ldquo;{selectedEntry.caption}&rdquo;
            </p>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>
                Added at {new Date(selectedEntry.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ) : entries.length > 0 ? (
          <div className="glass p-8 text-center rounded-3xl shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-lg text-slate-700 font-medium mb-2">
              Select a date with an entry to view it
            </p>
            <p className="text-sm text-slate-500">
              Dates with entries are highlighted
            </p>
          </div>
        ) : (
          <div className="glass p-8 text-center rounded-3xl shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl text-slate-800 font-bold mb-2">No Entries Yet</h3>
            <p className="text-lg text-slate-600">
              Start your daily ritual to see your reflections here
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 