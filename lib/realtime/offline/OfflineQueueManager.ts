import { SupabaseClient } from '@supabase/supabase-js'

export interface QueuedOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  entityId?: string
  data?: Record<string, any>
  timestamp: string
  retryCount: number
  maxRetries: number
  status: 'pending' | 'processing' | 'failed' | 'completed'
  error?: string
  localOnly?: boolean
}

export interface OfflineConfig {
  maxQueueSize?: number
  maxRetries?: number
  retryDelay?: number
  persistQueue?: boolean
  storageKey?: string
  onSync?: (operation: QueuedOperation) => void
  onError?: (operation: QueuedOperation, error: Error) => void
  onComplete?: (operation: QueuedOperation) => void
}

export class OfflineQueueManager {
  private queue: Map<string, QueuedOperation> = new Map()
  private supabase: SupabaseClient
  private config: Required<OfflineConfig>
  private isOnline: boolean = true
  private isSyncing: boolean = false
  private syncTimer: NodeJS.Timeout | null = null
  private listeners: Set<(queue: QueuedOperation[]) => void> = new Set()

  constructor(supabase: SupabaseClient, config: OfflineConfig = {}) {
    this.supabase = supabase
    this.config = {
      maxQueueSize: 1000,
      maxRetries: 3,
      retryDelay: 5000,
      persistQueue: true,
      storageKey: 'offline_queue',
      onSync: config.onSync || (() => {}),
      onError: config.onError || (() => {}),
      onComplete: config.onComplete || (() => {})
    }

    // Initialize online status
    this.setupOnlineListener()
    
    // Load persisted queue
    if (this.config.persistQueue) {
      this.loadQueue()
    }

    // Start sync process if online
    if (this.isOnline) {
      this.startSync()
    }
  }

  private setupOnlineListener(): void {
    if (typeof window === 'undefined') return

    this.isOnline = navigator.onLine

    window.addEventListener('online', () => {
      console.log('Connection restored, starting sync...')
      this.isOnline = true
      this.startSync()
    })

    window.addEventListener('offline', () => {
      console.log('Connection lost, queuing operations...')
      this.isOnline = false
      this.stopSync()
    })
  }

  private loadQueue(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.config.storageKey)
      if (stored) {
        const operations: QueuedOperation[] = JSON.parse(stored)
        operations.forEach(op => {
          if (op.status !== 'completed') {
            this.queue.set(op.id, op)
          }
        })
        console.log(`Loaded ${this.queue.size} queued operations from storage`)
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error)
    }
  }

  private saveQueue(): void {
    if (!this.config.persistQueue || typeof window === 'undefined') return

    try {
      const operations = Array.from(this.queue.values())
      localStorage.setItem(this.config.storageKey, JSON.stringify(operations))
    } catch (error) {
      console.error('Failed to save queue to storage:', error)
    }
  }

  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API
  async queueOperation(
    type: QueuedOperation['type'],
    table: string,
    data?: Record<string, any>,
    entityId?: string
  ): Promise<string> {
    // Check queue size limit
    if (this.queue.size >= this.config.maxQueueSize) {
      throw new Error('Offline queue is full')
    }

    const operation: QueuedOperation = {
      id: this.generateId(),
      type,
      table,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      status: 'pending',
      localOnly: !this.isOnline
    }

    this.queue.set(operation.id, operation)
    this.saveQueue()
    this.notifyListeners()

    // If online, try to sync immediately
    if (this.isOnline && !this.isSyncing) {
      this.processQueue()
    }

    return operation.id
  }

  private async processQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.queue.size === 0) return

    this.isSyncing = true

    const pendingOps = Array.from(this.queue.values())
      .filter(op => op.status === 'pending')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    for (const operation of pendingOps) {
      if (!this.isOnline) break

      try {
        await this.processOperation(operation)
      } catch (error) {
        console.error(`Failed to process operation ${operation.id}:`, error)
      }
    }

    this.isSyncing = false
    this.saveQueue()
    this.notifyListeners()
  }

  private async processOperation(operation: QueuedOperation): Promise<void> {
    operation.status = 'processing'
    this.notifyListeners()

    try {
      let result: any

      switch (operation.type) {
        case 'create':
          result = await this.supabase
            .from(operation.table)
            .insert(operation.data!)
          break

        case 'update':
          if (!operation.entityId) {
            throw new Error('Entity ID required for update operation')
          }
          result = await this.supabase
            .from(operation.table)
            .update(operation.data!)
            .eq('id', operation.entityId)
          break

        case 'delete':
          if (!operation.entityId) {
            throw new Error('Entity ID required for delete operation')
          }
          result = await this.supabase
            .from(operation.table)
            .delete()
            .eq('id', operation.entityId)
          break
      }

      if (result.error) {
        throw result.error
      }

      // Success
      operation.status = 'completed'
      this.config.onComplete(operation)
      this.queue.delete(operation.id)
      
    } catch (error) {
      operation.retryCount++
      
      if (operation.retryCount >= operation.maxRetries) {
        operation.status = 'failed'
        operation.error = (error as Error).message
        this.config.onError(operation, error as Error)
      } else {
        operation.status = 'pending'
        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, operation.retryCount - 1)
        setTimeout(() => {
          if (this.isOnline) {
            this.processQueue()
          }
        }, delay)
      }
    }
  }

  private startSync(): void {
    if (this.syncTimer) return

    // Initial sync
    this.processQueue()

    // Periodic sync
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.queue.size > 0) {
        this.processQueue()
      }
    }, this.config.retryDelay)
  }

  private stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  private notifyListeners(): void {
    const operations = Array.from(this.queue.values())
    this.listeners.forEach(listener => listener(operations))
  }

  // Public methods
  getQueue(): QueuedOperation[] {
    return Array.from(this.queue.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  getPendingCount(): number {
    return Array.from(this.queue.values())
      .filter(op => op.status === 'pending').length
  }

  getFailedCount(): number {
    return Array.from(this.queue.values())
      .filter(op => op.status === 'failed').length
  }

  clearCompleted(): void {
    Array.from(this.queue.values())
      .filter(op => op.status === 'completed')
      .forEach(op => this.queue.delete(op.id))
    
    this.saveQueue()
    this.notifyListeners()
  }

  clearFailed(): void {
    Array.from(this.queue.values())
      .filter(op => op.status === 'failed')
      .forEach(op => this.queue.delete(op.id))
    
    this.saveQueue()
    this.notifyListeners()
  }

  retryFailed(): void {
    Array.from(this.queue.values())
      .filter(op => op.status === 'failed')
      .forEach(op => {
        op.status = 'pending'
        op.retryCount = 0
        op.error = undefined
      })
    
    this.saveQueue()
    this.notifyListeners()
    
    if (this.isOnline) {
      this.processQueue()
    }
  }

  subscribe(listener: (queue: QueuedOperation[]) => void): () => void {
    this.listeners.add(listener)
    listener(this.getQueue())
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  isOperationQueued(table: string, entityId: string): boolean {
    return Array.from(this.queue.values()).some(
      op => op.table === table && op.entityId === entityId && op.status === 'pending'
    )
  }

  getOperationStatus(operationId: string): QueuedOperation | undefined {
    return this.queue.get(operationId)
  }

  async forceSync(): Promise<void> {
    if (this.isOnline && !this.isSyncing) {
      await this.processQueue()
    }
  }

  destroy(): void {
    this.stopSync()
    this.listeners.clear()
    if (this.config.persistQueue) {
      this.saveQueue()
    }
  }
}