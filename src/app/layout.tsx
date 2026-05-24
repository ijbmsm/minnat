import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/json-ld";
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
  metadataBase: new URL("https://minnat.kr"),
  title: {
    default: "민낯 — 팩트로 보는 대한민국 정치",
    template: "%s — 민낯",
  },
  description:
    "색안경 벗고, 팩트로 보는 정치 스코어보드. 공신력 있는 출처만으로 진영별 점수를 투명하게 공개합니다.",
  keywords: ["정치", "팩트체크", "스코어보드", "대한민국", "국회", "더불어민주당", "국민의힘", "형사처분", "공약이행률"],
  openGraph: {
    title: "민낯 — 팩트로 보는 대한민국 정치",
    description: "색안경 벗고, 팩트로 보는 정치 스코어보드",
    siteName: "민낯",
    locale: "ko_KR",
    type: "website",
    url: "https://minnat.kr",
  },
  twitter: {
    card: "summary",
    title: "민낯 — 팩트로 보는 대한민국 정치",
    description: "색안경 벗고, 팩트로 보는 정치 스코어보드",
  },
  alternates: {
    canonical: "https://minnat.kr",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0a0c] text-white/90">
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        {children}
      </body>
    </html>
  );
}
