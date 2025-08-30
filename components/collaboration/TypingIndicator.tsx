'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { usePresence } from '@/lib/realtime/hooks/usePresence'

interface TypingIndicatorProps {
  channelName: string
  userId: string
  className?: string
  showAvatars?: boolean
  maxDisplay?: number
}

export function TypingIndicator({
  channelName,
  userId,
  className,
  showAvatars = false,
  maxDisplay = 3
}: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  const {
    presences,
    updateMetadata
  } = usePresence(channelName, {
    userId,
    autoTrackCursor: false,
    autoTrackSelection: false
  })

  // Monitor typing users
  useEffect(() => {
    const typing = new Set<string>()
    
    presences.forEach(presence => {
      if (
        presence.userId !== userId &&
        presence.metadata?.isTyping &&
        presence.status === 'online'
      ) {
        typing.add(presence.userId)
      }
    })

    setTypingUsers(typing)
  }, [presences, userId])

  // Broadcast typing status
  const setTyping = useCallback((isTyping: boolean) => {
    updateMetadata({ isTyping })

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      setTypingTimeout(null)
    }

    // Auto-clear typing after 3 seconds
    if (isTyping) {
      const timeout = setTimeout(() => {
        updateMetadata({ isTyping: false })
      }, 3000)
      setTypingTimeout(timeout)
    }
  }, [updateMetadata, typingTimeout])

  // Get typing user names
  const getTypingUserNames = (): string[] => {
    const names: string[] = []
    
    presences.forEach(presence => {
      if (typingUsers.has(presence.userId)) {
        names.push(presence.user.name || presence.user.email || 'Someone')
      }
    })

    return names.slice(0, maxDisplay)
  }

  const typingUserNames = getTypingUserNames()
  const extraCount = Math.max(0, typingUsers.size - maxDisplay)

  if (typingUsers.size === 0) return null

  const formatTypingText = () => {
    if (typingUserNames.length === 0) return ''
    
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing`
    }
    
    if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing`
    }
    
    const displayNames = typingUserNames.slice(0, -1).join(', ')
    const lastPart = extraCount > 0 
      ? `and ${extraCount + 1} others are typing`
      : `and ${typingUserNames[typingUserNames.length - 1]} are typing`
    
    return `${displayNames} ${lastPart}`
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <div className="flex space-x-1">
        <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: '0ms' }} />
        <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: '150ms' }} />
        <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: '300ms' }} />
      </div>
      <span>{formatTypingText()}</span>
    </div>
  )
}

interface TypingInputProps {
  channelName: string
  userId: string
  onTyping?: (isTyping: boolean) => void
  children: React.ReactElement
}

export function TypingInput({
  channelName,
  userId,
  onTyping,
  children
}: TypingInputProps) {
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null)

  const { updateMetadata } = usePresence(channelName, {
    userId,
    autoTrackCursor: false,
    autoTrackSelection: false
  })

  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      updateMetadata({ isTyping: true })
      onTyping?.(true)
    }

    // Clear existing timer
    if (typingTimer) {
      clearTimeout(typingTimer)
    }

    // Set new timer to stop typing after 2 seconds of inactivity
    const timer = setTimeout(() => {
      setIsTyping(false)
      updateMetadata({ isTyping: false })
      onTyping?.(false)
    }, 2000)

    setTypingTimer(timer)
  }, [isTyping, typingTimer, updateMetadata, onTyping])

  const handleTypingStop = useCallback(() => {
    if (typingTimer) {
      clearTimeout(typingTimer)
      setTypingTimer(null)
    }
    
    if (isTyping) {
      setIsTyping(false)
      updateMetadata({ isTyping: false })
      onTyping?.(false)
    }
  }, [isTyping, typingTimer, updateMetadata, onTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer)
      }
      handleTypingStop()
    }
  }, [])

  // Clone the child element and add event handlers
  return React.cloneElement(children, {
    onKeyDown: (e: React.KeyboardEvent) => {
      // Call original handler if exists
      if (children.props.onKeyDown) {
        children.props.onKeyDown(e)
      }

      // Don't trigger typing for special keys
      if (e.key === 'Enter' || e.key === 'Escape') {
        handleTypingStop()
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        handleTypingStart()
      }
    },
    onBlur: (e: React.FocusEvent) => {
      // Call original handler if exists
      if (children.props.onBlur) {
        children.props.onBlur(e)
      }
      handleTypingStop()
    },
    onChange: (e: React.ChangeEvent) => {
      // Call original handler if exists
      if (children.props.onChange) {
        children.props.onChange(e)
      }
      
      // Check if input is empty
      const target = e.target as HTMLInputElement | HTMLTextAreaElement
      if (target.value === '') {
        handleTypingStop()
      } else {
        handleTypingStart()
      }
    }
  })
}