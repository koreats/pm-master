'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { useAnimatedCounter, useTrendAnimation } from '@/lib/dashboard/hooks/useAnimatedValue'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  title: string
  value: number
  previousValue?: number
  icon?: React.ReactNode
  iconBgColor?: string
  iconColor?: string
  loading?: boolean
  onClick?: () => void
  format?: 'number' | 'percentage' | 'currency'
  description?: string
  trend?: number
  className?: string
}

/**
 * 메트릭 카드 컴포넌트
 * 대시보드 통계 표시용 카드
 */
export const MetricCard = memo(function MetricCard({
  title,
  value,
  previousValue,
  icon,
  iconBgColor = 'bg-primary-mint-100',
  iconColor = 'text-primary-mint-600',
  loading = false,
  onClick,
  format = 'number',
  description,
  trend,
  className
}: MetricCardProps) {
  // 애니메이션 값
  const animatedValue = useAnimatedCounter(value)
  const trendAnimation = trend !== undefined ? useTrendAnimation(trend) : null
  
  // 포맷팅 함수
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val}%`
      case 'currency':
        return `₩${val.toLocaleString('ko-KR')}`
      default:
        return val.toLocaleString('ko-KR')
    }
  }
  
  // 로딩 상태
  if (loading) {
    return (
      <div className={cn(
        "bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* 제목 */}
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          
          {/* 값 */}
          <div className="flex items-baseline gap-2">
            <motion.p 
              className="text-2xl font-bold text-charcoal"
              key={value}
            >
              {formatValue(value)}
            </motion.p>
            
            {/* 트렌드 표시 */}
            {trendAnimation && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "text-sm font-medium flex items-center gap-0.5",
                  trendAnimation.trendColor
                )}
              >
                <span className="text-xs">{trendAnimation.trendIcon}</span>
                {Math.abs(trend!)}%
              </motion.span>
            )}
          </div>
          
          {/* 설명 */}
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          
          {/* 이전 값과 비교 */}
          {previousValue !== undefined && previousValue !== value && (
            <p className="text-xs text-gray-500 mt-1">
              이전: {formatValue(previousValue)}
            </p>
          )}
        </div>
        
        {/* 아이콘 */}
        {icon && (
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            iconBgColor
          )}>
            <div className={cn("w-6 h-6", iconColor)}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
})

/**
 * 메트릭 카드 스켈레톤
 * 로딩 상태 표시용
 */
export const MetricCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-16" />
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
    </div>
  </div>
)