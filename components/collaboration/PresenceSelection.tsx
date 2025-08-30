'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { UserPresence } from '@/lib/realtime/presence/PresenceManager'

interface PresenceSelectionProps {
  presence: UserPresence
  containerRef?: React.RefObject<HTMLElement>
  className?: string
}

export function PresenceSelection({ 
  presence, 
  containerRef,
  className 
}: PresenceSelectionProps) {
  const selectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!presence.selection || !presence.selection.fieldId) return

    // Find the field element
    const fieldElement = document.getElementById(presence.selection.fieldId)
    if (!fieldElement) return

    // Calculate selection position
    const range = document.createRange()
    const textNode = fieldElement.firstChild

    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return

    try {
      range.setStart(textNode, Math.min(presence.selection.start, textNode.textContent?.length || 0))
      range.setEnd(textNode, Math.min(presence.selection.end, textNode.textContent?.length || 0))

      const rects = range.getClientRects()
      if (rects.length === 0) return

      // Update selection overlay position
      if (selectionRef.current) {
        const containerRect = containerRef?.current?.getBoundingClientRect()
        const firstRect = rects[0]
        
        const left = containerRect 
          ? firstRect.left - containerRect.left
          : firstRect.left

        const top = containerRect
          ? firstRect.top - containerRect.top
          : firstRect.top

        selectionRef.current.style.left = `${left}px`
        selectionRef.current.style.top = `${top}px`
        selectionRef.current.style.width = `${firstRect.width}px`
        selectionRef.current.style.height = `${firstRect.height}px`
      }
    } catch (error) {
      console.error('Failed to create selection range:', error)
    }
  }, [presence.selection, containerRef])

  if (!presence.selection) return null

  return (
    <div
      ref={selectionRef}
      className={cn(
        'pointer-events-none absolute z-10 rounded',
        className
      )}
      style={{
        backgroundColor: presence.color + '30',
        border: `2px solid ${presence.color}`,
        transition: 'all 0.2s ease'
      }}
    >
      <div
        className="absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: presence.color }}
      >
        {presence.user.name || presence.user.email}
      </div>
    </div>
  )
}

interface PresenceSelectionsProps {
  presences: UserPresence[]
  containerRef?: React.RefObject<HTMLElement>
  excludeUserId?: string
  className?: string
}

export function PresenceSelections({
  presences,
  containerRef,
  excludeUserId,
  className
}: PresenceSelectionsProps) {
  const filteredPresences = presences.filter(p =>
    p.userId !== excludeUserId && p.status === 'online' && p.selection
  )

  return (
    <>
      {filteredPresences.map(presence => (
        <PresenceSelection
          key={presence.userId}
          presence={presence}
          containerRef={containerRef}
          className={className}
        />
      ))}
    </>
  )
}