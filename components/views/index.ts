/**
 * 뷰 시스템 통합 Export
 * 모든 뷰 컴포넌트와 관련 유틸리티를 한 곳에서 관리
 */

// 뷰 매니저 (최상위 컴포넌트)
export { ViewManager } from './ViewManager'

// 개별 뷰 컴포넌트
export { default as TableView } from './table/TableView'
export { default as KanbanView } from './kanban/KanbanView'
export { default as CalendarView } from './calendar/CalendarView'
export { default as TimelineView } from './timeline/TimelineView'
export { default as GalleryView } from './gallery/GalleryView'
export { default as ListView } from './list/ListView'

// 뷰 스토어
export { useViewStore, useCurrentView, useViewConfig, useGlobalFilters, useViewHistory } from '@/lib/views/store/viewStore'

// 타입 정의
export type {
  ViewType,
  BaseViewProps,
  TableViewProps,
  KanbanViewProps,
  CalendarViewProps,
  TimelineViewProps,
  GalleryViewProps,
  ListViewProps,
  ViewConfig,
  FilterState,
  SortState,
  GroupingState,
  SelectionState,
  PaginationState,
  ViewTransitionConfig,
} from '@/lib/views/types'

// 유틸리티 함수
export { cn } from '@/lib/utils'