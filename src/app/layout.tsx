import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouTube DJ - 실시간 신청곡 플레이어",
  description: "실시간으로 YouTube 신청곡을 받고 재생하는 DJ 플랫폼입니다. Socket.IO 기반 실시간 통신으로 즉시 반영되는 신청곡 시스템을 경험해보세요.",
  keywords: ["YouTube", "DJ", "신청곡", "실시간", "음악", "플레이어", "스트리밍"],
  authors: [{ name: "YouTube DJ Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "YouTube DJ - 실시간 신청곡 플레이어",
    description: "실시간으로 YouTube 신청곡을 받고 재생하는 DJ 플랫폼",
    type: "website",
    locale: "ko_KR",
    siteName: "YouTube DJ"
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube DJ - 실시간 신청곡 플레이어",
    description: "실시간으로 YouTube 신청곡을 받고 재생하는 DJ 플랫폼"
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: [
      { url: "/favicon.png" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
