'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useTransform } from 'framer-motion'

interface AnimatedValueOptions {
  duration?: number
  stiffness?: number
  damping?: number
  mass?: number
  format?: (value: number) => string
}

/**
 * 숫자 애니메이션 Hook
 * Framer Motion을 활용한 부드러운 숫자 전환
 */
export function useAnimatedValue(
  targetValue: number,
  options: AnimatedValueOptions = {}
) {
  const {
    duration = 0.8,
    stiffness = 100,
    damping = 20,
    mass = 1,
    format = (v) => Math.round(v).toString()
  } = options
  
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    stiffness,
    damping,
    mass
  })
  
  // 포맷된 값 변환
  const displayValue = useTransform(springValue, format)
  
  // 이전 값 추적
  const previousValueRef = useRef(0)
  
  useEffect(() => {
    // 값이 변경되었을 때만 애니메이션
    if (targetValue !== previousValueRef.current) {
      motionValue.set(targetValue)
      previousValueRef.current = targetValue
    }
  }, [targetValue, motionValue])
  
  return {
    value: springValue,
    displayValue,
    isAnimating: springValue.get() !== targetValue
  }
}

/**
 * 퍼센트 애니메이션 Hook
 */
export function useAnimatedPercentage(
  percentage: number,
  options: Omit<AnimatedValueOptions, 'format'> = {}
) {
  return useAnimatedValue(percentage, {
    ...options,
    format: (v) => `${Math.round(v)}%`
  })
}

/**
 * 카운터 애니메이션 Hook
 * 큰 숫자를 위한 포맷팅 포함
 */
export function useAnimatedCounter(
  count: number,
  options: Omit<AnimatedValueOptions, 'format'> = {}
) {
  return useAnimatedValue(count, {
    ...options,
    format: (v) => {
      const rounded = Math.round(v)
      // 천 단위 구분자 추가
      return rounded.toLocaleString('ko-KR')
    }
  })
}

/**
 * 진행률 링 애니메이션 Hook
 * SVG 원형 진행률 표시용
 */
export function useProgressRing(
  progress: number,
  radius: number = 40
) {
  const circumference = 2 * Math.PI * radius
  const animatedProgress = useAnimatedValue(progress, {
    duration: 1,
    stiffness: 50,
    damping: 15
  })
  
  const strokeDashoffset = useTransform(
    animatedProgress.value,
    [0, 100],
    [circumference, 0]
  )
  
  return {
    circumference,
    strokeDashoffset,
    progress: animatedProgress.value,
    displayValue: animatedProgress.displayValue
  }
}

/**
 * 트렌드 인디케이터 애니메이션
 * 상승/하락 화살표 애니메이션
 */
export function useTrendAnimation(trend: number) {
  const isPositive = trend > 0
  const isNegative = trend < 0
  const isNeutral = trend === 0
  
  const animatedTrend = useAnimatedValue(Math.abs(trend), {
    format: (v) => {
      const sign = trend >= 0 ? '+' : '-'
      return `${sign}${Math.round(v)}%`
    }
  })
  
  return {
    ...animatedTrend,
    isPositive,
    isNegative,
    isNeutral,
    trendColor: isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500',
    trendBg: isPositive ? 'bg-green-100' : isNegative ? 'bg-red-100' : 'bg-gray-100',
    trendIcon: isPositive ? '↑' : isNegative ? '↓' : '→'
  }
}