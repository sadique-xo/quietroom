"use client";

import Image from "next/image";
import { Entry } from "@/lib/supabase-storage";
import { Calendar, Clock, Heart, Image as ImageIcon } from "lucide-react";

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
      className="glass p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] group rounded-3xl shadow-lg hover:shadow-xl"
      onClick={onClick}
    >
      {/* Date Header with floating glass pill */}
      <div className="flex items-center justify-between mb-6">
        <div className="glass px-4 py-2 rounded-full flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-slate-600 font-medium">
            {formatDate(entry.date)}
          </span>
        </div>
        <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Photo with proper spacing and rounded corners */}
      <div className="mb-6 relative group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <Image 
          src={entry.photo} 
          alt="Entry photo"
          width={400}
          height={256}
          className="w-full h-64 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.02] shadow-lg"
        />
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ImageIcon className="w-4 h-4 text-slate-600" />
        </div>
      </div>

      {/* Caption with improved typography */}
      <div className="mb-4">
        <p className="text-lg text-slate-800 leading-relaxed font-medium">
          &ldquo;{entry.caption}&rdquo;
        </p>
      </div>

      {/* Timestamp with subtle styling */}
      <div className="pt-3 border-t border-purple-200/30 flex items-center justify-between">
        <span className="text-xs text-slate-500 flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>
            {new Date(entry.timestamp).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
        </span>
        <Heart className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
} 