"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Home, Compass, Calendar, User } from "lucide-react";

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass mx-4 mb-4 px-4 py-3 rounded-2xl shadow-xl">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-r from-purple-100/50 to-blue-100/50 scale-105" 
                    : "hover:bg-white/20 hover:scale-102"
                }`}
              >
                {item.name === "Profile" && user?.imageUrl ? (
                  <div className="relative">
                    <Image
                      src={user.imageUrl}
                      alt="Profile"
                      width={24}
                      height={24}
                      className={`w-6 h-6 rounded-full object-cover ${
                        isActive ? 'ring-2 ring-purple-600' : ''
                      }`}
                      onError={(e) => {
                        // Fallback to default icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <IconComponent 
                      className={`w-6 h-6 ${
                        isActive 
                          ? "text-purple-600" 
                          : "text-slate-500"
                      } hidden`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                ) : (
                  <IconComponent 
                    className={`w-6 h-6 ${
                      isActive 
                        ? "text-purple-600" 
                        : "text-slate-500"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
                <span
                  className={`text-xs font-medium ${
                    isActive 
                      ? "text-purple-600" 
                      : "text-slate-500"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 