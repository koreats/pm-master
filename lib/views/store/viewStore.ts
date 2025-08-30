/**
 * 뷰 상태 관리 스토어
 * Zustand를 사용한 전역 뷰 상태 관리
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { 
  ViewType, 
  ViewConfig, 
  FilterState, 
  SortState, 
  GroupingState,
  SelectionState,
  PaginationState,
  ViewTransitionConfig
} from '../types'

interface ViewState {
  // 현재 활성 뷰
  currentView: ViewType
  
  // 각 뷰별 설정 저장
  viewConfigs: Map<ViewType, ViewConfig>
  
  // 뷰 전환 설정
  transitionConfig: ViewTransitionConfig
  
  // 전역 필터 (모든 뷰에 적용)
  globalFilters: FilterState
  
  // 뷰 히스토리 (뒤로가기/앞으로가기)
  viewHistory: ViewType[]
  historyIndex: number
  
  // 로딩 상태
  isTransitioning: boolean
}

interface ViewActions {
  // 뷰 전환
  setCurrentView: (view: ViewType, preserveState?: boolean) => void
  
  // 뷰 설정 업데이트
  updateViewConfig: (view: ViewType, config: Partial<ViewConfig>) => void
  
  // 필터 업데이트
  updateFilters: (view: ViewType, filters: Partial<FilterState>) => void
  updateGlobalFilters: (filters: Partial<FilterState>) => void
  clearFilters: (view: ViewType) => void
  
  // 정렬 업데이트
  updateSorting: (view: ViewType, sorting: SortState) => void
  
  // 그룹핑 업데이트
  updateGrouping: (view: ViewType, grouping: GroupingState) => void
  
  // 선택 상태 업데이트
  updateSelection: (view: ViewType, selection: SelectionState) => void
  toggleSelection: (view: ViewType, itemId: string) => void
  clearSelection: (view: ViewType) => void
  
  // 페이지네이션 업데이트
  updatePagination: (view: ViewType, pagination: Partial<PaginationState>) => void
  
  // 뷰 전환 설정
  setTransitionConfig: (config: ViewTransitionConfig) => void
  
  // 히스토리 관리
  navigateBack: () => void
  navigateForward: () => void
  
  // 상태 초기화
  resetViewConfig: (view: ViewType) => void
  resetAllConfigs: () => void
}

type ViewStore = ViewState & ViewActions

// 기본 뷰 설정 생성
const createDefaultViewConfig = (type: ViewType): ViewConfig => ({
  type,
  filters: {},
  sorting: {
    field: 'createdAt',
    direction: 'desc',
  },
  grouping: undefined,
  selection: {
    selectedIds: new Set(),
    mode: 'multiple',
  },
  pagination: {
    pageIndex: 0,
    pageSize: 20,
  },
  displaySettings: {
    density: 'normal',
    showSubtasks: true,
    showAttachments: false,
    showComments: false,
    showTimeTracking: false,
  },
})

// 초기 뷰 설정 맵 생성
const createInitialViewConfigs = (): Map<ViewType, ViewConfig> => {
  const configs = new Map<ViewType, ViewConfig>()
  const viewTypes: ViewType[] = ['table', 'kanban', 'calendar', 'timeline', 'gallery', 'list']
  
  viewTypes.forEach(type => {
    configs.set(type, createDefaultViewConfig(type))
  })
  
  return configs
}

export const useViewStore = create<ViewStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        currentView: 'table',
        viewConfigs: createInitialViewConfigs(),
        transitionConfig: {
          duration: 300,
          easing: 'ease-in-out',
          preserveState: true,
        },
        globalFilters: {},
        viewHistory: ['table'],
        historyIndex: 0,
        isTransitioning: false,

        // 뷰 전환
        setCurrentView: (view, preserveState = true) => {
          set((state) => {
            const newHistory = [...state.viewHistory.slice(0, state.historyIndex + 1), view]
            
            return {
              currentView: view,
              viewHistory: newHistory,
              historyIndex: newHistory.length - 1,
              isTransitioning: true,
            }
          })
          
          // 전환 애니메이션 완료 후 상태 업데이트
          setTimeout(() => {
            set({ isTransitioning: false })
          }, get().transitionConfig.duration || 300)
        },

        // 뷰 설정 업데이트
        updateViewConfig: (view, config) => {
          set((state) => {
            const currentConfig = state.viewConfigs.get(view)
            if (!currentConfig) return state
            
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, {
              ...currentConfig,
              ...config,
            })
            
            return { viewConfigs: newConfigs }
          })
        },

        // 필터 업데이트
        updateFilters: (view, filters) => {
          set((state) => {
            const currentConfig = state.viewConfigs.get(view)
            if (!currentConfig) return state
            
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, {
              ...currentConfig,
              filters: {
                ...currentConfig.filters,
                ...filters,
              },
            })
            
            return { viewConfigs: newConfigs }
          })
        },

        updateGlobalFilters: (filters) => {
          set((state) => ({
            globalFilters: {
              ...state.globalFilters,
              ...filters,
            },
          }))
        },

        clearFilters: (view) => {
          set((state) => {
            const currentConfig = state.viewConfigs.get(view)
            if (!currentConfig) return state
            
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, {
              ...currentConfig,
              filters: {},
            })
            
            return { viewConfigs: newConfigs }
          })
        },

        // 정렬 업데이트
        updateSorting: (view, sorting) => {
          set((state) => {
            const currentConfig = state.viewConfigs.get(view)
            if (!currentConfig) return state
            
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, {
              ...currentConfig,
              sorting,
            })
            
            return { viewConfigs: newConfigs }
          })
        },

        // 그룹핑 업데이트
        updateGrouping: (view, grouping) => {
          set((state) => {
            const currentConfig = state.viewConfigs.get(view)
            if (!currentConfig) return state
            
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, {
              ...currentConfig,
              grouping,
            })
            
            return { viewConfigs: newConfigs }
          })
        },

        // 선택 상태 업데이트
        updateSelection: (view, selection) => {
          set((state) => {
            const currentConfig = state.viewConfigs.get(view)
            if (!currentConfig) return state
            
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, {
              ...currentConfig,
              selection,
            })
            
            return { viewConfigs: newConfigs }
          })
        },

        toggleSelection: (view, itemId) => {
          set((state) => {
            const currentConfig = state.viewConfigs.get(view)
            if (!currentConfig || !currentConfig.selection) return state
            
            const newSelectedIds = new Set(currentConfig.selection.selectedIds)
            if (newSelectedIds.has(itemId)) {
              newSelectedIds.delete(itemId)
            } else {
              if (currentConfig.selection.mode === 'single') {
                newSelectedIds.clear()
              }
              newSelectedIds.add(itemId)
            }
            
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, {
              ...currentConfig,
              selection: {
                ...currentConfig.selection,
                selectedIds: newSelectedIds,
                lastSelectedId: itemId,
              },
            })
            
            return { viewConfigs: newConfigs }
          })
        },

        clearSelection: (view) => {
          set((state) => {
            const currentConfig = state.viewConfigs.get(view)
            if (!currentConfig || !currentConfig.selection) return state
            
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, {
              ...currentConfig,
              selection: {
                ...currentConfig.selection,
                selectedIds: new Set(),
                lastSelectedId: undefined,
              },
            })
            
            return { viewConfigs: newConfigs }
          })
        },

        // 페이지네이션 업데이트
        updatePagination: (view, pagination) => {
          set((state) => {
            const currentConfig = state.viewConfigs.get(view)
            if (!currentConfig || !currentConfig.pagination) return state
            
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, {
              ...currentConfig,
              pagination: {
                ...currentConfig.pagination,
                ...pagination,
              },
            })
            
            return { viewConfigs: newConfigs }
          })
        },

        // 뷰 전환 설정
        setTransitionConfig: (config) => {
          set({ transitionConfig: config })
        },

        // 히스토리 관리
        navigateBack: () => {
          set((state) => {
            if (state.historyIndex > 0) {
              const newIndex = state.historyIndex - 1
              return {
                currentView: state.viewHistory[newIndex],
                historyIndex: newIndex,
              }
            }
            return state
          })
        },

        navigateForward: () => {
          set((state) => {
            if (state.historyIndex < state.viewHistory.length - 1) {
              const newIndex = state.historyIndex + 1
              return {
                currentView: state.viewHistory[newIndex],
                historyIndex: newIndex,
              }
            }
            return state
          })
        },

        // 상태 초기화
        resetViewConfig: (view) => {
          set((state) => {
            const newConfigs = new Map(state.viewConfigs)
            newConfigs.set(view, createDefaultViewConfig(view))
            return { viewConfigs: newConfigs }
          })
        },

        resetAllConfigs: () => {
          set({
            viewConfigs: createInitialViewConfigs(),
            globalFilters: {},
            currentView: 'table',
            viewHistory: ['table'],
            historyIndex: 0,
          })
        },
      }),
      {
        name: 'view-store',
        // Selection의 Set 객체는 직렬화할 수 없으므로 변환 필요
        partialize: (state) => ({
          currentView: state.currentView,
          transitionConfig: state.transitionConfig,
          globalFilters: state.globalFilters,
          viewHistory: state.viewHistory,
          historyIndex: state.historyIndex,
        }),
      }
    )
  )
)

// Selector hooks
export const useCurrentView = () => useViewStore((state) => state.currentView)
export const useViewConfig = (view: ViewType) => useViewStore((state) => state.viewConfigs.get(view))
export const useGlobalFilters = () => useViewStore((state) => state.globalFilters)
export const useViewHistory = () => useViewStore((state) => ({
  history: state.viewHistory,
  index: state.historyIndex,
  canGoBack: state.historyIndex > 0,
  canGoForward: state.historyIndex < state.viewHistory.length - 1,
}))