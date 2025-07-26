"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SupabaseEntryStorage } from "@/lib/supabase-storage";
import { useUser } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase-auth";
import { 
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
        successMessage.className = 'fixed top-8 left-1/2 transform -translate-x-1/2 z-50 nav-glass px-6 py-3 text-primary font-medium rounded-xl shadow-xl flex items-center space-x-2';
        successMessage.innerHTML = `
          <div class="w-5 h-5 text-accent">✨</div>
          <span>Entry ${todayEntriesCount + 1} saved for today</span>
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
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center mobile-container">
          <div className="breathing w-12 h-12 sm:w-16 sm:h-16 rounded-full nav-glass flex items-center justify-center mb-4 mx-auto">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-accent animate-pulse" />
          </div>
          <p className="text-sm sm:text-base text-secondary font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <div className="mobile-container tablet-container desktop-container pt-safe-top pt-6 sm:pt-8">
        {/* Mobile-optimized Header with logo */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="nav-glass px-4 sm:px-6 py-2.5 sm:py-3 flex items-center space-x-2 sm:space-x-3 rounded-[16px] sm:rounded-[20px]">
            <Image
              src="/images/Icon v3.webp"
              alt="QuietRoom Icon"
              width={20}
              height={20}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg"
            />
            <Image
              src="/images/Website Logo.webp"
              alt="QuietRoom"
              width={80}
              height={16}
              className="h-3.5 sm:h-5 w-auto"
            />
          </div>
        </div>

        {/* Mobile-first Header */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-6 sm:mb-8">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="font-italiana text-xl sm:text-2xl md:text-3xl text-primary">
              {hasReachedDailyLimit ? "Daily Limit Reached" : "Add New Entry"}
            </h1>
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-secondary/60 mt-0.5" />
              <p className="text-sm sm:text-base text-secondary leading-relaxed">
                {hasReachedDailyLimit 
                  ? `You've added ${todayEntriesCount}/10 photos today. Come back tomorrow!` 
                  : `Entry ${todayEntriesCount + 1} of 10 for today`
                }
              </p>
            </div>
          </div>

        </div>

        <div className="space-y-6 sm:space-y-8 pb-safe-bottom pb-32">
          {/* Mobile-optimized Photo Upload Section */}
          <div className="card-modern p-4 sm:p-6 animate-slide-up">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h2 className="font-italiana text-lg sm:text-xl text-primary">Upload Photo</h2>
            </div>
            
            {selectedImagePreview ? (
              <div className="relative group">
                <Image 
                  src={selectedImagePreview} 
                  alt="Selected" 
                  width={400}
                  height={256}
                  className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-[12px] sm:rounded-[16px] mb-4 shadow-sm"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-button px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Change Photo</span>
                </button>
              </div>
            ) : (
              <div 
                className={`border-2 border-dashed rounded-[16px] sm:rounded-[20px] p-6 sm:p-8 text-center transition-all duration-200 ${
                  hasReachedDailyLimit 
                    ? 'border-neutral-300 bg-neutral-50/50 cursor-not-allowed'
                    : 'border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10 cursor-pointer hover:bg-gradient-to-br hover:from-accent/10 hover:to-accent/15 hover:scale-[1.01]'
                }`}
                onClick={() => !hasReachedDailyLimit && fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <p className="text-base sm:text-lg text-secondary mb-3 sm:mb-4 font-medium">
                  {hasReachedDailyLimit ? "Daily limit reached" : "Tap to select your photo"}
                </p>
                <div className={`px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 flex items-center space-x-2 mx-auto max-w-fit ${
                  hasReachedDailyLimit 
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                    : 'glass-button hover:scale-[1.02]'
                }`}>
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
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

          {/* Mobile-optimized Caption Section */}
          <div className="card-modern p-4 sm:p-6 animate-slide-up">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h2 className="font-italiana text-lg sm:text-xl text-primary">Reflection</h2>
            </div>
            <textarea
              value={caption}
              onChange={handleCaptionChange}
              className="glass-input w-full p-3 sm:p-4 text-base sm:text-lg placeholder-secondary/60 resize-none rounded-xl"
              placeholder="What does this moment mean to you?"
              rows={4}
            />
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mt-4 sm:mt-6">
              <span className={`text-sm font-medium ${caption.length > 260 ? 'text-red-500' : 'text-secondary'}`}>
                {caption.length}/280 characters
              </span>
              <button 
                onClick={handleSaveEntry}
                disabled={!selectedImageFile || !caption.trim() || isLoading || hasReachedDailyLimit}
                className={`glass-button px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-xl transition-all duration-200 flex items-center space-x-2 w-full sm:w-auto justify-center ${
                  !selectedImageFile || !caption.trim() || hasReachedDailyLimit
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-[1.02]'
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:w-5 sm:h-5" />
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