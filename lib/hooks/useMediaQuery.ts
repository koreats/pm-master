'use client'

import { useEffect, useState } from 'react'

/**
 * Media Query Hook
 * CSS media query를 React에서 사용
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    // SSR 환경 체크
    if (typeof window === 'undefined') {
      return
    }
    
    const mediaQuery = window.matchMedia(query)
    
    // 초기값 설정
    setMatches(mediaQuery.matches)
    
    // 리스너 함수
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // 리스너 등록 (구버전 브라우저 호환성)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Deprecated but needed for older browsers
      mediaQuery.addListener(handleChange)
    }
    
    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        // Deprecated but needed for older browsers
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [query])
  
  return matches
}