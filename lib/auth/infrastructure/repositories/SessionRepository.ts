import { Session, SessionProps } from '../../domain/entities/Session'
import { createServiceRoleClient } from '@/lib/supabase/server'
import * as crypto from 'crypto'

export interface ISessionRepository {
  findById(id: string): Promise<Session | null>
  findByToken(token: string): Promise<Session | null>
  findActiveByUserId(userId: string): Promise<Session[]>
  save(session: Session): Promise<void>
  update(session: Session): Promise<void>
  revoke(sessionId: string): Promise<void>
  revokeAllForUser(userId: string): Promise<void>
  deleteExpired(): Promise<number>
}

export class SessionRepository implements ISessionRepository {
  async findById(id: string): Promise<Session | null> {
    const supabase = await createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToDomainSession(data)
  }

  async findByToken(token: string): Promise<Session | null> {
    const supabase = await createServiceRoleClient()
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('token_hash', tokenHash)
      .single()

    if (error || !data) {
      return null
    }

    // Reconstruct the session with the original token
    const session = this.mapToDomainSession(data)
    if (session) {
      // We need to store the actual token in the session object
      // Since we only store the hash in the database
      return new Session({
        ...session.toJSON(),
        token: token,
        tokenHash: tokenHash,
      } as any)
    }

    return null
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const supabase = await createServiceRoleClient()
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(this.mapToDomainSession).filter(Boolean) as Session[]
  }

  async save(session: Session): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        id: session.getId(),
        user_id: session.getUserId(),
        token_hash: session.getTokenHash(),
        device_fingerprint: session.getDeviceFingerprint() || null,
        ip_address: session.getIpAddress() || null,
        user_agent: session.getUserAgent() || null,
        last_activity: session.getLastActivity().toISOString(),
        expires_at: session.getExpiresAt().toISOString(),
        created_at: session.getCreatedAt().toISOString(),
        is_revoked: false,
      })

    if (error) {
      throw new Error(`Failed to save session: ${error.message}`)
    }
  }

  async update(session: Session): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    const { error } = await supabase
      .from('user_sessions')
      .update({
        last_activity: session.getLastActivity().toISOString(),
        expires_at: session.getExpiresAt().toISOString(),
        is_revoked: !session.isValid(),
      })
      .eq('id', session.getId())

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`)
    }
  }

  async revoke(sessionId: string): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_revoked: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      throw new Error(`Failed to revoke session: ${error.message}`)
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const supabase = await createServiceRoleClient()
    
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_revoked: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_revoked', false)

    if (error) {
      throw new Error(`Failed to revoke user sessions: ${error.message}`)
    }
  }

  async deleteExpired(): Promise<number> {
    const supabase = await createServiceRoleClient()
    const now = new Date()
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
    
    // Delete sessions that are either:
    // 1. Expired (expires_at < now)
    // 2. Idle for more than 30 minutes
    // 3. Revoked
    const { data, error } = await supabase
      .from('user_sessions')
      .delete()
      .or(`expires_at.lt.${now.toISOString()},last_activity.lt.${thirtyMinutesAgo.toISOString()},is_revoked.eq.true`)
      .select('id')

    if (error) {
      throw new Error(`Failed to delete expired sessions: ${error.message}`)
    }

    return data?.length || 0
  }

  private mapToDomainSession(data: any): Session | null {
    if (!data) {
      return null
    }

    const props: SessionProps = {
      id: data.id,
      userId: data.user_id,
      token: '', // Token is not stored in DB, only the hash
      deviceFingerprint: data.device_fingerprint,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      lastActivity: new Date(data.last_activity),
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      isRevoked: data.is_revoked || false,
    }

    return new Session(props)
  }
}