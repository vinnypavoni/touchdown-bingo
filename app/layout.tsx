import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import Analytics from "../components/GoogleAnalytics"; // ← new component

export const metadata: Metadata = {
  title: "Play Touchdown Bingo",
  description: "Can you complete today's challenge?",
  openGraph: {
    title: "Play Touchdown Bingo",
    description: "Can you complete today's challenge?",
    url: "https://playtouchdownbingo.com",
    siteName: "Touchdown Bingo",
    images: [
      {
        url: "https://playtouchdownbingo.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Touchdown Bingo Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Touchdown Bingo",
    description: "Can you complete today's challenge?",
    images: ["https://playtouchdownbingo.com/og-image.png"],
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Play Touchdown Bingo</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="google-adsense-account" content="ca-pub-8274422118651919" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8274422118651919"
          crossOrigin="anonymous"
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Analytics /> {/* ✅ GA loads client-side only */}
        {children}
        <VercelAnalytics />
      </body>
    </html>
  );
}
