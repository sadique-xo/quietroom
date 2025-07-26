"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SupabaseEntryStorage, Entry } from "@/lib/supabase-storage";
import { useUser, useClerk, SignOutButton } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase-auth";
import { 
  User, 
  BookOpen, 
  Flame, 
  Trophy, 
  Trash2, 
  LogOut,
  Settings,
  Heart
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const { supabase, isLoading: isSupabaseLoading } = useSupabaseClient();
  const [, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageWordsPerEntry: 0
  });

  useEffect(() => {
    const loadEntries = async () => {
      if (!user?.id || isSupabaseLoading) return;
      
      const loadedEntries = await SupabaseEntryStorage.getEntries(user.id, supabase);
      setEntries(loadedEntries);
      calculateStats(loadedEntries);
    };

    if (isLoaded && user && !isSupabaseLoading) {
      loadEntries();
    }
  }, [user?.id, isLoaded, user, supabase, isSupabaseLoading]);

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



  const handleResetData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all your entries? This action cannot be undone.'
    );
    
    if (confirmed && user?.id && !isSupabaseLoading) {
      const success = await SupabaseEntryStorage.clearAllEntries(user.id, supabase);
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
        successMessage.className = 'fixed top-8 left-1/2 transform -translate-x-1/2 z-toast nav-glass px-6 py-3 text-primary font-medium rounded-xl shadow-xl flex items-center space-x-2';
        successMessage.innerHTML = `
          <div class="w-5 h-5 text-accent">✨</div>
          <span>All data cleared</span>
        `;
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
    <div className="min-h-screen">
      <div className="mobile-container tablet-container desktop-container pt-6 sm:pt-8 pb-32">
        {/* Mobile-optimized Profile Header */}
        <div className="card-modern p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-6">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Profile picture"
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-accent/20 shadow-sm"
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-4 ring-accent/20 shadow-sm ${user?.imageUrl ? 'hidden' : ''}`}>
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-italiana text-xl sm:text-2xl md:text-3xl text-primary mb-1 sm:mb-2">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.fullName || 'Profile'
                }
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-secondary mb-1 sm:mb-2">
                {user?.primaryEmailAddress?.emailAddress || 'Your sanctuary statistics and settings'}
              </p>
              <p className="text-xs sm:text-sm text-secondary/70">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                }) : 'Recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Improved Stats Overview - Single Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="card-modern p-3 sm:p-4 md:p-5 text-center hover:scale-[1.02] transition-all duration-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto mb-3 sm:mb-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-600" />
            </div>
            <div className="font-italiana text-xl sm:text-2xl md:text-3xl text-primary mb-1 sm:mb-2 font-bold">
              {stats.totalEntries}
            </div>
            <p className="text-xs sm:text-sm text-secondary font-medium">Total Entries</p>
          </div>
          
          <div className="card-modern p-3 sm:p-4 md:p-5 text-center hover:scale-[1.02] transition-all duration-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto mb-3 sm:mb-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-orange-600" />
            </div>
            <div className="font-italiana text-xl sm:text-2xl md:text-3xl text-primary mb-1 sm:mb-2 font-bold">
              {stats.currentStreak}
            </div>
            <p className="text-xs sm:text-sm text-secondary font-medium">Current Streak</p>
          </div>
          
          <div className="card-modern p-3 sm:p-4 md:p-5 text-center hover:scale-[1.02] transition-all duration-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto mb-3 sm:mb-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center shadow-sm">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-600" />
            </div>
            <div className="font-italiana text-xl sm:text-2xl md:text-3xl text-primary mb-1 sm:mb-2 font-bold">
              {stats.longestStreak}
            </div>
            <p className="text-xs sm:text-sm text-secondary font-medium">Longest Streak</p>
          </div>
        </div>

        {/* Merged Account & Profile Management Card */}
        {user && (
          <div className="card-modern p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-5 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <h2 className="font-italiana text-lg sm:text-xl md:text-2xl text-primary">Account Settings</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* User Info */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative flex-shrink-0">
                  {user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt="Profile picture"
                      width={56}
                      height={56}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-accent/20 shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                      <span className="font-italiana text-lg sm:text-2xl text-purple-600">
                        {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-base sm:text-lg text-primary font-semibold">
                    {user.firstName || 'User'}
                  </p>
                  <p className="text-xs sm:text-sm text-secondary">
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>
              
              {/* Manage Profile Button */}
              <button 
                onClick={() => clerk.openUserProfile()}
                className="glass-button px-4 py-2.5 text-sm sm:text-base font-semibold rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 sm:whitespace-nowrap"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span>Edit Profile</span>
              </button>
            </div>
            
            {/* Account Description - REMOVED */}
            
            {/* Button Group */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {/* Reset Data Button */}
              <button 
                onClick={handleResetData}
                className="glass-button p-3 text-sm sm:text-base text-red-600 font-semibold rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 border-red-200"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                <span>Reset All Data</span>
              </button>
              
              {/* Sign Out Button - Now Last */}
              <SignOutButton>
                <button className="glass-button p-3 text-sm sm:text-base text-red-600 font-semibold rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 border-red-200">
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <span>Sign Out</span>
                </button>
              </SignOutButton>
            </div>
          </div>
        )}

        {/* Mobile-optimized App Info */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
            <p className="text-xs sm:text-sm text-secondary font-medium">
              QuietRoom v1.0.0
            </p>
          </div>
          <p className="text-xs sm:text-sm text-secondary/70">
            Made with love by Sadique
          </p>
        </div>
      </div>
    </div>
  );
} 