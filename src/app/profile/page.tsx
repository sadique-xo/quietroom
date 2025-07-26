"use client";

import { useState, useEffect } from "react";
import { EntryStorage, Entry } from "@/lib/storage";

export default function ProfilePage() {
  const [, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageWordsPerEntry: 0
  });

  useEffect(() => {
    const loadedEntries = EntryStorage.getEntries();
    setEntries(loadedEntries);
    calculateStats(loadedEntries);
  }, []);

  const calculateStats = (entriesData: Entry[]) => {
    if (entriesData.length === 0) {
      setStats({
        totalEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageWordsPerEntry: 0
      });
      return;
    }

    // Sort entries by date
    const sortedEntries = [...entriesData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);
    
    // Check if there's an entry for today or yesterday to start the streak
    const todayString = today.toISOString().split('T')[0];
    const yesterdayString = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const hasToday = entriesData.some(e => e.date === todayString);
    const hasYesterday = entriesData.some(e => e.date === yesterdayString);
    
    if (hasToday) {
      currentStreak = 1;
      checkDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    } else if (hasYesterday) {
      currentStreak = 1;
      checkDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    }

    // Count backwards from check date
    while (currentStreak > 0) {
      const checkDateString = checkDate.toISOString().split('T')[0];
      const hasEntry = entriesData.some(e => e.date === checkDateString);
      
      if (hasEntry) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const entry of sortedEntries) {
      const currentDate = new Date(entry.date);
      
      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      prevDate = currentDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate average words per entry
    const totalWords = entriesData.reduce((total, entry) => {
      return total + entry.caption.split(' ').filter(word => word.length > 0).length;
    }, 0);
    const averageWords = entriesData.length > 0 ? Math.round(totalWords / entriesData.length) : 0;

    setStats({
      totalEntries: entriesData.length,
      currentStreak: Math.max(0, currentStreak - 1), // Subtract 1 since we started at 1
      longestStreak,
      averageWordsPerEntry: averageWords
    });
  };

  const handleExportData = () => {
    try {
      const exportData = EntryStorage.exportEntries();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quietroom-entries-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-8 left-1/2 transform -translate-x-1/2 z-toast glass px-6 py-3 text-sanctuary-navy font-medium';
      successMessage.textContent = 'Entries exported successfully ✨';
      document.body.appendChild(successMessage);

      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleResetData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all your entries? This action cannot be undone.'
    );
    
    if (confirmed) {
      const success = EntryStorage.clearAllEntries();
      if (success) {
        setEntries([]);
        setStats({
          totalEntries: 0,
          currentStreak: 0,
          longestStreak: 0,
          averageWordsPerEntry: 0
        });

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-8 left-1/2 transform -translate-x-1/2 z-toast glass px-6 py-3 text-sanctuary-navy font-medium';
        successMessage.textContent = 'All data cleared ✨';
        document.body.appendChild(successMessage);

        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
      } else {
        alert('Failed to reset data. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sanctuary-lavender/20 to-sanctuary-white">
      <div className="mobile-container tablet-container desktop-container pt-8">
        <div className="mb-8">
          <h1 className="text-display-medium text-sanctuary-navy mb-2">
            Profile
          </h1>
          <p className="text-body-medium text-sanctuary-sage">
            Your sanctuary statistics and settings
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass p-6 text-center">
            <div className="text-display-medium text-sanctuary-navy font-bold mb-2">
              {stats.totalEntries}
            </div>
            <p className="text-body-medium text-sanctuary-sage">Total Entries</p>
          </div>
          <div className="glass p-6 text-center">
            <div className="text-display-medium text-sanctuary-navy font-bold mb-2">
              {stats.currentStreak}
            </div>
            <p className="text-body-medium text-sanctuary-sage">Current Streak</p>
          </div>
          <div className="glass p-6 text-center">
            <div className="text-display-medium text-sanctuary-navy font-bold mb-2">
              {stats.longestStreak}
            </div>
            <p className="text-body-medium text-sanctuary-sage">Longest Streak</p>
          </div>
          <div className="glass p-6 text-center">
            <div className="text-display-medium text-sanctuary-navy font-bold mb-2">
              {stats.averageWordsPerEntry}
            </div>
            <p className="text-body-medium text-sanctuary-sage">Avg Words</p>
          </div>
        </div>

        {/* Settings */}
        <div className="glass p-6 mb-6">
          <h2 className="text-body-large text-sanctuary-navy mb-6">Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-body-medium text-sanctuary-navy">Daily Reminders</span>
              <div className="w-12 h-6 bg-sanctuary-lavender/20 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-sanctuary-lavender rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-body-medium text-sanctuary-navy">Quiet Room Sounds</span>
              <div className="w-12 h-6 bg-sanctuary-sage/20 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-sanctuary-sage rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Export & Reset */}
        <div className="space-y-4">
          <button 
            onClick={handleExportData}
            className="w-full glass-button p-4 text-body-medium text-sanctuary-navy font-medium"
          >
            Export My Data ({stats.totalEntries} {stats.totalEntries === 1 ? 'entry' : 'entries'})
          </button>
          
          <button 
            onClick={handleResetData}
            className="w-full glass-button p-4 text-body-medium text-red-600 font-medium border-red-200"
          >
            Reset All Data
          </button>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center">
          <p className="text-caption text-sanctuary-sage">
            QuietRoom v1.0.0
          </p>
          <p className="text-caption text-sanctuary-sage mt-2">
            Made with intention and care
          </p>
        </div>
      </div>
    </div>
  );
} 