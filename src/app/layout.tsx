import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNavigation from "@/components/BottomNavigation";
import { ClerkProvider } from '@clerk/nextjs';
import { inter, urbanist } from '@/lib/fonts';

export const metadata: Metadata = {
  title: "QuietRoom - Digital Sanctuary",
  description: "A mindful digital sanctuary for daily reflection. Capture sacred moments, write reflections, and experience silent moments—every day.",
  icons: {
    icon: '/images/Icon v3.webp',
    apple: '/images/Icon v3.webp',
  },
  manifest: '/manifest.json',
  metadataBase: new URL('https://room.sadique.co'),
  openGraph: {
    title: 'QuietRoom - Digital Sanctuary',
    description: 'A mindful digital sanctuary for daily reflection. Capture sacred moments, write reflections, and experience silent moments—every day.',
    url: 'https://room.sadique.co',
    siteName: 'QuietRoom',
    images: [
      {
        url: '/images/Social_Image.webp',
        width: 1200,
        height: 630,
        alt: 'QuietRoom - Digital Sanctuary',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuietRoom - Digital Sanctuary',
    description: 'A mindful digital sanctuary for daily reflection. Capture sacred moments, write reflections, and experience silent moments—every day.',
    images: ['/images/Social_Image.webp'],
    creator: '@sadique_xo',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E6E6FA',
  viewportFit: 'cover', // Enhanced for mobile devices with notches
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={urbanist.variable}>
        <head>
          <link rel="icon" href="/images/Icon v3.webp" type="image/webp" />
          <link rel="apple-touch-icon" href="/images/Icon v3.webp" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#E6E6FA" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className={`antialiased ${inter.className}`}>
          <main className="min-h-dvh pb-32">
            {children}
          </main>
          <BottomNavigation />
        </body>
      </html>
    </ClerkProvider>
  );
}
