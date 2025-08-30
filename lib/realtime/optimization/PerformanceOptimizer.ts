/**
 * 실시간 협업 성능 최적화 유틸리티
 */

import { debounce, throttle } from '@/lib/utils'

interface OptimizationConfig {
  // 메시지 배치 처리
  batchMessages: boolean
  batchInterval: number
  maxBatchSize: number
  
  // 이벤트 스로틀링
  throttlePresence: boolean
  presenceThrottleMs: number
  throttleTyping: boolean
  typingThrottleMs: number
  
  // 데이터 압축
  enableCompression: boolean
  compressionThreshold: number
  
  // 캐싱
  enableCaching: boolean
  cacheMaxAge: number
  cacheMaxSize: number
  
  // 연결 관리
  reconnectBackoff: boolean
  maxReconnectAttempts: number
  reconnectDelayMs: number
}

const DEFAULT_CONFIG: OptimizationConfig = {
  batchMessages: true,
  batchInterval: 100,
  maxBatchSize: 50,
  
  throttlePresence: true,
  presenceThrottleMs: 1000,
  throttleTyping: true,
  typingThrottleMs: 500,
  
  enableCompression: true,
  compressionThreshold: 1024,
  
  enableCaching: true,
  cacheMaxAge: 300000, // 5 minutes
  cacheMaxSize: 100,
  
  reconnectBackoff: true,
  maxReconnectAttempts: 5,
  reconnectDelayMs: 1000
}

export class PerformanceOptimizer {
  private config: OptimizationConfig
  private messageQueue: any[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private throttledFunctions: Map<string, Function> = new Map()

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.setupThrottledFunctions()
  }

  private setupThrottledFunctions() {
    // 프레즌스 업데이트 스로틀링
    if (this.config.throttlePresence) {
      this.throttledFunctions.set('presence', throttle(
        (callback: Function) => callback(),
        this.config.presenceThrottleMs
      ))
    }

    // 타이핑 상태 스로틀링
    if (this.config.throttleTyping) {
      this.throttledFunctions.set('typing', throttle(
        (callback: Function) => callback(),
        this.config.typingThrottleMs
      ))
    }
  }

  /**
   * 메시지 배치 처리
   */
  async batchMessage(message: any, handler: (messages: any[]) => Promise<void>) {
    if (!this.config.batchMessages) {
      await handler([message])
      return
    }

    this.messageQueue.push(message)

    if (this.messageQueue.length >= this.config.maxBatchSize) {
      await this.flushBatch(handler)
      return
    }

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(async () => {
        await this.flushBatch(handler)
      }, this.config.batchInterval)
    }
  }

  private async flushBatch(handler: (messages: any[]) => Promise<void>) {
    if (this.messageQueue.length === 0) return

    const batch = [...this.messageQueue]
    this.messageQueue = []
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    await handler(batch)
  }

  /**
   * 함수 스로틀링
   */
  throttle(key: string, callback: Function) {
    const throttled = this.throttledFunctions.get(key)
    if (throttled) {
      return throttled(callback)
    }
    return callback()
  }

  /**
   * 데이터 압축
   */
  compress(data: any): any {
    if (!this.config.enableCompression) return data

    const jsonString = JSON.stringify(data)
    if (jsonString.length < this.config.compressionThreshold) {
      return data
    }

    // 간단한 압축 전략: 중복 제거 및 단축
    const compressed = {
      _c: true, // compressed flag
      d: this.compressObject(data)
    }

    return compressed
  }

  private compressObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.compressObject(item))
    }

    if (obj && typeof obj === 'object') {
      const compressed: any = {}
      for (const [key, value] of Object.entries(obj)) {
        // 키 단축
        const shortKey = this.getShortKey(key)
        compressed[shortKey] = this.compressObject(value)
      }
      return compressed
    }

    return obj
  }

  private keyMap: Map<string, string> = new Map([
    ['created_at', 'ca'],
    ['updated_at', 'ua'],
    ['deleted_at', 'da'],
    ['user_id', 'uid'],
    ['team_id', 'tid'],
    ['project_id', 'pid'],
    ['task_id', 'tkid'],
    ['status', 's'],
    ['priority', 'p'],
    ['description', 'desc'],
    ['metadata', 'meta']
  ])

  private getShortKey(key: string): string {
    return this.keyMap.get(key) || key
  }

  /**
   * 데이터 압축 해제
   */
  decompress(data: any): any {
    if (!data || typeof data !== 'object' || !data._c) {
      return data
    }

    return this.decompressObject(data.d)
  }

  private decompressObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.decompressObject(item))
    }

    if (obj && typeof obj === 'object') {
      const decompressed: any = {}
      const reverseKeyMap = new Map(
        Array.from(this.keyMap.entries()).map(([k, v]) => [v, k])
      )

      for (const [key, value] of Object.entries(obj)) {
        const fullKey = reverseKeyMap.get(key) || key
        decompressed[fullKey] = this.decompressObject(value)
      }
      return decompressed
    }

    return obj
  }

  /**
   * 캐싱
   */
  setCache(key: string, data: any) {
    if (!this.config.enableCaching) return

    // 캐시 크기 제한
    if (this.cache.size >= this.config.cacheMaxSize) {
      // 가장 오래된 항목 제거
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  getCached(key: string): any | null {
    if (!this.config.enableCaching) return null

    const cached = this.cache.get(key)
    if (!cached) return null

    // 만료 확인
    if (Date.now() - cached.timestamp > this.config.cacheMaxAge) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clearCache() {
    this.cache.clear()
  }

  /**
   * 재연결 백오프
   */
  getReconnectDelay(attemptNumber: number): number {
    if (!this.config.reconnectBackoff) {
      return this.config.reconnectDelayMs
    }

    // 지수 백오프
    const delay = Math.min(
      this.config.reconnectDelayMs * Math.pow(2, attemptNumber),
      30000 // 최대 30초
    )

    // 지터 추가
    const jitter = Math.random() * 1000
    return delay + jitter
  }

  /**
   * 메모리 사용량 모니터링
   */
  getMemoryUsage() {
    return {
      messageQueue: this.messageQueue.length,
      cacheSize: this.cache.size,
      throttledFunctions: this.throttledFunctions.size
    }
  }

  /**
   * 정리
   */
  cleanup() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    this.messageQueue = []
    this.cache.clear()
    this.throttledFunctions.clear()
  }
}

/**
 * 실시간 데이터 디바운싱 훅
 */
export function useRealtimeDebounce<T>(
  value: T,
  delay: number,
  callback: (value: T) => void
) {
  const debouncedCallback = React.useCallback(
    debounce(callback, delay),
    [callback, delay]
  )

  React.useEffect(() => {
    debouncedCallback(value)
  }, [value, debouncedCallback])
}

/**
 * 실시간 데이터 스로틀링 훅
 */
export function useRealtimeThrottle<T>(
  value: T,
  delay: number,
  callback: (value: T) => void
) {
  const throttledCallback = React.useCallback(
    throttle(callback, delay),
    [callback, delay]
  )

  React.useEffect(() => {
    throttledCallback(value)
  }, [value, throttledCallback])
}

// React import for hooks
import React from 'react'

export default PerformanceOptimizer