'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // 임시로 대시보드로 리다이렉트
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-mint-50 to-accent-sky-50">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-charcoal">PM System 2025</h1>
        <p className="text-xl text-gray-600">프로젝트 관리의 새로운 시작</p>
        <div className="flex justify-center pt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-mint-500"></div>
        </div>
      </div>
    </div>
  )
}
