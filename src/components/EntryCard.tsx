"use client";

import { Entry } from "@/lib/storage";

interface EntryCardProps {
  entry: Entry;
  onClick?: () => void;
}

export default function EntryCard({ entry, onClick }: EntryCardProps) {
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

  return (
    <div 
      className="glass p-sanctuary-lg cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-glass-hover group"
      onClick={onClick}
    >
      {/* Date Header with floating glass pill */}
      <div className="flex items-center justify-between mb-sanctuary-md">
        <div className="glass px-sanctuary-xs py-1 rounded-full">
          <span className="text-caption text-sanctuary-sage font-medium">
            {formatDate(entry.date)}
          </span>
        </div>
        <div className="w-2 h-2 bg-sanctuary-lavender rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Photo with proper spacing and rounded corners */}
      <div className="mb-sanctuary-md">
        <img 
          src={entry.photo} 
          alt="Entry photo"
          className="w-full h-64 object-cover rounded-glass transition-transform duration-300 group-hover:scale-[1.01]"
        />
      </div>

      {/* Caption with improved typography */}
      <div className="mb-sanctuary-sm">
        <p className="text-body-medium text-sanctuary-navy leading-relaxed font-sf-text">
          &ldquo;{entry.caption}&rdquo;
        </p>
      </div>

      {/* Timestamp with subtle styling */}
      <div className="pt-sanctuary-xs border-t border-sanctuary-lavender/20">
        <span className="text-micro text-sanctuary-sage">
          {new Date(entry.timestamp).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
} 