'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Users,
  MessageSquare,
  Activity,
  Bell,
  Wifi,
  WifiOff,
  Settings,
  Eye,
  Edit,
  Clock,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import collaboration components
import { ActiveUsersList } from './ActiveUsersList'
import { RealtimeComments } from './RealtimeComments'
import { ActivityFeed } from '../notifications/ActivityFeed'
import { NotificationBell } from '../notifications/NotificationBell'
import { OfflineIndicator } from '../offline/OfflineIndicator'
import { CollaborativeTaskEditor } from '../examples/CollaborativeTaskEditor'

// Hooks
import { usePresence } from '@/lib/realtime/hooks/usePresence'
import { useNotifications } from '@/lib/realtime/hooks/useNotifications'
import { useOfflineSync } from '@/lib/realtime/hooks/useOfflineSync'

interface CollaborationDashboardProps {
  teamId: string
  projectId?: string
  taskId?: string
  currentUserId: string
  className?: string
}

export function CollaborationDashboard({
  teamId,
  projectId,
  taskId,
  currentUserId,
  className
}: CollaborationDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Presence state
  const {
    presences,
    isConnected: presenceConnected,
    getOnlineUsers,
    getUsersViewingEntity
  } = usePresence(`team:${teamId}`, {
    userId: currentUserId,
    autoTrackCursor: false,
    autoTrackSelection: false
  })

  // Notifications state
  const {
    notifications,
    unreadCount,
    isConnected: notificationsConnected
  } = useNotifications(teamId, {
    enabled: true,
    enableSound: true
  })

  // Offline sync state
  const {
    isOnline,
    pendingCount,
    failedCount,
    cacheStats
  } = useOfflineSync({
    enabled: true,
    tables: ['goals', 'projects', 'tasks', 'comments']
  })

  const onlineUsers = getOnlineUsers()
  const viewingUsers = taskId ? getUsersViewingEntity('task', taskId) : []

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Collaboration Status</CardTitle>
            <div className="flex items-center gap-4">
              <NotificationBell teamId={teamId} />
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? (
                  <>
                    <Wifi className="mr-1 h-3 w-3" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="mr-1 h-3 w-3" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Active Users</p>
              <p className="text-2xl font-bold">{onlineUsers.length}</p>
              <p className="text-xs text-muted-foreground">Team members online</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Pending Sync</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Changes to sync</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Cached Items</p>
              <p className="text-2xl font-bold">{cacheStats.totalItems}</p>
              <p className="text-xs text-muted-foreground">Stored locally</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Collaboration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Active Users Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Team Members</CardTitle>
                <CardDescription>
                  Currently online and working
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActiveUsersList
                  teamId={teamId}
                  currentUserId={currentUserId}
                  showDetails={false}
                  maxDisplay={5}
                />
                {viewingUsers.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Viewing this task:</p>
                    <div className="flex flex-wrap gap-2">
                      {viewingUsers.map(user => (
                        <Badge key={user.userId} variant="secondary">
                          {user.user.name || user.user.email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>
                  Latest team actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map(notification => (
                    <div key={notification.id} className="flex items-start gap-2">
                      <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {notification.user?.name || 'Someone'}
                          </span>
                          {' '}
                          {notification.activity.action}
                          {' '}
                          {notification.entity?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collaboration Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Collaboration Metrics</CardTitle>
              <CardDescription>
                Team collaboration statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {notifications.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total Activities
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {onlineUsers.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active Users
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {pendingCount}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pending Changes
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {cacheStats.totalItems}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cached Items
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <ActiveUsersList
            teamId={teamId}
            currentUserId={currentUserId}
            showDetails={true}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityFeed
            teamId={teamId}
            maxHeight="600px"
          />
        </TabsContent>

        <TabsContent value="comments">
          {taskId ? (
            <RealtimeComments
              taskId={taskId}
              teamId={teamId}
              currentUserId={currentUserId}
              showTyping={true}
              allowReactions={true}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Select a task to view comments
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Offline Indicator */}
      <OfflineIndicator
        position="bottom"
        showDetails={true}
        autoHide={true}
      />
    </div>
  )
}