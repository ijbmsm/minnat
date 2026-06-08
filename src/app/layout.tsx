import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_KR, IBM_Plex_Mono } from "next/font/google";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/json-ld";
import { PoliticsSubNav } from "@/components/politics-subnav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://drinkplace.kr"),
  title: {
    default: "술자리 — 정치 · 사주",
    template: "%s — 술자리",
  },
  description:
    "술자리에서 나누는 두 가지 주제 — 정치 팩트체크 스코어보드와 사주팔자 AI 해석.",
  keywords: ["정치", "팩트체크", "스코어보드", "사주", "사주팔자", "대한민국", "국회", "더불어민주당", "국민의힘"],
  openGraph: {
    title: "술자리 — 정치 · 사주",
    description: "술자리에서 나누는 두 가지 주제 — 정치 팩트와 사주팔자",
    siteName: "술자리",
    locale: "ko_KR",
    type: "website",
    url: "https://drinkplace.kr",
  },
  twitter: {
    card: "summary",
    title: "술자리 — 정치 · 사주",
    description: "술자리에서 나누는 두 가지 주제 — 정치 팩트와 사주팔자",
  },
  alternates: {
    canonical: "https://drinkplace.kr",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { url: "/icon-192-maskable.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512-maskable.png", sizes: "512x512", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifKR.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0a0c] text-white">
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <PoliticsSubNav />
        {children}
      </body>
    </html>
  );
}
