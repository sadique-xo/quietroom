"use client";

import Image from "next/image";
import { Entry } from "@/lib/supabase-storage";
import { Calendar, Clock, Heart, Sparkles } from "lucide-react";

interface EntryCardProps {
  entry: Entry;
  onClick?: () => void;
  isMultiple?: boolean;
}

export default function EntryCard({ entry, onClick, isMultiple = false }: EntryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div 
      className={`card-modern cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
        isMultiple ? 'p-3 sm:p-4' : 'p-4 sm:p-6'
      }`}
      onClick={onClick}
    >
      {/* Header with date - only show for single entries */}
      {!isMultiple && (
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-italiana text-sm sm:text-base text-primary">
                {formatDate(entry.date)}
              </h3>
              <p className="text-xs sm:text-sm text-secondary">
                {formatTime(entry.timestamp)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-accent/60 to-accent/40 rounded-full"></div>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
          </div>
        </div>
      )}

      {/* Fully dynamic photo container that adapts to image natural size */}
      <div className={`relative w-full ${isMultiple ? 'mb-3 sm:mb-4' : 'mb-4 sm:mb-6'}`}>
        <Image 
          src={entry.photo_url} 
          alt="Entry photo"
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto rounded-xl shadow-sm"
          style={{
            width: '100%',
            height: 'auto'
          }}
          priority={!isMultiple}
        />
      </div>

      {/* Caption with enhanced typography and layout */}
      <div className={`space-y-2 sm:space-y-3 ${isMultiple ? 'mb-2 sm:mb-3' : 'mb-3 sm:mb-4'}`}>
        <blockquote className={`text-secondary leading-relaxed font-medium italic ${
          isMultiple ? 'text-xs sm:text-sm' : 'text-sm sm:text-base md:text-lg'
        }`}>
          &ldquo;{entry.caption}&rdquo;
        </blockquote>
        
        {/* Enhanced metadata section */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-neutral-200">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-secondary/60" />
            <span className="text-xs sm:text-sm text-secondary/80 font-medium">
              {isMultiple ? formatTime(entry.timestamp) : 
                new Date(entry.timestamp).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-accent/70" />
            <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-neutral-300 rounded-full"></div>
            <span className="text-xs text-secondary/60 font-medium">Reflection</span>
          </div>
        </div>
      </div>
    </div>
  );
} 