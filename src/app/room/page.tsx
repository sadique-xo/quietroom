"use client";

import { useState, useEffect, useRef } from "react";
import { 
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
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute default
  const [selectedTime, setSelectedTime] = useState(60);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const timerOptions = [
    { value: 60, label: "1 min" },
    { value: 120, label: "2 min" },
    { value: 240, label: "4 min" }
  ];

  // Initialize audio with predefined music source
  useEffect(() => {
    audioRef.current = new Audio('/audio/meditation-music.mp3'); // Backend music source
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            // Stop music when session ends
            if (audioRef.current) {
              audioRef.current.pause();
            }
            // Play gentle notification sound if enabled
            if (isSoundEnabled) {
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
    // Start music if sound is enabled
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const pauseTimer = () => {
    setIsActive(false);
    // Pause music when timer is paused
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(selectedTime);
    // Stop and reset music
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const selectTime = (seconds: number) => {
    setSelectedTime(seconds);
    setTimeLeft(seconds);
    setIsActive(false);
    // Stop music when changing time
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const toggleSound = () => {
    const newSoundState = !isSoundEnabled;
    setIsSoundEnabled(newSoundState);
    
    // Control music based on sound toggle and timer state
    if (audioRef.current) {
      if (newSoundState && isActive) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0">
      {/* Mobile-centered content */}
      <div className="flex items-center justify-center h-full px-4 py-8">
        <div className="text-center w-full max-w-sm mx-auto">
          {/* Mobile-optimized Breathing Circle */}
          <div className="relative mb-8 sm:mb-12">
            <div className={`${isActive ? 'breathing' : ''} w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full glass border border-glass-border transition-all duration-300`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className={`w-6 h-6 sm:w-8 sm:h-8 text-accent mx-auto mb-2 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-base sm:text-lg text-primary font-semibold">
                  {isActive ? 'Breathe' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Mobile-optimized Timer Display */}
          <div className="card-modern p-6 sm:p-8 mb-6 sm:mb-8">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <div className="font-italiana text-3xl sm:text-4xl md:text-5xl text-primary">
                {formatTime(timeLeft)}
              </div>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-secondary">
              {isActive ? 'Focus on your breath' : 'Choose your session length'}
            </p>
          </div>

          {/* Mobile-optimized Timer Selection with Pill Design */}
          <div className="card-modern p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-center space-x-2 sm:space-x-4">
              {timerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => selectTime(option.value)}
                  className={`relative overflow-hidden px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-full transition-all duration-200 ${
                    selectedTime === option.value 
                      ? 'bg-accent/20 scale-105 shadow-lg' 
                      : 'bg-glass hover:bg-accent/10 hover:scale-[1.02]'
                  } backdrop-blur-md border border-white/20`}
                  style={{
                    background: selectedTime === option.value 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                  }}
                >
                  {/* Glass effect white strike */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-30 transform -skew-x-12 w-6 h-full transition-all duration-500 group-hover:translate-x-full"></div>
                  <span className="relative z-10 text-primary">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile-optimized Control Panel */}
          <div className="card-modern p-4 sm:p-6">
            <div className="flex items-center justify-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
              {/* Sound Toggle */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full glass border border-white/20 backdrop-blur-md flex items-center justify-center">
                <button 
                  onClick={toggleSound}
                  className={`w-full h-full rounded-full transition-all duration-200 hover:scale-105 flex items-center justify-center ${
                    isSoundEnabled ? 'bg-accent/15' : 'hover:bg-accent/5'
                  }`}
                >
                  {isSoundEnabled ? (
                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  ) : (
                    <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                  )}
                </button>
              </div>

              {/* Main Control Button */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full glass border border-white/20 backdrop-blur-md flex items-center justify-center">
                <button 
                  onClick={isActive ? pauseTimer : startTimer}
                  disabled={timeLeft === 0}
                  className={`w-full h-full rounded-full transition-all duration-200 flex items-center justify-center ${
                    isActive ? 'bg-gradient-to-r from-accent/30 to-accent/20' : 'bg-gradient-to-r from-accent/20 to-accent/10'
                  } ${timeLeft === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                >
                  {isActive ? (
                    <Pause className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-primary" />
                  ) : (
                    <Play className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-primary ml-1" />
                  )}
                </button>
              </div>

              {/* Reset Button */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full glass border border-white/20 backdrop-blur-md flex items-center justify-center">
                <button 
                  onClick={resetTimer}
                  className="w-full h-full rounded-full transition-all duration-200 hover:scale-105 hover:bg-accent/5 flex items-center justify-center"
                >
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                </button>
              </div>
            </div>

            {/* Mobile-optimized Status Text */}
            <div className="text-center">
              <p className="text-sm sm:text-base text-secondary font-medium">
                {isActive ? 'Session in progress...' : 'Ready to begin your quiet time'}
              </p>
              {isSoundEnabled && (
                <p className="text-xs sm:text-sm text-secondary/70 mt-1 sm:mt-2 flex items-center justify-center space-x-1">
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Background music enabled</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 