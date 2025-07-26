"use client";

import { useState, useEffect } from "react";
import { EntryStorage, Entry } from "@/lib/storage";

export default function CalendarPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    setEntries(EntryStorage.getEntries());
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sanctuary-lavender/20 to-sanctuary-white">
      <div className="mobile-container tablet-container desktop-container pt-8">
        <div className="mb-8">
          <h1 className="text-display-medium text-sanctuary-navy mb-2">
            Calendar
          </h1>
          <p className="text-body-medium text-sanctuary-sage">
            Track your daily reflections
          </p>
        </div>

        {/* Calendar Navigation */}
        <div className="glass p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigateMonth('prev')}
              className="glass-button p-2 rounded-full"
            >
              <svg className="w-5 h-5 text-sanctuary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-body-large text-sanctuary-navy font-medium">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={() => navigateMonth('next')}
              className="glass-button p-2 rounded-full"
            >
              <svg className="w-5 h-5 text-sanctuary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-caption text-sanctuary-sage font-medium py-2">
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
                  className={`aspect-square glass-button text-body-medium relative ${
                    isToday 
                      ? 'bg-sanctuary-lavender/30 text-sanctuary-navy font-bold border-sanctuary-lavender' 
                      : hasEntry 
                        ? 'bg-sanctuary-lavender/10 text-sanctuary-navy font-medium' 
                        : 'text-sanctuary-sage'
                  }`}
                >
                  {day}
                  {/* Entry indicator */}
                  {hasEntry && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-sanctuary-lavender rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entry Preview */}
        {selectedEntry ? (
          <div className="glass p-6">
            <h3 className="text-body-large text-sanctuary-navy mb-4">
              {new Date(selectedEntry.date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </h3>
            <div className="mb-4">
              <img 
                src={selectedEntry.photo} 
                alt="Entry photo"
                className="w-full h-48 object-cover rounded-glass"
              />
            </div>
            <p className="text-body-medium text-sanctuary-sage italic">
              &ldquo;{selectedEntry.caption}&rdquo;
            </p>
            <p className="text-caption text-sanctuary-sage mt-4">
              Added at {new Date(selectedEntry.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
        ) : entries.length > 0 ? (
          <div className="glass p-6 text-center">
            <p className="text-body-medium text-sanctuary-sage">
              Select a date with an entry to view it
            </p>
            <p className="text-caption text-sanctuary-sage mt-2">
              Dates with entries are highlighted
            </p>
          </div>
        ) : (
          <div className="glass p-6 text-center">
            <h3 className="text-body-large text-sanctuary-navy mb-2">No Entries Yet</h3>
            <p className="text-body-medium text-sanctuary-sage">
              Start your daily ritual to see your reflections here
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 