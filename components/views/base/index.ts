/**
 * 뷰 시스템 기본 컴포넌트 exports
 */

export { ViewContainer } from './ViewContainer'
export { ViewSwitcher } from './ViewSwitcher'
export { ViewFilters } from './ViewFilters'

// Re-export types for convenience
export type {
  ViewType,
  ViewConfig,
  FilterState,
  SortState,
  GroupingState,
  SelectionState,
  PaginationState,
  BaseViewProps,
  TableViewProps,
  KanbanViewProps,
  CalendarViewProps,
  TimelineViewProps,
  GalleryViewProps,
  ListViewProps,
} from '@/lib/views/types'