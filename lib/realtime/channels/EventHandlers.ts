import { RealtimeEvent } from '../types'
import { QueryClient } from '@tanstack/react-query'

export class EventHandlers {
  private queryClient: QueryClient
  private debounceTimers: Map<string, NodeJS.Timeout>

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
    this.debounceTimers = new Map()
  }

  /**
   * Handle team-level events
   */
  handleTeamEvent(event: RealtimeEvent, teamId: string) {
    switch (event.table) {
      case 'goals':
        this.invalidateWithDebounce(['goals', teamId], 300)
        this.invalidateWithDebounce(['dashboard', 'metrics', teamId], 500)
        break
        
      case 'projects':
        this.invalidateWithDebounce(['projects'], 300)
        this.invalidateWithDebounce(['dashboard', 'metrics', teamId], 500)
        
        if (event.record?.id) {
          this.invalidateWithDebounce(['dashboard', 'project-health', event.record.id], 300)
        }
        break
        
      case 'tasks':
        this.handleTaskEvent(event, teamId)
        break
        
      case 'activity_logs':
        this.invalidateWithDebounce(['activity', teamId], 100)
        break
        
      case 'comments':
        this.invalidateWithDebounce(['comments', event.record?.entity_id], 200)
        this.invalidateWithDebounce(['activity', teamId], 300)
        break
    }
  }

  /**
   * Handle project-level events
   */
  handleProjectEvent(event: RealtimeEvent, projectId: string) {
    switch (event.table) {
      case 'projects':
        if (event.record?.id === projectId) {
          this.invalidateWithDebounce(['projects', projectId], 100)
          this.invalidateWithDebounce(['dashboard', 'project-health', projectId], 300)
        }
        break
        
      case 'tasks':
        if (event.record?.project_id === projectId) {
          this.invalidateWithDebounce(['tasks', { project: projectId }], 300)
          this.invalidateWithDebounce(['projects', projectId], 500)
        }
        break
        
      case 'comments':
        if (event.record?.project_id === projectId) {
          this.invalidateWithDebounce(['comments', event.record.entity_id], 200)
          this.invalidateWithDebounce(['activity', projectId], 300)
        }
        break
    }
  }

  /**
   * Handle task-level events
   */
  handleTaskEvent(event: RealtimeEvent, entityId: string) {
    const taskId = event.record?.id || entityId
    
    switch (event.type) {
      case 'INSERT':
        this.invalidateWithDebounce(['tasks'], 300)
        if (event.record?.project_id) {
          this.invalidateWithDebounce(['projects', event.record.project_id], 500)
        }
        break
        
      case 'UPDATE':
        this.invalidateWithDebounce(['tasks', taskId], 100)
        this.invalidateWithDebounce(['tasks'], 300)
        
        // Handle status changes
        if (event.old_record?.status !== event.record?.status) {
          this.handleStatusChange(event)
        }
        
        // Handle assignment changes
        if (event.old_record?.assigned_to !== event.record?.assigned_to) {
          this.handleAssignmentChange(event)
        }
        break
        
      case 'DELETE':
        this.invalidateWithDebounce(['tasks'], 100)
        if (event.old_record?.project_id) {
          this.invalidateWithDebounce(['projects', event.old_record.project_id], 300)
        }
        break
    }
  }

  /**
   * Handle task status changes
   */
  private handleStatusChange(event: RealtimeEvent) {
    const taskId = event.record?.id
    const projectId = event.record?.project_id
    
    if (projectId) {
      // Invalidate project progress
      this.invalidateWithDebounce(['projects', projectId], 200)
      
      // Invalidate goal progress if task affects it
      if (event.record?.goal_id) {
        this.invalidateWithDebounce(['goals', event.record.goal_id], 300)
      }
    }
    
    // Invalidate dashboard metrics
    if (event.record?.team_id) {
      this.invalidateWithDebounce(['dashboard', 'metrics', event.record.team_id], 500)
    }
  }

  /**
   * Handle task assignment changes
   */
  private handleAssignmentChange(event: RealtimeEvent) {
    const oldAssignee = event.old_record?.assigned_to
    const newAssignee = event.record?.assigned_to
    
    if (oldAssignee) {
      this.invalidateWithDebounce(['dashboard', 'user-performance', oldAssignee], 300)
      this.invalidateWithDebounce(['tasks', { assigned: oldAssignee }], 300)
    }
    
    if (newAssignee) {
      this.invalidateWithDebounce(['dashboard', 'user-performance', newAssignee], 300)
      this.invalidateWithDebounce(['tasks', { assigned: newAssignee }], 300)
    }
  }

  /**
   * Handle presence events
   */
  handlePresenceEvent(payload: any, channelKey: string) {
    // Presence events are typically handled in the UI layer
    // This is just for logging or additional processing
    console.log(`Presence event on ${channelKey}:`, payload)
  }

  /**
   * Handle broadcast events
   */
  handleBroadcastEvent(payload: any, channelKey: string) {
    const { event, data } = payload
    
    switch (event) {
      case 'cursor-move':
        // Handle cursor movement
        this.handleCursorMove(data)
        break
        
      case 'selection-change':
        // Handle selection changes
        this.handleSelectionChange(data)
        break
        
      case 'typing':
        // Handle typing indicators
        this.handleTypingIndicator(data)
        break
        
      default:
        console.log(`Unknown broadcast event: ${event}`, data)
    }
  }

  /**
   * Handle cursor movement broadcasts
   */
  private handleCursorMove(data: any) {
    // This would typically update a store or state
    // that tracks other users' cursor positions
    console.log('Cursor move:', data)
  }

  /**
   * Handle selection change broadcasts
   */
  private handleSelectionChange(data: any) {
    // Update UI to show what other users have selected
    console.log('Selection change:', data)
  }

  /**
   * Handle typing indicator broadcasts
   */
  private handleTypingIndicator(data: any) {
    // Show typing indicators in the UI
    console.log('Typing indicator:', data)
  }

  /**
   * Invalidate queries with debouncing
   */
  private invalidateWithDebounce(queryKey: readonly unknown[], delay: number = 300) {
    const key = JSON.stringify(queryKey)
    
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key))
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.queryClient.invalidateQueries({ queryKey })
      this.debounceTimers.delete(key)
    }, delay)
    
    this.debounceTimers.set(key, timer)
  }

  /**
   * Clean up timers
   */
  cleanup() {
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
  }
}