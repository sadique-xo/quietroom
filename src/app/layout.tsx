import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNavigation from "@/components/BottomNavigation";
import { ClerkProvider } from '@clerk/nextjs';
import { inter } from '@/lib/fonts';

export const metadata: Metadata = {
  title: "QuietRoom - Digital Sanctuary",
  description: "One sacred photo, one reflection, one silent moment—every day.",
  icons: {
    icon: '/images/Icon v3.webp',
    apple: '/images/Icon v3.webp',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#E6E6FA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/images/Icon v3.webp" type="image/webp" />
          <link rel="apple-touch-icon" href="/images/Icon v3.webp" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#E6E6FA" />
        </head>
        <body className={`antialiased ${inter.className}`}>
          <main className="min-h-screen pb-20">
            {children}
          </main>
          <BottomNavigation />
        </body>
      </html>
    </ClerkProvider>
  );
}
