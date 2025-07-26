import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNavigation from "@/components/BottomNavigation";

export const metadata: Metadata = {
  title: "QuietRoom - Digital Sanctuary",
  description: "One sacred photo, one reflection, one silent moment—every day.",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-sanctuary-white text-sanctuary-navy antialiased font-sf-text">
        <main className="min-h-screen pb-20">
          {children}
        </main>
        <BottomNavigation />
      </body>
    </html>
  );
}
