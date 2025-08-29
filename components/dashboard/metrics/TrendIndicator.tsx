'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TrendIndicatorProps {
  value: number
  previousValue?: number
  format?: 'number' | 'percentage' | 'currency'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showValue?: boolean
  className?: string
}

/**
 * 트렌드 표시 컴포넌트
 * 증감 추세를 시각적으로 표현
 */
export const TrendIndicator = memo(function TrendIndicator({
  value,
  previousValue,
  format = 'number',
  size = 'md',
  showIcon = true,
  showValue = true,
  className
}: TrendIndicatorProps) {
  // 변화량 계산
  const change = previousValue !== undefined ? value - previousValue : 0
  const changePercent = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0
  
  const isPositive = change > 0
  const isNegative = change < 0
  const isNeutral = change === 0
  
  // 크기별 스타일
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  // 색상 결정
  const colorClass = isPositive 
    ? 'text-green-600' 
    : isNegative 
    ? 'text-red-600' 
    : 'text-gray-500'
  
  const bgClass = isPositive
    ? 'bg-green-100'
    : isNegative
    ? 'bg-red-100'
    : 'bg-gray-100'
  
  // 아이콘 결정
  const icon = isPositive ? '↑' : isNegative ? '↓' : '→'
  
  // 값 포맷팅
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${Math.abs(val).toFixed(1)}%`
      case 'currency':
        return `₩${Math.abs(val).toLocaleString('ko-KR')}`
      default:
        return Math.abs(val).toLocaleString('ko-KR')
    }
  }
  
  if (previousValue === undefined) {
    return null
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full",
        bgClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <span className={cn("font-bold", colorClass)}>
          {icon}
        </span>
      )}
      {showValue && (
        <span className={cn("font-medium", colorClass)}>
          {changePercent !== 0 ? `${Math.abs(changePercent).toFixed(1)}%` : '0%'}
        </span>
      )}
    </motion.div>
  )
})

/**
 * 상세 트렌드 카드
 * 더 많은 정보를 포함한 트렌드 표시
 */
export const TrendCard = memo(function TrendCard({
  title,
  currentValue,
  previousValue,
  format = 'number',
  period = '지난 기간 대비',
  className
}: {
  title: string
  currentValue: number
  previousValue: number
  format?: 'number' | 'percentage' | 'currency'
  period?: string
  className?: string
}) {
  const change = currentValue - previousValue
  const changePercent = previousValue !== 0 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : 0
  
  const isPositive = change > 0
  const isNegative = change < 0
  
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
  
  return (
    <div className={cn(
      "bg-white p-4 rounded-lg border border-gray-100",
      className
    )}>
      <h4 className="text-sm font-medium text-gray-600 mb-2">{title}</h4>
      
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-charcoal">
          {formatValue(currentValue)}
        </span>
        
        <TrendIndicator
          value={currentValue}
          previousValue={previousValue}
          format={format}
          size="md"
        />
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        {period}: {formatValue(previousValue)}
      </p>
      
      {change !== 0 && (
        <p className={cn(
          "text-xs mt-1",
          isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-500"
        )}>
          {isPositive ? '증가' : isNegative ? '감소' : '변화 없음'}: {formatValue(Math.abs(change))}
        </p>
      )}
    </div>
  )
})

/**
 * 스파크라인 트렌드
 * 작은 차트 형태의 트렌드 표시
 */
export const SparklineTrend = memo(function SparklineTrend({
  data,
  width = 100,
  height = 30,
  color = 'primary',
  className
}: {
  data: number[]
  width?: number
  height?: number
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  className?: string
}) {
  if (data.length < 2) return null
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height
  }))
  
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  
  const colorClasses = {
    primary: 'stroke-primary-mint-600',
    secondary: 'stroke-accent-sky-600',
    success: 'stroke-green-600',
    warning: 'stroke-yellow-600',
    danger: 'stroke-red-600'
  }
  
  const isIncreasing = data[data.length - 1] > data[0]
  
  return (
    <div className={cn("inline-block", className)}>
      <svg width={width} height={height}>
        <motion.path
          d={pathData}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={colorClasses[color]}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
    </div>
  )
})