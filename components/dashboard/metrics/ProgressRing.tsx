'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { useProgressRing } from '@/lib/dashboard/hooks/useAnimatedValue'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  label?: string
  showPercentage?: boolean
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  className?: string
}

/**
 * 원형 진행률 컴포넌트
 * SVG 기반 애니메이션 진행률 표시
 */
export const ProgressRing = memo(function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  label,
  showPercentage = true,
  color = 'primary',
  className
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const { circumference, strokeDashoffset, displayValue } = useProgressRing(progress, radius)
  
  // 색상 매핑
  const colorClasses = {
    primary: 'text-primary-mint-600',
    secondary: 'text-accent-sky-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  }
  
  const bgColorClasses = {
    primary: 'text-primary-mint-100',
    secondary: 'text-accent-sky-100',
    success: 'text-green-100',
    warning: 'text-yellow-100',
    danger: 'text-red-100'
  }
  
  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={bgColorClasses[color]}
        />
        
        {/* 진행률 원 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeDashoffset.get() }}
          transition={{ duration: 1, ease: "easeInOut" }}
          strokeLinecap="round"
          className={colorClasses[color]}
        />
      </svg>
      
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.span className="text-2xl font-bold text-charcoal">
            {displayValue}
          </motion.span>
        )}
        {label && (
          <span className="text-xs text-gray-600 mt-1">{label}</span>
        )}
      </div>
    </div>
  )
})

/**
 * 작은 진행률 링
 * 컴팩트한 공간에 사용
 */
export const MiniProgressRing = memo(function MiniProgressRing({
  progress,
  size = 40,
  strokeWidth = 3,
  color = 'primary'
}: Pick<ProgressRingProps, 'progress' | 'size' | 'strokeWidth' | 'color'>) {
  return (
    <ProgressRing
      progress={progress}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      showPercentage={false}
    />
  )
})

/**
 * 진행률 링 그룹
 * 여러 진행률을 나란히 표시
 */
export const ProgressRingGroup = memo(function ProgressRingGroup({
  items,
  size = 100,
  className
}: {
  items: Array<{
    label: string
    progress: number
    color?: ProgressRingProps['color']
  }>
  size?: number
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-8 justify-center", className)}>
      {items.map((item, index) => (
        <ProgressRing
          key={`${item.label}-${index}`}
          progress={item.progress}
          label={item.label}
          size={size}
          color={item.color}
        />
      ))}
    </div>
  )
})