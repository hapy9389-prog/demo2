// 스케줄러를 서버 프로세스 기동 시 1회 시작시키기 위한 side-effect import.
// 루트 레이아웃은 앱의 첫 요청에서 항상 로드되므로, 별도의 instrumentation.ts
// 설정 없이도 이 위치에서 import하는 것만으로 "로컬 상시구동 서버" 전제를 만족시킬 수 있다.
import "@/lib/scheduler";

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
  title: "현실 시간과 연결되는 AI 캐릭터 채팅",
  description: "캐릭터와 채팅하다 리마인더를 부탁하면, 실제 그 시간에 캐릭터가 먼저 말을 겁니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
