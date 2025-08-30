'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserPresence } from '@/lib/realtime/presence/PresenceManager'

interface PresenceCursorProps {
  presence: UserPresence
  containerRef?: React.RefObject<HTMLElement>
}

export function PresenceCursor({ presence, containerRef }: PresenceCursorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!presence.cursor) {
      setIsVisible(false)
      return
    }

    // Calculate position relative to container if provided
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPosition({
        x: presence.cursor.x - rect.left,
        y: presence.cursor.y - rect.top
      })
    } else {
      setPosition({
        x: presence.cursor.x,
        y: presence.cursor.y
      })
    }

    setIsVisible(true)

    // Hide cursor after 5 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [presence.cursor, containerRef])

  const getInitials = () => {
    if (presence.user.name) {
      return presence.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return presence.user.email.slice(0, 2).toUpperCase()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="pointer-events-none fixed z-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: position.x,
            y: position.y
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ 
            type: 'spring',
            damping: 30,
            stiffness: 300
          }}
          style={{
            left: 0,
            top: 0
          }}
        >
          {/* Cursor pointer */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.2))`,
              transform: 'rotate(-45deg) translate(-4px, -4px)'
            }}
          >
            <path
              d="M5.5 3.5L20.5 12L12 12L12 20.5L5.5 3.5Z"
              fill={presence.color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          
          {/* User label */}
          <div
            className="absolute top-4 left-4 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap"
            style={{ 
              backgroundColor: presence.color,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {presence.user.name || getInitials()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface PresenceCursorsProps {
  presences: UserPresence[]
  containerRef?: React.RefObject<HTMLElement>
  excludeUserId?: string
}

export function PresenceCursors({ 
  presences, 
  containerRef,
  excludeUserId 
}: PresenceCursorsProps) {
  const filteredPresences = presences.filter(p => 
    p.userId !== excludeUserId && p.status === 'online' && p.cursor
  )

  return (
    <>
      {filteredPresences.map(presence => (
        <PresenceCursor
          key={presence.userId}
          presence={presence}
          containerRef={containerRef}
        />
      ))}
    </>
  )
}