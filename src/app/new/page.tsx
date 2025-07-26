"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SupabaseEntryStorage } from "@/lib/supabase-storage";
import { useUser } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase-auth";
import Link from "next/link";
import { 
  X, 
  Upload, 
  Camera, 
  Edit3, 
  Save, 
  Sparkles,
  Heart,
  Clock
} from "lucide-react";

export default function NewEntryPage() {
  const { user, isLoaded } = useUser();
  const { supabase, isLoading: isSupabaseLoading } = useSupabaseClient();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // Cleanup preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (selectedImagePreview && selectedImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [todayEntriesCount, setTodayEntriesCount] = useState(0);
  const [hasReachedDailyLimit, setHasReachedDailyLimit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check how many entries user has for today
    const checkTodaysEntries = async () => {
      if (!user?.id || isSupabaseLoading) return;
      
      const today = new Date().toISOString().split('T')[0];
      const count = await SupabaseEntryStorage.getEntriesCountForDate(user.id, today, supabase);
      const reachedLimit = await SupabaseEntryStorage.hasReachedDailyLimit(user.id, today, supabase);
      
      setTodayEntriesCount(count);
      setHasReachedDailyLimit(reachedLimit);
    };

    if (isLoaded && user && !isSupabaseLoading) {
      checkTodaysEntries();
    }
  }, [user?.id, isLoaded, user, supabase, isSupabaseLoading]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }

    // Clean up previous preview URL if it exists
    if (selectedImagePreview && selectedImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImageFile(file);
    
    // Use URL.createObjectURL for preview - no base64 conversion needed!
    const previewUrl = URL.createObjectURL(file);
    setSelectedImagePreview(previewUrl);
  };

  const handleSaveEntry = async () => {
    if (!selectedImageFile || !caption.trim()) {
      alert("Please add both a photo and reflection");
      return;
    }

    if (!user?.id) {
      alert("Please sign in to save your entry");
      return;
    }

    setIsLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await SupabaseEntryStorage.saveEntry(user.id, {
        date: today,
        photo_url: '', // Will be set by upload
        photo_filename: '', // Will be set by upload  
        photo_size: 0, // Will be set by upload
        photo_format: '', // Will be set by upload
        caption: caption.trim(),
        imageFile: selectedImageFile,
      }, supabase);

      if (result.success) {
        // Success feedback with gentle animation
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-8 left-1/2 transform -translate-x-1/2 z-50 glass px-6 py-3 text-slate-800 font-medium rounded-2xl shadow-xl flex items-center space-x-2';
        successMessage.innerHTML = `
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span>Entry ${todayEntriesCount + 1} saved for today ✨</span>
        `;
        document.body.appendChild(successMessage);

        // Update the entry count
        setTodayEntriesCount(prevCount => prevCount + 1);
        
        setTimeout(() => {
          document.body.removeChild(successMessage);
          router.push('/');
        }, 2000);
      } else {
        const errorMessage = result.error || "Error saving entry. Please try again.";
        console.error("Save entry failed:", errorMessage);
        alert(`Error saving entry: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Error saving entry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value.length <= 280) {
      setCaption(value);
    }
  };

  // Redirect to sign-in if not authenticated
  if (isLoaded && !user) {
    router.push('/sign-in');
    return null;
  }

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="breathing w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
          </div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="mobile-container tablet-container desktop-container pt-8">
        {/* Header with Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="glass px-6 py-3 flex items-center space-x-3 rounded-2xl shadow-lg">
            <Image
              src="/images/Icon v3.webp"
              alt="QuietRoom Icon"
              width={24}
              height={24}
              className="rounded-lg"
            />
            <Image
              src="/images/Website Logo.webp"
              alt="QuietRoom"
              width={100}
              height={20}
              className="h-5 w-auto"
            />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {hasReachedDailyLimit ? "Daily Limit Reached" : "Add New Entry"}
            </h1>
            <p className="text-lg text-slate-600 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span>
                {hasReachedDailyLimit 
                  ? `You've added ${todayEntriesCount}/10 photos today. Come back tomorrow!` 
                  : `Entry ${todayEntriesCount + 1} of 10 for today`
                }
              </span>
            </p>
          </div>
          <Link href="/" className="glass-button p-3 rounded-full hover:scale-105 transition-all duration-300">
            <X className="w-6 h-6 text-slate-800" />
          </Link>
        </div>

        <div className="space-y-6">
          {/* Photo Upload Section */}
          <div className="glass p-6 rounded-3xl shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Upload Photo</h2>
            </div>
            
            {selectedImagePreview ? (
              <div className="relative">
                <Image 
                  src={selectedImagePreview} 
                  alt="Selected" 
                  width={400}
                  height={256}
                  className="w-full h-64 object-cover rounded-2xl mb-4 shadow-lg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-button px-6 py-3 text-base text-slate-800 font-semibold rounded-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Change Photo</span>
                </button>
              </div>
            ) : (
              <div 
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
                  hasReachedDailyLimit 
                    ? 'border-slate-300 bg-slate-50/50 cursor-not-allowed'
                    : 'border-purple-300 bg-gradient-to-br from-purple-50/50 to-blue-50/50 cursor-pointer hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 hover:scale-[1.02]'
                }`}
                onClick={() => !hasReachedDailyLimit && fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-lg text-slate-600 mb-4 font-medium">
                  {hasReachedDailyLimit ? "Daily limit reached" : "Tap to select your photo"}
                </p>
                <div className={`px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 flex items-center space-x-2 ${
                  hasReachedDailyLimit 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'glass-button text-slate-800 hover:scale-105'
                }`}>
                  <Camera className="w-5 h-5" />
                  <span>{hasReachedDailyLimit ? "Limit Reached" : "Choose Photo"}</span>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={hasReachedDailyLimit}
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Caption Section */}
          <div className="glass p-6 rounded-3xl shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Reflection</h2>
            </div>
            <textarea
              value={caption}
              onChange={handleCaptionChange}
              className="glass-input w-full p-4 text-lg text-slate-800 placeholder-slate-500/70 resize-none rounded-2xl"
              placeholder="What does this moment mean to you?"
              rows={4}
            />
            <div className="flex justify-between items-center mt-6">
              <span className={`text-sm font-medium ${caption.length > 260 ? 'text-red-500' : 'text-slate-500'}`}>
                {caption.length}/280 characters
              </span>
              <button 
                onClick={handleSaveEntry}
                disabled={!selectedImageFile || !caption.trim() || isLoading || hasReachedDailyLimit}
                className={`glass-button px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 flex items-center space-x-2 ${
                  !selectedImageFile || !caption.trim() || hasReachedDailyLimit
                    ? 'text-slate-400 cursor-not-allowed' 
                    : 'text-slate-800 hover:scale-105'
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 