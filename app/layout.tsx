import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ClientLayout from '@/components/ClientLayout';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '芥子 — AI 产品想法验证器',
  description: '「芥子纳须弥」—— 一粒芥子容纳整座须弥山。输入你的产品想法，AI 自动验证方向、分析竞品、生成 PRD 和预览页，帮你判断哪些方向值得做。',
  metadataBase: new URL('https://jiezi.site'),
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    images: [{ url: '/share-card-test.png', width: 1200, height: 630 }],
  },
  other: {
    'theme-color': '#2563eb',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}<ClientLayout /></body>
    </html>
  );
}
