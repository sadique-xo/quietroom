"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Sparkles,
  Clock
} from "lucide-react";

export default function QuietRoomPage() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [selectedTime, setSelectedTime] = useState(300);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const timerOptions = [
    { value: 300, label: "5 min" },
    { value: 600, label: "10 min" },
    { value: 900, label: "15 min" }
  ];

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            // Play gentle notification sound if enabled
            if (isSoundEnabled) {
              // Could add actual sound here
              console.log('Session complete');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, isSoundEnabled]);

  const startTimer = () => {
    setIsActive(true);
    setTimeLeft(selectedTime);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(selectedTime);
  };

  const selectTime = (seconds: number) => {
    setSelectedTime(seconds);
    setTimeLeft(seconds);
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (isActive) {
      const confirmed = window.confirm('Are you sure you want to leave? Your session will be lost.');
      if (!confirmed) return;
    }
    router.push('/');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50/30 via-white to-blue-50/20">
      {/* Close Button */}
      <button 
        onClick={handleClose}
        className="absolute top-8 left-8 z-overlay glass-button p-3 rounded-full hover:scale-105 transition-all duration-300"
      >
        <X className="w-6 h-6 text-slate-800" />
      </button>

      {/* Breathing Circle */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative mb-12">
            <div className={`${isActive ? 'breathing' : ''} w-40 h-40 mx-auto rounded-full glass border-2 border-purple-200/50 transition-all duration-300 shadow-xl`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className={`w-8 h-8 text-purple-600 mx-auto mb-2 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-lg text-slate-800 font-semibold">
                  {isActive ? 'Breathe' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Timer Display */}
          <div className="glass p-8 mb-8 rounded-3xl shadow-xl">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Clock className="w-8 h-8 text-purple-600" />
              <div className="text-5xl text-slate-800 font-bold">
                {formatTime(timeLeft)}
              </div>
            </div>
            <p className="text-lg text-slate-600">
              {isActive ? 'Focus on your breath' : 'Choose your session length'}
            </p>
          </div>

          {/* Timer Selection */}
          <div className="glass p-6 mb-6 rounded-3xl shadow-xl">
            <div className="flex items-center justify-center space-x-4">
              {timerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => selectTime(option.value)}
                  className={`glass-button px-6 py-3 text-lg font-medium rounded-2xl transition-all duration-300 ${
                    selectedTime === option.value 
                      ? 'text-purple-600 bg-gradient-to-r from-purple-100/50 to-blue-100/50 scale-105' 
                      : 'text-slate-600 hover:text-slate-800 hover:scale-102'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Control Panel */}
          <div className="glass p-6 rounded-3xl shadow-xl">
            <div className="flex items-center justify-center space-x-6 mb-6">
              {/* Sound Toggle */}
              <button 
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={`glass-button p-4 rounded-full transition-all duration-300 hover:scale-105 ${
                  isSoundEnabled ? 'bg-gradient-to-r from-purple-100/50 to-blue-100/50' : ''
                }`}
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-6 h-6 text-purple-600" />
                ) : (
                  <VolumeX className="w-6 h-6 text-slate-600" />
                )}
              </button>

              {/* Main Control Button */}
              <button 
                onClick={isActive ? pauseTimer : startTimer}
                disabled={timeLeft === 0}
                className={`glass-button p-8 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-gradient-to-r from-purple-100/50 to-blue-100/50' : 'bg-gradient-to-r from-purple-50/50 to-blue-50/50'
                } ${timeLeft === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
              >
                {isActive ? (
                  <Pause className="w-10 h-10 text-purple-600" />
                ) : (
                  <Play className="w-10 h-10 text-purple-600 ml-1" />
                )}
              </button>

              {/* Reset Button */}
              <button 
                onClick={resetTimer}
                className="glass-button p-4 rounded-full transition-all duration-300 hover:scale-105"
              >
                <RotateCcw className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* Status Text */}
            <div className="text-center">
              <p className="text-base text-slate-600 font-medium">
                {isActive ? 'Session in progress...' : 'Ready to begin your quiet time'}
              </p>
              {isSoundEnabled && (
                <p className="text-sm text-slate-500 mt-2 flex items-center justify-center space-x-1">
                  <Volume2 className="w-4 h-4" />
                  <span>Ambient sounds enabled</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 