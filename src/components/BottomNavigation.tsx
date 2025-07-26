"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-sanctuary-lavender" : "text-sanctuary-sage"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    name: "Room",
    href: "/room",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-sanctuary-lavender" : "text-sanctuary-sage"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-10.5l-4.5 4.5m0 0l-4.5 4.5M6.5 6.5l4.5 4.5"
        />
      </svg>
    ),
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-sanctuary-lavender" : "text-sanctuary-sage"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="18"
          rx="2"
          ry="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
        />
        <line
          x1="16"
          y1="2"
          x2="16"
          y2="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
        />
        <line
          x1="8"
          y1="2"
          x2="8"
          y2="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
        />
        <line
          x1="3"
          y1="10"
          x2="21"
          y2="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
        />
      </svg>
    ),
  },
  {
    name: "Profile",
    href: "/profile",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-sanctuary-lavender" : "text-sanctuary-sage"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-navigation">
      <div className="glass mx-4 mb-4 px-4 py-3">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-sanctuary-lavender/20 scale-105" 
                    : "hover:bg-glass-white hover:scale-102"
                }`}
              >
                {item.icon(isActive)}
                <span
                  className={`text-micro ${
                    isActive 
                      ? "text-sanctuary-lavender font-medium" 
                      : "text-sanctuary-sage"
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