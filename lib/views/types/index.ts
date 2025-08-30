/**
 * 뷰 시스템 타입 정의
 * 6가지 뷰 시스템을 위한 공통 타입과 인터페이스
 */

import type { Task } from '@/lib/core/domain/entities/Task'
import type { Project } from '@/lib/core/domain/entities/Project'
import type { Goal } from '@/lib/core/domain/entities/Goal'

// Task types (inline definitions to avoid import issues)
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// 뷰 타입 정의
export type ViewType = 'table' | 'kanban' | 'calendar' | 'timeline' | 'gallery' | 'list'

// 데이터 타입
export type ViewDataType = Task | Project | Goal

// 필터 상태
export interface FilterState {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assignedTo?: string[]
  projectId?: string[]
  goalId?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  dateFrom?: string
  dateTo?: string
  search?: string
  searchQuery?: string
  progressMin?: number
  progressMax?: number
  type?: string[]
  customFilters?: Record<string, any>
  [key: string]: any  // Allow dynamic filter properties
}

// 정렬 상태
export interface SortState {
  field: string
  direction: 'asc' | 'desc'
  secondary?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

// 다중 정렬을 위한 타입
export type SortingState = SortState | SortState[]

// 그룹핑 상태
export interface GroupingState {
  field: string
  collapsed?: string[]
  order?: 'asc' | 'desc'
}

// 선택 상태
export interface SelectionState {
  selectedIds: Set<string>
  lastSelectedId?: string
  mode: 'single' | 'multiple'
}

// 페이지네이션 상태
export interface PaginationState {
  pageIndex: number
  pageSize: number
  totalItems?: number
  totalPages?: number
}

// 뷰 설정
export interface ViewConfig {
  type: ViewType
  filters: FilterState
  sorting: SortState
  grouping?: GroupingState
  selection?: SelectionState
  pagination?: PaginationState
  displaySettings?: {
    density?: 'compact' | 'normal' | 'comfortable'
    showSubtasks?: boolean
    showAttachments?: boolean
    showComments?: boolean
    showTimeTracking?: boolean
    showRowNumbers?: boolean
    enableColumnResize?: boolean
    showEmptyColumns?: boolean
    enableDragDrop?: boolean
    defaultCalendarView?: 'month' | 'week' | 'day'
    showWeekends?: boolean
    showWeekNumbers?: boolean
    timelineScale?: 'hours' | 'days' | 'weeks' | 'months'
    showDependencies?: boolean
    showMilestones?: boolean
    cardSize?: 'small' | 'medium' | 'large'
    galleryColumns?: number
    enableMasonry?: boolean
    indentSize?: number
    showHierarchy?: boolean
    defaultExpanded?: boolean
    frozenColumns?: number
    columnWidth?: 'compact' | 'medium' | 'wide'
    enableShortcuts?: boolean
    enableAnimations?: boolean
    autoSave?: boolean
    [key: string]: any
  }
}

// 뷰 컴포넌트 기본 Props
export interface BaseViewProps<T extends ViewDataType = Task> {
  data: T[]
  config: ViewConfig
  loading?: boolean
  error?: Error | null
  onItemClick?: (item: T) => void
  onItemUpdate?: (item: T) => Promise<void>
  onItemDelete?: (itemId: string) => Promise<void>
  onBulkAction?: (itemIds: string[], action: string) => Promise<void>
  onConfigChange?: (config: Partial<ViewConfig>) => void
  className?: string
}

// 뷰별 특화 Props
export interface TableViewProps extends BaseViewProps {
  columns?: TableColumn[]
  enableRowSelection?: boolean
  enableColumnResize?: boolean
  enableSorting?: boolean
}

export interface KanbanViewProps extends BaseViewProps {
  columns: KanbanColumn[]
  onCardMove?: (taskId: string, newStatus: TaskStatus, newPosition: number) => Promise<void>
  enableDragDrop?: boolean
}

export interface CalendarViewProps extends BaseViewProps {
  view: 'month' | 'week' | 'day'
  onViewChange?: (view: 'month' | 'week' | 'day') => void
  onDateChange?: (date: Date) => void
  onEventDrop?: (taskId: string, newDate: Date) => Promise<void>
}

export interface TimelineViewProps extends BaseViewProps {
  startDate: Date
  endDate: Date
  zoomLevel?: 'day' | 'week' | 'month' | 'quarter'
  showDependencies?: boolean
  onBarMove?: (itemId: string, newStartDate: Date, newEndDate: Date) => Promise<void>
}

export interface GalleryViewProps extends BaseViewProps {
  columns?: number
  aspectRatio?: number
  enableMasonry?: boolean
}

export interface ListViewProps extends BaseViewProps {
  expandedIds?: Set<string>
  onToggleExpand?: (itemId: string) => void
  showHierarchy?: boolean
  indentSize?: number
  onItemCreate?: () => void
  groupBy?: 'type' | 'status' | 'priority' | 'none'
  defaultExpanded?: boolean
  showProgress?: boolean
}

// 테이블 컬럼 정의
export interface TableColumn {
  id: string
  header: string
  accessor: string | ((row: any) => any)
  width?: number
  minWidth?: number
  maxWidth?: number
  sortable?: boolean
  filterable?: boolean
  editable?: boolean
  cell?: (value: any, row: any) => React.ReactNode
}

// 칸반 컬럼 정의
export interface KanbanColumn {
  id: string
  title: string
  status: TaskStatus
  color?: string
  limit?: number
  collapsed?: boolean
}

// 뷰 전환 애니메이션 설정
export interface ViewTransitionConfig {
  duration?: number
  easing?: string
  preserveState?: boolean
}

// 뷰 메타데이터
export interface ViewMetadata {
  type: ViewType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  supportedDataTypes: Array<'task' | 'project' | 'goal'>
  capabilities: {
    filtering: boolean
    sorting: boolean
    grouping: boolean
    searching: boolean
    bulkActions: boolean
    dragDrop?: boolean
    inlineEdit?: boolean
  }
}

// 뷰 레지스트리
export const VIEW_METADATA: Record<ViewType, ViewMetadata> = {
  table: {
    type: 'table',
    label: 'Table',
    icon: (() => null) as any, // Icon 컴포넌트로 교체 필요
    description: 'Traditional table view with sorting and filtering',
    supportedDataTypes: ['task', 'project', 'goal'],
    capabilities: {
      filtering: true,
      sorting: true,
      grouping: true,
      searching: true,
      bulkActions: true,
      inlineEdit: true,
    },
  },
  kanban: {
    type: 'kanban',
    label: 'Kanban',
    icon: (() => null) as any,
    description: 'Board view with drag and drop',
    supportedDataTypes: ['task'],
    capabilities: {
      filtering: true,
      sorting: false,
      grouping: true,
      searching: true,
      bulkActions: true,
      dragDrop: true,
    },
  },
  calendar: {
    type: 'calendar',
    label: 'Calendar',
    icon: (() => null) as any,
    description: 'Calendar view with month, week, and day views',
    supportedDataTypes: ['task', 'project'],
    capabilities: {
      filtering: true,
      sorting: false,
      grouping: false,
      searching: true,
      bulkActions: false,
      dragDrop: true,
    },
  },
  timeline: {
    type: 'timeline',
    label: 'Timeline',
    icon: (() => null) as any,
    description: 'Gantt chart view with dependencies',
    supportedDataTypes: ['task', 'project'],
    capabilities: {
      filtering: true,
      sorting: true,
      grouping: true,
      searching: true,
      bulkActions: false,
      dragDrop: true,
    },
  },
  gallery: {
    type: 'gallery',
    label: 'Gallery',
    icon: (() => null) as any,
    description: 'Card-based grid view',
    supportedDataTypes: ['task', 'project', 'goal'],
    capabilities: {
      filtering: true,
      sorting: true,
      grouping: false,
      searching: true,
      bulkActions: true,
    },
  },
  list: {
    type: 'list',
    label: 'List',
    icon: (() => null) as any,
    description: 'Hierarchical list view',
    supportedDataTypes: ['task', 'project', 'goal'],
    capabilities: {
      filtering: true,
      sorting: true,
      grouping: true,
      searching: true,
      bulkActions: true,
    },
  },
}

// Export type guards
export function isTask(item: ViewDataType): item is Task {
  return 'status' in item && 'priority' in item && 'projectId' in item
}

export function isProject(item: ViewDataType): item is Project {
  return 'goalId' in item && 'startDate' in item && !('projectId' in item)
}

export function isGoal(item: ViewDataType): item is Goal {
  return 'targetDate' in item && !('goalId' in item) && !('projectId' in item)
}