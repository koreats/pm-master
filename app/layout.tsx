import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PM System 2025',
  description: '1-5명 소규모 팀을 위한 초경량 프로젝트 관리 시스템',
  keywords: ['프로젝트 관리', '협업 도구', 'PM 시스템', '태스크 관리'],
  authors: [{ name: 'PM System Team' }],
  openGraph: {
    title: 'PM System 2025',
    description: '5분 내 시작 가능한 초경량 프로젝트 관리 도구',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
