import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OfflineQueueManager, QueuedOperation } from '../offline/OfflineQueueManager'
import { LocalCacheManager } from '../offline/LocalCacheManager'

export interface UseOfflineSyncOptions {
  enabled?: boolean
  tables?: string[]
  maxQueueSize?: number
  maxRetries?: number
  retryDelay?: number
  cacheMaxAge?: number
  onSync?: (operation: QueuedOperation) => void
  onError?: (operation: QueuedOperation, error: Error) => void
  onStatusChange?: (isOnline: boolean) => void
}

export interface OfflineSyncState {
  isOnline: boolean
  isSyncing: boolean
  queuedOperations: QueuedOperation[]
  pendingCount: number
  failedCount: number
  cacheStats: {
    totalItems: number
    pendingItems: number
    conflictItems: number
  }
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    queuedOperations: [],
    pendingCount: 0,
    failedCount: 0,
    cacheStats: {
      totalItems: 0,
      pendingItems: 0,
      conflictItems: 0
    }
  })

  const supabase = useMemo(() => createClient(), [])
  const queueManagerRef = useRef<OfflineQueueManager | null>(null)
  const cacheManagerRef = useRef<LocalCacheManager | null>(null)
  const initPromiseRef = useRef<Promise<void> | null>(null)

  // Initialize managers
  useEffect(() => {
    if (!options.enabled) return

    const initManagers = async () => {
      // Initialize queue manager
      queueManagerRef.current = new OfflineQueueManager(supabase, {
        maxQueueSize: options.maxQueueSize || 1000,
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 5000,
        persistQueue: true,
        onSync: options.onSync,
        onError: options.onError,
        onComplete: (op) => {
          updateCacheStats()
        }
      })

      // Initialize cache manager
      cacheManagerRef.current = new LocalCacheManager({
        tables: options.tables || ['goals', 'projects', 'tasks'],
        maxAge: options.cacheMaxAge || 24 * 60 * 60 * 1000
      })

      await cacheManagerRef.current.initialize()

      // Subscribe to queue changes
      const unsubscribe = queueManagerRef.current.subscribe((operations) => {
        setState(prev => ({
          ...prev,
          queuedOperations: operations,
          pendingCount: operations.filter(op => op.status === 'pending').length,
          failedCount: operations.filter(op => op.status === 'failed').length
        }))
      })

      // Update cache stats
      await updateCacheStats()

      return () => {
        unsubscribe()
      }
    }

    initPromiseRef.current = initManagers()

    return () => {
      if (queueManagerRef.current) {
        queueManagerRef.current.destroy()
      }
      if (cacheManagerRef.current) {
        cacheManagerRef.current.destroy()
      }
    }
  }, [options.enabled, supabase])

  // Monitor online status
  useEffect(() => {
    if (!options.enabled || typeof window === 'undefined') return

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }))
      options.onStatusChange?.(true)
      if (queueManagerRef.current) {
        queueManagerRef.current.forceSync()
      }
    }

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }))
      options.onStatusChange?.(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [options.enabled, options.onStatusChange])

  const updateCacheStats = useCallback(async () => {
    if (!cacheManagerRef.current) return

    try {
      const stats = await cacheManagerRef.current.getStats()
      setState(prev => ({
        ...prev,
        cacheStats: {
          totalItems: stats.totalItems,
          pendingItems: stats.pendingItems,
          conflictItems: stats.conflictItems
        }
      }))
    } catch (error) {
      console.error('Failed to update cache stats:', error)
    }
  }, [])

  // Queue operations
  const queueCreate = useCallback(async (
    table: string,
    data: Record<string, any>
  ): Promise<string | null> => {
    await initPromiseRef.current
    if (!queueManagerRef.current) return null

    try {
      const operationId = await queueManagerRef.current.queueOperation('create', table, data)
      
      // Also cache locally
      if (cacheManagerRef.current && data.id) {
        await cacheManagerRef.current.set(table, data.id, data, 'pending')
        await updateCacheStats()
      }

      return operationId
    } catch (error) {
      console.error('Failed to queue create operation:', error)
      return null
    }
  }, [updateCacheStats])

  const queueUpdate = useCallback(async (
    table: string,
    id: string,
    data: Record<string, any>
  ): Promise<string | null> => {
    await initPromiseRef.current
    if (!queueManagerRef.current) return null

    try {
      const operationId = await queueManagerRef.current.queueOperation('update', table, data, id)
      
      // Update cache
      if (cacheManagerRef.current) {
        await cacheManagerRef.current.set(table, id, { ...data, id }, 'pending')
        await updateCacheStats()
      }

      return operationId
    } catch (error) {
      console.error('Failed to queue update operation:', error)
      return null
    }
  }, [updateCacheStats])

  const queueDelete = useCallback(async (
    table: string,
    id: string
  ): Promise<string | null> => {
    await initPromiseRef.current
    if (!queueManagerRef.current) return null

    try {
      const operationId = await queueManagerRef.current.queueOperation('delete', table, undefined, id)
      
      // Remove from cache
      if (cacheManagerRef.current) {
        await cacheManagerRef.current.delete(table, id)
        await updateCacheStats()
      }

      return operationId
    } catch (error) {
      console.error('Failed to queue delete operation:', error)
      return null
    }
  }, [updateCacheStats])

  // Cache operations
  const getCached = useCallback(async <T = any>(
    table: string,
    id: string
  ): Promise<T | null> => {
    await initPromiseRef.current
    if (!cacheManagerRef.current) return null

    try {
      return await cacheManagerRef.current.get<T>(table, id)
    } catch (error) {
      console.error('Failed to get cached item:', error)
      return null
    }
  }, [])

  const getAllCached = useCallback(async <T = any>(
    table: string
  ): Promise<T[]> => {
    await initPromiseRef.current
    if (!cacheManagerRef.current) return []

    try {
      return await cacheManagerRef.current.getAll<T>(table)
    } catch (error) {
      console.error('Failed to get all cached items:', error)
      return []
    }
  }, [])

  const setCached = useCallback(async (
    table: string,
    id: string,
    data: any
  ): Promise<void> => {
    await initPromiseRef.current
    if (!cacheManagerRef.current) return

    try {
      await cacheManagerRef.current.set(table, id, data, 'synced')
      await updateCacheStats()
    } catch (error) {
      console.error('Failed to set cached item:', error)
    }
  }, [updateCacheStats])

  // Sync operations
  const forceSync = useCallback(async (): Promise<void> => {
    await initPromiseRef.current
    if (!queueManagerRef.current) return

    setState(prev => ({ ...prev, isSyncing: true }))
    
    try {
      await queueManagerRef.current.forceSync()
      
      // Mark synced items in cache
      if (cacheManagerRef.current) {
        const pending = await cacheManagerRef.current.getPending()
        for (const item of pending) {
          if (!queueManagerRef.current.isOperationQueued(item.table, item.id)) {
            await cacheManagerRef.current.markAsSynced(item.table, item.id)
          }
        }
      }

      await updateCacheStats()
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }))
    }
  }, [updateCacheStats])

  const retryFailed = useCallback(async (): Promise<void> => {
    await initPromiseRef.current
    if (!queueManagerRef.current) return

    queueManagerRef.current.retryFailed()
  }, [])

  const clearFailed = useCallback(async (): Promise<void> => {
    await initPromiseRef.current
    if (!queueManagerRef.current) return

    queueManagerRef.current.clearFailed()
  }, [])

  const clearCache = useCallback(async (table?: string): Promise<void> => {
    await initPromiseRef.current
    if (!cacheManagerRef.current) return

    try {
      await cacheManagerRef.current.clear(table)
      await updateCacheStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }, [updateCacheStats])

  const clearExpiredCache = useCallback(async (): Promise<number> => {
    await initPromiseRef.current
    if (!cacheManagerRef.current) return 0

    try {
      const count = await cacheManagerRef.current.clearExpired()
      await updateCacheStats()
      return count
    } catch (error) {
      console.error('Failed to clear expired cache:', error)
      return 0
    }
  }, [updateCacheStats])

  return {
    // State
    ...state,
    
    // Queue operations
    queueCreate,
    queueUpdate,
    queueDelete,
    
    // Cache operations
    getCached,
    getAllCached,
    setCached,
    
    // Sync operations
    forceSync,
    retryFailed,
    clearFailed,
    
    // Cache management
    clearCache,
    clearExpiredCache
  }
}