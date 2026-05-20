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
  title: "민낯 — 팩트로 보는 대한민국 정치",
  description:
    "색안경 벗고, 팩트로 보는 정치 스코어보드. 공신력 있는 출처만으로 진영별 점수를 투명하게 공개합니다.",
  openGraph: {
    title: "민낯 — 팩트로 보는 대한민국 정치",
    description: "색안경 벗고, 팩트로 보는 정치 스코어보드",
    siteName: "민낯",
    locale: "ko_KR",
    type: "website",
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
        {children}
      </body>
    </html>
  );
}
