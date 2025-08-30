// Provider
export { RealtimeProvider, useRealtime } from './RealtimeProvider'

// Hooks
export {
  useRealtimeSubscription,
  useTeamRealtime,
  useProjectRealtime,
  useTaskRealtime
} from './hooks/useRealtimeSubscription'

// Channel Management
export { ChannelManager } from './channels/ChannelManager'
export { EventHandlers } from './channels/EventHandlers'

// Types
export type {
  ChannelLevel,
  ChannelConfig,
  RealtimeEvent,
  PresenceState,
  ChannelSubscription,
  RealtimeContextValue,
  OptimisticUpdate,
  ConflictResolution
} from './types'