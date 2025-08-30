'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Users, 
  User, 
  Circle, 
  MoreVertical,
  MessageSquare,
  Phone,
  Video,
  Mail,
  MapPin,
  Clock,
  Eye,
  Edit,
  MousePointer
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { usePresence } from '@/lib/realtime/hooks/usePresence'
import type { UserPresence } from '@/lib/realtime/presence/PresenceManager'

interface ActiveUsersListProps {
  teamId: string
  currentUserId: string
  className?: string
  showDetails?: boolean
  maxDisplay?: number
  onUserClick?: (userId: string) => void
  onMessageClick?: (userId: string) => void
}

export function ActiveUsersList({
  teamId,
  currentUserId,
  className,
  showDetails = true,
  maxDisplay = 10,
  onUserClick,
  onMessageClick
}: ActiveUsersListProps) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  
  const {
    presences,
    localPresence,
    isConnected,
    getOnlineUsers,
    getUsersViewingEntity,
    getUserStatus
  } = usePresence(`team:${teamId}`, {
    userId: currentUserId,
    autoTrackCursor: false,
    autoTrackSelection: false
  })

  const onlineUsers = getOnlineUsers()
  const displayUsers = maxDisplay ? onlineUsers.slice(0, maxDisplay) : onlineUsers
  const hiddenCount = Math.max(0, onlineUsers.length - maxDisplay)

  const getStatusIcon = (status: UserPresence['status']) => {
    switch (status) {
      case 'online':
        return <Circle className="h-2 w-2 fill-green-500 text-green-500" />
      case 'away':
        return <Circle className="h-2 w-2 fill-yellow-500 text-yellow-500" />
      case 'busy':
        return <Circle className="h-2 w-2 fill-red-500 text-red-500" />
      default:
        return <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
    }
  }

  const getActivityIcon = (presence: UserPresence) => {
    if (presence.selection) {
      return <Edit className="h-3 w-3 text-muted-foreground" />
    }
    if (presence.cursor) {
      return <MousePointer className="h-3 w-3 text-muted-foreground" />
    }
    if (presence.currentEntity) {
      return <Eye className="h-3 w-3 text-muted-foreground" />
    }
    return null
  }

  const formatLastSeen = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  if (!showDetails) {
    // Compact avatar group view
    return (
      <TooltipProvider>
        <div className={cn('flex items-center', className)}>
          <div className="flex -space-x-2">
            {displayUsers.map((presence) => (
              <Tooltip key={presence.userId}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onUserClick?.(presence.userId)}
                    className="relative inline-block"
                  >
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={presence.user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {presence.user.name?.slice(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      {getStatusIcon(presence.status)}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-medium">{presence.user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {presence.status}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            {hiddenCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted">
                    <span className="text-xs font-medium">+{hiddenCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{hiddenCount} more users online</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {isConnected && (
            <Badge variant="outline" className="ml-3 text-xs">
              <Circle className="mr-1 h-2 w-2 fill-green-500 text-green-500" />
              {onlineUsers.length} online
            </Badge>
          )}
        </div>
      </TooltipProvider>
    )
  }

  // Detailed list view
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Users
          </span>
          <Badge variant="outline">
            {onlineUsers.length} online
          </Badge>
        </CardTitle>
        <CardDescription>
          Team members currently active
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-2">
            {onlineUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No other users online</p>
              </div>
            ) : (
              onlineUsers.map((presence) => (
                <div
                  key={presence.userId}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg transition-colors',
                    'hover:bg-accent cursor-pointer',
                    expandedUser === presence.userId && 'bg-accent'
                  )}
                  onClick={() => setExpandedUser(
                    expandedUser === presence.userId ? null : presence.userId
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={presence.user.avatar_url} />
                      <AvatarFallback>
                        {presence.user.name?.slice(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      {getStatusIcon(presence.status)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {presence.user.name || presence.user.email}
                          {presence.userId === currentUserId && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground capitalize">
                            {presence.status}
                          </span>
                          {presence.currentEntity && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Viewing {presence.currentEntity.type}
                            </span>
                          )}
                          {getActivityIcon(presence)}
                        </div>
                      </div>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-1" align="end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => onUserClick?.(presence.userId)}
                          >
                            <User className="mr-2 h-4 w-4" />
                            View Profile
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => onMessageClick?.(presence.userId)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {expandedUser === presence.userId && (
                      <div className="mt-3 space-y-2 text-sm">
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">
                              Active {formatLastSeen(presence.lastSeen)}
                            </span>
                          </div>
                          {presence.metadata?.location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="text-xs">
                                {presence.metadata.location}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              onMessageClick?.(presence.userId)
                            }}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled
                          >
                            <Video className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}