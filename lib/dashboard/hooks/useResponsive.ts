'use client'

import { useEffect, useState } from 'react'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface ResponsiveConfig {
  mobile: number
  tablet: number
  desktop: number
  wide: number
}

const DEFAULT_BREAKPOINTS: ResponsiveConfig = {
  mobile: 640,   // sm
  tablet: 768,   // md
  desktop: 1024, // lg
  wide: 1280     // xl
}

/**
 * 반응형 레이아웃 Hook
 * 현재 화면 크기와 디바이스 타입 감지
 */
export function useResponsive(customBreakpoints?: Partial<ResponsiveConfig>) {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints }
  
  // Media queries
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.mobile - 1}px)`)
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px)`)
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`)
  const isWide = useMediaQuery(`(min-width: ${breakpoints.desktop}px)`)
  
  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  
  // Current device type
  const deviceType = isMobile ? 'mobile' : 
                    isTablet ? 'tablet' : 
                    isDesktop ? 'desktop' : 
                    isWide ? 'wide' : 'desktop'
  
  // Grid columns based on device
  const gridColumns = isMobile ? 1 : 
                     isTablet ? 2 : 
                     isDesktop ? 3 : 
                     isWide ? 4 : 4
  
  // Responsive values helper
  const responsive = <T,>(values: {
    mobile?: T
    tablet?: T
    desktop?: T
    wide?: T
    default: T
  }): T => {
    if (isMobile && values.mobile !== undefined) return values.mobile
    if (isTablet && values.tablet !== undefined) return values.tablet
    if (isDesktop && values.desktop !== undefined) return values.desktop
    if (isWide && values.wide !== undefined) return values.wide
    return values.default
  }
  
  return {
    // Device states
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isTouchDevice,
    
    // Current device
    deviceType,
    gridColumns,
    
    // Helpers
    responsive,
    
    // Breakpoints
    breakpoints
  }
}

/**
 * 반응형 그리드 Hook
 * 동적 그리드 레이아웃 관리
 */
export function useResponsiveGrid(itemCount: number) {
  const { gridColumns, deviceType } = useResponsive()
  
  // 그리드 행 수 계산
  const rows = Math.ceil(itemCount / gridColumns)
  
  // 아이템별 그리드 위치 계산
  const getGridPosition = (index: number) => {
    const row = Math.floor(index / gridColumns)
    const col = index % gridColumns
    return { row, col }
  }
  
  // 그리드 클래스명 생성
  const gridClassName = `grid gap-6 ${
    gridColumns === 1 ? 'grid-cols-1' :
    gridColumns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    gridColumns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }`
  
  return {
    gridColumns,
    rows,
    deviceType,
    getGridPosition,
    gridClassName
  }
}

/**
 * 반응형 차트 크기 Hook
 * 디바이스별 차트 크기 자동 조정
 */
export function useChartDimensions(aspectRatio: number = 16/9) {
  const { deviceType, responsive } = useResponsive()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('chart-container')
      if (container) {
        const width = container.clientWidth
        const height = width / aspectRatio
        setDimensions({ width, height })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [aspectRatio])
  
  // 디바이스별 차트 설정
  const chartConfig = {
    fontSize: responsive({
      mobile: 10,
      tablet: 11,
      desktop: 12,
      default: 12
    }),
    padding: responsive({
      mobile: { top: 10, right: 10, bottom: 30, left: 30 },
      tablet: { top: 15, right: 15, bottom: 40, left: 40 },
      desktop: { top: 20, right: 20, bottom: 50, left: 50 },
      default: { top: 20, right: 20, bottom: 50, left: 50 }
    }),
    showLegend: responsive({
      mobile: false,
      tablet: true,
      desktop: true,
      default: true
    })
  }
  
  return {
    ...dimensions,
    deviceType,
    chartConfig
  }
}

/**
 * 반응형 모달 Hook
 * 디바이스별 모달 스타일 관리
 */
export function useResponsiveModal() {
  const { isMobile, isTablet, responsive } = useResponsive()
  
  const modalStyle = {
    maxWidth: responsive({
      mobile: '100%',
      tablet: '90%',
      desktop: '600px',
      wide: '800px',
      default: '600px'
    }),
    maxHeight: responsive({
      mobile: '100%',
      tablet: '90vh',
      desktop: '85vh',
      default: '85vh'
    }),
    position: (isMobile || isTablet) ? 'fixed' : 'relative' as const,
    inset: (isMobile || isTablet) ? 0 : 'auto'
  }
  
  const overlayStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: isMobile ? 'none' : 'blur(4px)'
  }
  
  return {
    modalStyle,
    overlayStyle,
    isFullscreen: isMobile,
    showCloseButton: !isMobile
  }
}