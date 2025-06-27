import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
