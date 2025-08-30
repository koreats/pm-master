/**
 * WebSocket 연결 풀 관리자
 * 실시간 연결을 효율적으로 관리하고 재사용
 */

import { RealtimeChannel, RealtimeClient } from '@supabase/supabase-js'

interface PooledConnection {
  id: string
  client: RealtimeClient
  channels: Map<string, RealtimeChannel>
  refCount: number
  lastUsed: number
  status: 'idle' | 'active' | 'closing'
}

interface ConnectionPoolConfig {
  maxConnections: number
  maxChannelsPerConnection: number
  idleTimeout: number
  heartbeatInterval: number
}

const DEFAULT_CONFIG: ConnectionPoolConfig = {
  maxConnections: 5,
  maxChannelsPerConnection: 10,
  idleTimeout: 60000, // 1 minute
  heartbeatInterval: 30000 // 30 seconds
}

export class ConnectionPool {
  private config: ConnectionPoolConfig
  private connections: Map<string, PooledConnection> = new Map()
  private channelToConnection: Map<string, string> = new Map()
  private idleTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startMaintenanceTasks()
  }

  /**
   * 채널 획득
   */
  async getChannel(
    channelName: string,
    client: RealtimeClient
  ): Promise<RealtimeChannel> {
    // 기존 채널 확인
    const existingConnectionId = this.channelToConnection.get(channelName)
    if (existingConnectionId) {
      const connection = this.connections.get(existingConnectionId)
      if (connection && connection.channels.has(channelName)) {
        connection.refCount++
        connection.lastUsed = Date.now()
        return connection.channels.get(channelName)!
      }
    }

    // 사용 가능한 연결 찾기
    const availableConnection = this.findAvailableConnection()
    
    if (availableConnection) {
      // 기존 연결에 채널 추가
      const channel = client.channel(channelName)
      availableConnection.channels.set(channelName, channel)
      availableConnection.refCount++
      availableConnection.lastUsed = Date.now()
      this.channelToConnection.set(channelName, availableConnection.id)
      return channel
    }

    // 새 연결 생성
    if (this.connections.size < this.config.maxConnections) {
      const newConnection = this.createConnection(client)
      const channel = client.channel(channelName)
      newConnection.channels.set(channelName, channel)
      newConnection.refCount++
      this.channelToConnection.set(channelName, newConnection.id)
      return channel
    }

    // 연결 한계 도달 - 가장 적게 사용된 연결 재사용
    const leastUsedConnection = this.findLeastUsedConnection()
    if (leastUsedConnection) {
      // 오래된 채널 제거
      const oldestChannel = this.findOldestChannel(leastUsedConnection)
      if (oldestChannel) {
        await this.removeChannel(oldestChannel, leastUsedConnection.id)
      }

      const channel = client.channel(channelName)
      leastUsedConnection.channels.set(channelName, channel)
      leastUsedConnection.refCount++
      leastUsedConnection.lastUsed = Date.now()
      this.channelToConnection.set(channelName, leastUsedConnection.id)
      return channel
    }

    throw new Error('Unable to create or reuse connection')
  }

  /**
   * 채널 반환
   */
  async releaseChannel(channelName: string) {
    const connectionId = this.channelToConnection.get(channelName)
    if (!connectionId) return

    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.refCount--
    connection.lastUsed = Date.now()

    // 참조 카운트가 0이면 유휴 상태로 전환
    if (connection.refCount <= 0) {
      connection.status = 'idle'
    }
  }

  /**
   * 채널 제거
   */
  private async removeChannel(channelName: string, connectionId: string) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const channel = connection.channels.get(channelName)
    if (channel) {
      await channel.unsubscribe()
      connection.channels.delete(channelName)
      this.channelToConnection.delete(channelName)
    }
  }

  /**
   * 연결 생성
   */
  private createConnection(client: RealtimeClient): PooledConnection {
    const connectionId = `conn_${Date.now()}_${Math.random()}`
    const connection: PooledConnection = {
      id: connectionId,
      client,
      channels: new Map(),
      refCount: 0,
      lastUsed: Date.now(),
      status: 'active'
    }

    this.connections.set(connectionId, connection)
    return connection
  }

  /**
   * 사용 가능한 연결 찾기
   */
  private findAvailableConnection(): PooledConnection | null {
    for (const connection of this.connections.values()) {
      if (
        connection.status === 'active' &&
        connection.channels.size < this.config.maxChannelsPerConnection
      ) {
        return connection
      }
    }
    return null
  }

  /**
   * 가장 적게 사용된 연결 찾기
   */
  private findLeastUsedConnection(): PooledConnection | null {
    let leastUsed: PooledConnection | null = null
    let minRefCount = Infinity

    for (const connection of this.connections.values()) {
      if (connection.status === 'active' && connection.refCount < minRefCount) {
        leastUsed = connection
        minRefCount = connection.refCount
      }
    }

    return leastUsed
  }

  /**
   * 가장 오래된 채널 찾기
   */
  private findOldestChannel(connection: PooledConnection): string | null {
    // 간단한 구현: 첫 번째 채널 반환
    const channels = Array.from(connection.channels.keys())
    return channels[0] || null
  }

  /**
   * 유지보수 작업 시작
   */
  private startMaintenanceTasks() {
    // 유휴 연결 정리
    this.idleTimer = setInterval(() => {
      this.cleanupIdleConnections()
    }, this.config.idleTimeout / 2)

    // 하트비트
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeats()
    }, this.config.heartbeatInterval)
  }

  /**
   * 유휴 연결 정리
   */
  private async cleanupIdleConnections() {
    const now = Date.now()
    const connectionsToRemove: string[] = []

    for (const [id, connection] of this.connections.entries()) {
      if (
        connection.status === 'idle' &&
        now - connection.lastUsed > this.config.idleTimeout
      ) {
        connectionsToRemove.push(id)
      }
    }

    for (const id of connectionsToRemove) {
      await this.closeConnection(id)
    }
  }

  /**
   * 연결 닫기
   */
  private async closeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.status = 'closing'

    // 모든 채널 정리
    for (const [channelName] of connection.channels) {
      await this.removeChannel(channelName, connectionId)
    }

    this.connections.delete(connectionId)
  }

  /**
   * 하트비트 전송
   */
  private sendHeartbeats() {
    for (const connection of this.connections.values()) {
      if (connection.status === 'active') {
        // Supabase 클라이언트는 자동으로 하트비트를 처리하므로
        // 여기서는 연결 상태만 확인
        connection.lastUsed = Date.now()
      }
    }
  }

  /**
   * 통계 정보
   */
  getStats() {
    const stats = {
      totalConnections: this.connections.size,
      activeConnections: 0,
      idleConnections: 0,
      totalChannels: 0,
      channelDistribution: new Map<string, number>()
    }

    for (const connection of this.connections.values()) {
      if (connection.status === 'active') {
        stats.activeConnections++
      } else if (connection.status === 'idle') {
        stats.idleConnections++
      }
      stats.totalChannels += connection.channels.size
      stats.channelDistribution.set(connection.id, connection.channels.size)
    }

    return stats
  }

  /**
   * 정리
   */
  async cleanup() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer)
      this.idleTimer = null
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    // 모든 연결 닫기
    const connectionIds = Array.from(this.connections.keys())
    for (const id of connectionIds) {
      await this.closeConnection(id)
    }

    this.connections.clear()
    this.channelToConnection.clear()
  }
}

// 싱글톤 인스턴스
let poolInstance: ConnectionPool | null = null

export function getConnectionPool(config?: Partial<ConnectionPoolConfig>): ConnectionPool {
  if (!poolInstance) {
    poolInstance = new ConnectionPool(config)
  }
  return poolInstance
}

export function resetConnectionPool() {
  if (poolInstance) {
    poolInstance.cleanup()
    poolInstance = null
  }
}