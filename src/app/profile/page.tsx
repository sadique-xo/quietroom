"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SupabaseEntryStorage, Entry } from "@/lib/supabase-storage";
import { useUser, useClerk, SignOutButton } from "@clerk/nextjs";
import { 
  User, 
  BookOpen, 
  Flame, 
  Trophy, 
  MessageSquare, 
  Download, 
  Trash2, 
  LogOut,
  Settings,
  Bell,
  Volume2,
  Heart
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const [, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageWordsPerEntry: 0
  });

  useEffect(() => {
    const loadEntries = async () => {
      if (!user?.id) return;
      
      const loadedEntries = await SupabaseEntryStorage.getEntries(user.id);
      setEntries(loadedEntries);
      calculateStats(loadedEntries);
    };

    if (isLoaded && user) {
      loadEntries();
    }
  }, [user?.id, isLoaded, user]);

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

  const handleExportData = async () => {
    try {
      if (!user?.id) return;
      
      const exportData = await SupabaseEntryStorage.exportEntries(user.id);
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
      successMessage.className = 'fixed top-8 left-1/2 transform -translate-x-1/2 z-toast glass px-6 py-3 text-slate-800 font-medium rounded-2xl shadow-xl flex items-center space-x-2';
      successMessage.innerHTML = `
        <Sparkles className="w-5 h-5 text-purple-600" />
        <span>Entries exported successfully ✨</span>
      `;
      document.body.appendChild(successMessage);

      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleResetData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all your entries? This action cannot be undone.'
    );
    
    if (confirmed && user?.id) {
      const success = await SupabaseEntryStorage.clearAllEntries(user.id);
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
        successMessage.className = 'fixed top-8 left-1/2 transform -translate-x-1/2 z-toast glass px-6 py-3 text-slate-800 font-medium rounded-2xl shadow-xl flex items-center space-x-2';
        successMessage.innerHTML = `
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span>All data cleared ✨</span>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="mobile-container tablet-container desktop-container pt-8">
        {/* Profile Header */}
        <div className="glass p-8 mb-8 rounded-3xl shadow-xl">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Profile picture"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-purple-100 shadow-lg"
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center ring-4 ring-purple-100 shadow-lg ${user?.imageUrl ? 'hidden' : ''}`}>
                <User className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.fullName || 'Profile'
                }
              </h1>
              <p className="text-lg text-slate-600 mb-2">
                {user?.primaryEmailAddress?.emailAddress || 'Your sanctuary statistics and settings'}
              </p>
              <p className="text-sm text-slate-500">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                }) : 'Recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass p-6 text-center rounded-3xl shadow-xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl text-slate-800 font-bold mb-2">
              {stats.totalEntries}
            </div>
            <p className="text-sm text-slate-600 font-medium">Total Entries</p>
          </div>
          <div className="glass p-6 text-center rounded-3xl shadow-xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Flame className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl text-slate-800 font-bold mb-2">
              {stats.currentStreak}
            </div>
            <p className="text-sm text-slate-600 font-medium">Current Streak</p>
          </div>
          <div className="glass p-6 text-center rounded-3xl shadow-xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl text-slate-800 font-bold mb-2">
              {stats.longestStreak}
            </div>
            <p className="text-sm text-slate-600 font-medium">Longest Streak</p>
          </div>
          <div className="glass p-6 text-center rounded-3xl shadow-xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl text-slate-800 font-bold mb-2">
              {stats.averageWordsPerEntry}
            </div>
            <p className="text-sm text-slate-600 font-medium">Avg Words</p>
          </div>
        </div>

        {/* Profile Management */}
        <div className="glass p-6 mb-6 rounded-3xl shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl text-slate-800 font-bold">Profile Management</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-slate-600 mb-4">
              Manage your profile picture, name, and account settings using Clerk's secure profile management.
            </p>
            <button 
              onClick={() => {
                // Open Clerk's UserProfile modal
                clerk.openUserProfile();
              }}
              className="w-full glass-button p-4 text-lg text-slate-800 font-semibold rounded-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Settings className="w-5 h-5" />
              <span>Manage Profile & Security</span>
            </button>
          </div>
        </div>

        {/* App Settings */}
        <div className="glass p-6 mb-6 rounded-3xl shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl text-slate-800 font-bold">App Settings</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-purple-600" />
                <span className="text-lg text-slate-700 font-medium">Daily Reminders</span>
              </div>
              <div className="w-12 h-6 bg-purple-200 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-purple-600 rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-purple-600" />
                <span className="text-lg text-slate-700 font-medium">Quiet Room Sounds</span>
              </div>
              <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-slate-400 rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Export & Reset */}
        <div className="space-y-4 mb-6">
          <button 
            onClick={handleExportData}
            className="w-full glass-button p-4 text-lg text-slate-800 font-semibold rounded-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export My Data ({stats.totalEntries} {stats.totalEntries === 1 ? 'entry' : 'entries'})</span>
          </button>
          
          <button 
            onClick={handleResetData}
            className="w-full glass-button p-4 text-lg text-red-600 font-semibold rounded-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 border-red-200"
          >
            <Trash2 className="w-5 h-5" />
            <span>Reset All Data</span>
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="glass p-6 mb-6 rounded-3xl shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl text-slate-800 font-bold">Account</h2>
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <span className="text-2xl text-purple-600 font-bold">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="text-lg text-slate-800 font-semibold">
                  {user.firstName || 'User'}
                </p>
                <p className="text-sm text-slate-600">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
            <SignOutButton>
              <button className="w-full glass-button p-4 text-lg text-red-600 font-semibold rounded-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 border-red-200">
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </SignOutButton>
          </div>
        )}

        {/* App Info */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Heart className="w-4 h-4 text-purple-600" />
            <p className="text-sm text-slate-600 font-medium">
              QuietRoom v1.0.0
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Made with intention and care
          </p>
        </div>
      </div>
    </div>
  );
} 