"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EntryStorage } from "@/lib/storage";
import Link from "next/link";

export default function NewEntryPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasEntryToday, setHasEntryToday] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user already has an entry for today
    const today = new Date().toISOString().split('T')[0];
    setHasEntryToday(EntryStorage.hasEntryForDate(today));
  }, []);

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

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEntry = async () => {
    if (!selectedImage || !caption.trim()) {
      alert("Please add both a photo and reflection");
      return;
    }

    setIsLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const success = EntryStorage.saveEntry({
        date: today,
        photo: selectedImage,
        caption: caption.trim(),
      });

      if (success) {
        // Success feedback with gentle animation
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-8 left-1/2 transform -translate-x-1/2 z-toast glass px-6 py-3 text-sanctuary-navy font-medium';
        successMessage.textContent = hasEntryToday ? 'Entry updated for today ✨' : 'Entry saved for today ✨';
        document.body.appendChild(successMessage);

        setTimeout(() => {
          document.body.removeChild(successMessage);
          router.push('/');
        }, 2000);
      } else {
        alert("Error saving entry. Please try again.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sanctuary-lavender/20 to-sanctuary-white">
      <div className="mobile-container tablet-container desktop-container pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display-medium text-sanctuary-navy mb-2">
              {hasEntryToday ? "Update Today's Entry" : "Create New Entry"}
            </h1>
            <p className="text-body-medium text-sanctuary-sage">
              {hasEntryToday 
                ? "You can update your reflection for today" 
                : "Capture one sacred moment from your day"
              }
            </p>
          </div>
          <Link href="/" className="glass-button p-3 rounded-full">
            <svg className="w-6 h-6 text-sanctuary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Photo Upload Section */}
          <div className="glass p-6">
            <h2 className="text-body-large text-sanctuary-navy mb-4">Upload Photo</h2>
            
            {selectedImage ? (
              <div className="relative">
                <img 
                  src={selectedImage} 
                  alt="Selected" 
                  className="w-full h-64 object-cover rounded-glass mb-4"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-button px-4 py-2 text-body-medium text-sanctuary-navy font-medium"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-sanctuary-lavender/50 rounded-glass p-8 text-center bg-sanctuary-lavender/5 cursor-pointer transition-all duration-300 hover:bg-sanctuary-lavender/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sanctuary-lavender/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-sanctuary-lavender" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-body-medium text-sanctuary-sage mb-4">
                  Tap to select your photo
                </p>
                <div className="glass-button px-6 py-3 text-body-medium text-sanctuary-navy font-medium inline-block">
                  Choose Photo
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Caption Section */}
          <div className="glass p-6">
            <h2 className="text-body-large text-sanctuary-navy mb-4">Reflection</h2>
            <textarea
              value={caption}
              onChange={handleCaptionChange}
              className="glass-input w-full p-4 text-body-medium text-sanctuary-navy placeholder-sanctuary-sage/70 resize-none"
              placeholder="What does this moment mean to you?"
              rows={4}
            />
            <div className="flex justify-between items-center mt-4">
              <span className={`text-caption ${caption.length > 260 ? 'text-red-500' : 'text-sanctuary-sage'}`}>
                {caption.length}/280 characters
              </span>
              <button 
                onClick={handleSaveEntry}
                disabled={!selectedImage || !caption.trim() || isLoading}
                className={`glass-button px-6 py-3 text-body-medium font-medium ${
                  !selectedImage || !caption.trim() 
                    ? 'text-sanctuary-sage/50 cursor-not-allowed' 
                    : 'text-sanctuary-navy hover:scale-102'
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                {isLoading ? '...' : hasEntryToday ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 