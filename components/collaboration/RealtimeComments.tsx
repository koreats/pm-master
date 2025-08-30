'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MessageSquare, 
  Send, 
  MoreVertical, 
  Edit, 
  Trash, 
  Reply,
  Heart,
  ThumbsUp,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useRealtimeSubscription } from '@/lib/realtime/hooks/useRealtimeSubscription'
import { TypingIndicator, TypingInput } from './TypingIndicator'
import { PresenceAvatars } from './PresenceAvatars'
import { usePresence } from '@/lib/realtime/hooks/usePresence'
import { useActivityLog } from '@/lib/realtime/hooks/useNotifications'

interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  parent_id?: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    name: string
    avatar_url?: string
    email: string
  }
  reactions?: {
    [emoji: string]: string[] // emoji -> user_ids
  }
  attachments?: {
    id: string
    name: string
    url: string
    type: string
    size: number
  }[]
  replies?: Comment[]
  is_edited?: boolean
}

interface RealtimeCommentsProps {
  taskId: string
  teamId: string
  currentUserId: string
  className?: string
  showTyping?: boolean
  allowAttachments?: boolean
  allowReactions?: boolean
  maxHeight?: string
}

export function RealtimeComments({
  taskId,
  teamId,
  currentUserId,
  className,
  showTyping = true,
  allowAttachments = true,
  allowReactions = true,
  maxHeight = '500px'
}: RealtimeCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { logActivity } = useActivityLog()
  
  const channelName = `comments:${taskId}`
  const { presences } = usePresence(channelName, {
    userId: currentUserId,
    autoTrackCursor: false,
    autoTrackSelection: false
  })

  // Subscribe to realtime comment updates
  const { data: realtimeComments } = useRealtimeSubscription({
    channel: channelName,
    table: 'comments',
    filter: `task_id=eq.${taskId}`,
    event: '*'
  })

  // Load initial comments
  useEffect(() => {
    loadComments()
  }, [taskId])

  // Update comments when realtime data changes
  useEffect(() => {
    if (realtimeComments) {
      loadComments()
    }
  }, [realtimeComments])

  const loadComments = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users!user_id(id, name, avatar_url, email)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Group replies
      const rootComments = data?.filter(c => !c.parent_id) || []
      const repliesMap = new Map<string, Comment[]>()
      
      data?.filter(c => c.parent_id).forEach(reply => {
        if (!repliesMap.has(reply.parent_id!)) {
          repliesMap.set(reply.parent_id!, [])
        }
        repliesMap.get(reply.parent_id!)!.push(reply)
      })

      // Attach replies to root comments
      rootComments.forEach(comment => {
        comment.replies = repliesMap.get(comment.id) || []
      })

      setComments(rootComments)
    } catch (error) {
      console.error('Failed to load comments:', error)
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          user_id: currentUserId,
          content: newComment.trim(),
          parent_id: replyTo
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await logActivity(teamId, 'task', taskId, 'commented', {
        comment: newComment.trim().substring(0, 100)
      })

      setNewComment('')
      setReplyTo(null)
      
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (error) throw error

      setEditingId(null)
      setEditContent('')
      loadComments()
    } catch (error) {
      console.error('Failed to edit comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      
      loadComments()
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const handleReaction = async (commentId: string, emoji: string) => {
    // This would need a reactions table or JSONB field
    console.log('React to comment:', commentId, emoji)
  }

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const startReply = (commentId: string) => {
    setReplyTo(commentId)
    inputRef.current?.focus()
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={cn(
        'group flex gap-3',
        isReply && 'ml-10 mt-3'
      )}
    >
      <Avatar className={cn('flex-shrink-0', isReply ? 'h-8 w-8' : 'h-10 w-10')}>
        <AvatarImage src={comment.user?.avatar_url} />
        <AvatarFallback className="text-xs">
          {comment.user?.name?.slice(0, 2).toUpperCase() || 'UN'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.user?.name || comment.user?.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <Badge variant="outline" className="text-xs">
                edited
              </Badge>
            )}
          </div>

          {comment.user_id === currentUserId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => startEditing(comment)}>
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(comment.id)}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {editingId === comment.id ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleEdit(comment.id)}
                disabled={isSubmitting}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(null)
                  setEditContent('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm mt-1 whitespace-pre-wrap">
              {comment.content}
            </p>

            {allowReactions && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleReaction(comment.id, '👍')}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">0</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleReaction(comment.id, '❤️')}
                >
                  <Heart className="h-3 w-3 mr-1" />
                  <span className="text-xs">0</span>
                </Button>
                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => startReply(comment.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  )

  const viewingUsers = presences.filter(p => p.status === 'online')

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
            <Badge variant="secondary">{comments.length}</Badge>
          </CardTitle>
          {viewingUsers.length > 0 && (
            <PresenceAvatars
              presences={viewingUsers}
              maxDisplay={3}
              size="sm"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea
          ref={scrollRef}
          style={{ height: maxHeight }}
          className="px-6"
        >
          <div className="py-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No comments yet</p>
                <p className="text-xs mt-1">Be the first to comment</p>
              </div>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-4 space-y-3">
          {showTyping && (
            <TypingIndicator
              channelName={channelName}
              userId={currentUserId}
            />
          )}

          {replyTo && (
            <div className="flex items-center justify-between p-2 rounded bg-muted">
              <span className="text-sm">
                Replying to comment...
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            {showTyping ? (
              <TypingInput
                channelName={channelName}
                userId={currentUserId}
              >
                <Textarea
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                />
              </TypingInput>
            ) : (
              <Textarea
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
            )}
            <div className="flex flex-col gap-2">
              {allowAttachments && (
                <Button
                  variant="outline"
                  size="icon"
                  disabled
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}