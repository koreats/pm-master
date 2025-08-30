'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Users, Eye, Edit, MousePointer } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserPresence } from '@/lib/realtime/presence/PresenceManager'

interface PresenceIndicatorProps {
  presences: UserPresence[]
  currentEntityType?: 'goal' | 'project' | 'task'
  currentEntityId?: string
  className?: string
}

export function PresenceIndicator({
  presences,
  currentEntityType,
  currentEntityId,
  className
}: PresenceIndicatorProps) {
  const onlineUsers = presences.filter(p => p.status === 'online')
  const viewingUsers = currentEntityType && currentEntityId
    ? presences.filter(p => 
        p.currentEntity?.type === currentEntityType && 
        p.currentEntity?.id === currentEntityId
      )
    : []

  const editingUsers = viewingUsers.filter(p => p.selection)
  const cursorActiveUsers = viewingUsers.filter(p => p.cursor)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Total online users */}
      <Badge variant="secondary" className="gap-1">
        <Users className="h-3 w-3" />
        <span>{onlineUsers.length} online</span>
      </Badge>

      {/* Users viewing current entity */}
      {viewingUsers.length > 0 && (
        <Badge variant="outline" className="gap-1">
          <Eye className="h-3 w-3" />
          <span>{viewingUsers.length} viewing</span>
        </Badge>
      )}

      {/* Users editing */}
      {editingUsers.length > 0 && (
        <Badge variant="default" className="gap-1">
          <Edit className="h-3 w-3" />
          <span>{editingUsers.length} editing</span>
        </Badge>
      )}

      {/* Active cursors */}
      {cursorActiveUsers.length > 0 && (
        <Badge variant="outline" className="gap-1">
          <MousePointer className="h-3 w-3" />
          <span>{cursorActiveUsers.length} active</span>
        </Badge>
      )}
    </div>
  )
}

interface LiveIndicatorProps {
  count?: number
  className?: string
}

export function LiveIndicator({ count, className }: LiveIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        <div className="absolute inset-0 h-2 w-2 bg-red-500 rounded-full animate-ping" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        {count ? `${count} Live` : 'Live'}
      </span>
    </div>
  )
}