'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserPresence } from '@/lib/realtime/presence/PresenceManager'

interface PresenceAvatarsProps {
  presences: UserPresence[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  className?: string
}

export function PresenceAvatars({
  presences,
  maxDisplay = 5,
  size = 'md',
  showStatus = true,
  className
}: PresenceAvatarsProps) {
  const onlinePresences = presences.filter(p => p.status === 'online')
  const displayPresences = onlinePresences.slice(0, maxDisplay)
  const remainingCount = Math.max(0, onlinePresences.length - maxDisplay)

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  }

  const getInitials = (user: UserPresence['user']) => {
    if (user.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return user.email.slice(0, 2).toUpperCase()
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center -space-x-2', className)}>
        {displayPresences.map((presence) => (
          <Tooltip key={presence.userId}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar
                  className={cn(
                    sizeClasses[size],
                    'border-2 border-background ring-2 ring-background cursor-pointer hover:z-10 transition-transform hover:scale-110'
                  )}
                  style={{
                    borderColor: presence.color
                  }}
                >
                  <AvatarImage src={presence.user.avatarUrl} alt={presence.user.name} />
                  <AvatarFallback
                    style={{ backgroundColor: presence.color + '20', color: presence.color }}
                  >
                    {getInitials(presence.user)}
                  </AvatarFallback>
                </Avatar>
                {showStatus && (
                  <div
                    className={cn(
                      'absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background',
                      statusColors[presence.status]
                    )}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">{presence.user.name || presence.user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{presence.status}</p>
                {presence.currentEntity && (
                  <p className="text-xs text-muted-foreground">
                    Viewing: {presence.currentEntity.name || presence.currentEntity.id}
                  </p>
                )}
                {presence.device && (
                  <p className="text-xs text-muted-foreground">
                    {presence.device.browser} • {presence.device.type}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar
                className={cn(
                  sizeClasses[size],
                  'border-2 border-background cursor-pointer hover:z-10 transition-transform hover:scale-110'
                )}
              >
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more users online</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}