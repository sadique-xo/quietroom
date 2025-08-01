"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Home, Compass, Calendar, User, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Room",
    href: "/room",
    icon: Compass,
  },
];

const rightNavigationItems = [
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useUser();
  const [supportsBackdrop, setSupportsBackdrop] = useState(true);

  useEffect(() => {
    // Test if backdrop-filter is supported
    const testEl = document.createElement('div');
    testEl.style.backdropFilter = 'blur(1px)';
    const supported = testEl.style.backdropFilter !== '';
    setSupportsBackdrop(supported);
  }, []);

  const navStyles = supportsBackdrop ? {
    background: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(8px) saturate(160%)',
    WebkitBackdropFilter: 'blur(8px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px rgba(19, 19, 19, 0.06), 0 2px 8px rgba(19, 19, 19, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
  } : {
    background: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 8px 32px rgba(19, 19, 19, 0.06)'
  };

  const renderNavItem = (item: typeof navigationItems[0]) => {
    const isActive = pathname === item.href;
    const IconComponent = item.icon;
    
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`group flex items-center justify-center min-w-[3rem] w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all duration-200 ${
          isActive 
            ? "bg-accent/15 scale-105" 
            : "hover:bg-white/40 hover:scale-105 active:scale-98"
        }`}
      >
        {item.name === "Profile" && user?.imageUrl ? (
          <div className="relative w-6 h-6 sm:w-7 sm:h-7">
            <Image
              src={user.imageUrl}
              alt="Profile"
              fill
              className={`rounded-full object-cover transition-all duration-200 ${
                isActive ? 'ring-2 ring-accent/50' : ''
              }`}
              sizes="(max-width: 640px) 24px, 28px"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            {/* Fallback User icon if image fails to load */}
            <User 
              className={`absolute inset-0 w-6 h-6 sm:w-7 sm:h-7 text-secondary transition-all duration-200 ${
                isActive 
                  ? "text-primary stroke-[2.5px]" 
                  : "text-secondary stroke-[2px]"
              }`}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <IconComponent 
            className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-200 ${
              isActive 
                ? "text-primary stroke-[2.5px]" 
                : "text-secondary group-hover:text-primary stroke-[2px]"
            }`}
          />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Simple background instead of gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-accent/5 pointer-events-none z-10"></div>
      
      <nav className="fixed bottom-0 left-0 right-0 z-navigation">
        {/* Safe area padding for mobile devices */}
        <div className="pb-safe-bottom">
          {/* Professional glass navigation */}
          <div 
            className="mx-4 mb-4 px-4 py-3 rounded-[32px] sm:py-4 sm:mx-auto sm:w-96 sm:px-6"
            style={navStyles}
          >
            <div className="flex items-center justify-between relative">
              {/* Left Navigation Items */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                {navigationItems.map(renderNavItem)}
              </div>

              {/* Simplified Plus Button - No Gradients */}
              <Link
                href="/new"
                className="absolute left-1/2 transform -translate-x-1/2 -translate-y-2 sm:-translate-y-3 group"
              >
                <div className="relative">
                  {/* Simple button without gradients */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 group-active:scale-95 transition-all duration-200">
                    {/* Plus icon */}
                    <Plus 
                      className="w-7 h-7 sm:w-8 sm:h-8 text-black group-hover:rotate-90 transition-transform duration-300" 
                      strokeWidth={2.5}
                    />
                  </div>
                </div>
              </Link>

              {/* Right Navigation Items */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                {rightNavigationItems.map(renderNavItem)}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
} 