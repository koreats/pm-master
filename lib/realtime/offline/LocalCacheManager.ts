export interface CachedEntity {
  id: string
  table: string
  data: Record<string, any>
  timestamp: string
  version: number
  syncStatus: 'synced' | 'pending' | 'conflict'
  lastSyncedAt?: string
}

export interface CacheConfig {
  dbName?: string
  dbVersion?: number
  maxAge?: number // milliseconds
  tables?: string[]
  onConflict?: (local: CachedEntity, remote: any) => CachedEntity
}

export class LocalCacheManager {
  private db: IDBDatabase | null = null
  private config: Required<CacheConfig>
  private isInitialized: boolean = false

  constructor(config: CacheConfig = {}) {
    this.config = {
      dbName: 'pm_system_cache',
      dbVersion: 1,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      tables: ['goals', 'projects', 'tasks', 'comments'],
      onConflict: config.onConflict || ((local) => local)
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log('LocalCacheManager initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores for each table
        this.config.tables.forEach(table => {
          if (!db.objectStoreNames.contains(table)) {
            const store = db.createObjectStore(table, { keyPath: 'id' })
            store.createIndex('timestamp', 'timestamp', { unique: false })
            store.createIndex('syncStatus', 'syncStatus', { unique: false })
            store.createIndex('table', 'table', { unique: false })
          }
        })

        // Create metadata store
        if (!db.objectStoreNames.contains('_metadata')) {
          const metaStore = db.createObjectStore('_metadata', { keyPath: 'key' })
          metaStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new Error('LocalCacheManager not initialized. Call initialize() first.')
    }
  }

  // Cache operations
  async get<T = any>(table: string, id: string): Promise<T | null> {
    this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly')
      const store = transaction.objectStore(table)
      const request = store.get(id)

      request.onsuccess = () => {
        const cached = request.result as CachedEntity | undefined
        
        if (!cached) {
          resolve(null)
          return
        }

        // Check if cache is expired
        const age = Date.now() - new Date(cached.timestamp).getTime()
        if (age > this.config.maxAge) {
          // Remove expired cache
          this.delete(table, id)
          resolve(null)
          return
        }

        resolve(cached.data as T)
      }

      request.onerror = () => {
        reject(new Error(`Failed to get cached item: ${table}/${id}`))
      }
    })
  }

  async set(table: string, id: string, data: any, syncStatus: CachedEntity['syncStatus'] = 'synced'): Promise<void> {
    this.ensureInitialized()

    const cached: CachedEntity = {
      id,
      table,
      data,
      timestamp: new Date().toISOString(),
      version: data.version || 1,
      syncStatus,
      lastSyncedAt: syncStatus === 'synced' ? new Date().toISOString() : undefined
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)
      const request = store.put(cached)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        reject(new Error(`Failed to cache item: ${table}/${id}`))
      }
    })
  }

  async delete(table: string, id: string): Promise<void> {
    this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        reject(new Error(`Failed to delete cached item: ${table}/${id}`))
      }
    })
  }

  async getAll<T = any>(table: string): Promise<T[]> {
    this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly')
      const store = transaction.objectStore(table)
      const request = store.getAll()

      request.onsuccess = () => {
        const cached = request.result as CachedEntity[]
        const now = Date.now()
        
        // Filter out expired items
        const valid = cached.filter(item => {
          const age = now - new Date(item.timestamp).getTime()
          return age <= this.config.maxAge
        })

        resolve(valid.map(item => item.data as T))
      }

      request.onerror = () => {
        reject(new Error(`Failed to get all cached items from ${table}`))
      }
    })
  }

  async getPending(table?: string): Promise<CachedEntity[]> {
    this.ensureInitialized()

    const tables = table ? [table] : this.config.tables
    const pending: CachedEntity[] = []

    for (const t of tables) {
      const items = await new Promise<CachedEntity[]>((resolve, reject) => {
        const transaction = this.db!.transaction([t], 'readonly')
        const store = transaction.objectStore(t)
        const index = store.index('syncStatus')
        const request = index.getAll('pending')

        request.onsuccess = () => resolve(request.result as CachedEntity[])
        request.onerror = () => reject(new Error(`Failed to get pending items from ${t}`))
      })

      pending.push(...items)
    }

    return pending
  }

  async markAsSynced(table: string, id: string): Promise<void> {
    this.ensureInitialized()

    const cached = await this.getCachedEntity(table, id)
    if (!cached) return

    cached.syncStatus = 'synced'
    cached.lastSyncedAt = new Date().toISOString()

    return this.updateCachedEntity(table, cached)
  }

  async markAsPending(table: string, id: string): Promise<void> {
    this.ensureInitialized()

    const cached = await this.getCachedEntity(table, id)
    if (!cached) return

    cached.syncStatus = 'pending'

    return this.updateCachedEntity(table, cached)
  }

  async markAsConflict(table: string, id: string): Promise<void> {
    this.ensureInitialized()

    const cached = await this.getCachedEntity(table, id)
    if (!cached) return

    cached.syncStatus = 'conflict'

    return this.updateCachedEntity(table, cached)
  }

  private async getCachedEntity(table: string, id: string): Promise<CachedEntity | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly')
      const store = transaction.objectStore(table)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result as CachedEntity | undefined || null)
      request.onerror = () => reject(new Error(`Failed to get cached entity: ${table}/${id}`))
    })
  }

  private async updateCachedEntity(table: string, entity: CachedEntity): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)
      const request = store.put(entity)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`Failed to update cached entity: ${table}/${entity.id}`))
    })
  }

  // Batch operations
  async batchSet(table: string, items: Array<{ id: string; data: any }>): Promise<void> {
    this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)

      items.forEach(item => {
        const cached: CachedEntity = {
          id: item.id,
          table,
          data: item.data,
          timestamp: new Date().toISOString(),
          version: item.data.version || 1,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString()
        }
        store.put(cached)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(new Error(`Failed to batch set items in ${table}`))
    })
  }

  async batchDelete(table: string, ids: string[]): Promise<void> {
    this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)

      ids.forEach(id => store.delete(id))

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(new Error(`Failed to batch delete items from ${table}`))
    })
  }

  // Metadata operations
  async getMetadata(key: string): Promise<any> {
    this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['_metadata'], 'readonly')
      const store = transaction.objectStore('_metadata')
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : null)
      }

      request.onerror = () => reject(new Error(`Failed to get metadata: ${key}`))
    })
  }

  async setMetadata(key: string, value: any): Promise<void> {
    this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['_metadata'], 'readwrite')
      const store = transaction.objectStore('_metadata')
      const request = store.put({
        key,
        value,
        timestamp: new Date().toISOString()
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`Failed to set metadata: ${key}`))
    })
  }

  // Clear operations
  async clear(table?: string): Promise<void> {
    this.ensureInitialized()

    const tables = table ? [table] : this.config.tables

    for (const t of tables) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([t], 'readwrite')
        const store = transaction.objectStore(t)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Failed to clear table: ${t}`))
      })
    }
  }

  async clearExpired(): Promise<number> {
    this.ensureInitialized()

    let count = 0
    const now = Date.now()

    for (const table of this.config.tables) {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)
      const request = store.openCursor()

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          
          if (cursor) {
            const cached = cursor.value as CachedEntity
            const age = now - new Date(cached.timestamp).getTime()
            
            if (age > this.config.maxAge) {
              cursor.delete()
              count++
            }
            
            cursor.continue()
          } else {
            resolve()
          }
        }

        request.onerror = () => reject(new Error('Failed to clear expired items'))
      })
    }

    return count
  }

  // Statistics
  async getStats(): Promise<{
    totalItems: number
    pendingItems: number
    conflictItems: number
    oldestItem?: string
    newestItem?: string
  }> {
    this.ensureInitialized()

    let totalItems = 0
    let pendingItems = 0
    let conflictItems = 0
    let oldestTimestamp: string | undefined
    let newestTimestamp: string | undefined

    for (const table of this.config.tables) {
      const items = await this.getAllCachedEntities(table)
      
      totalItems += items.length
      pendingItems += items.filter(i => i.syncStatus === 'pending').length
      conflictItems += items.filter(i => i.syncStatus === 'conflict').length

      items.forEach(item => {
        if (!oldestTimestamp || item.timestamp < oldestTimestamp) {
          oldestTimestamp = item.timestamp
        }
        if (!newestTimestamp || item.timestamp > newestTimestamp) {
          newestTimestamp = item.timestamp
        }
      })
    }

    return {
      totalItems,
      pendingItems,
      conflictItems,
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp
    }
  }

  private async getAllCachedEntities(table: string): Promise<CachedEntity[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly')
      const store = transaction.objectStore(table)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result as CachedEntity[])
      request.onerror = () => reject(new Error(`Failed to get all entities from ${table}`))
    })
  }

  destroy(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
    }
  }
}