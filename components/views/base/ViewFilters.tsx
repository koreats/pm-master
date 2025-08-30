'use client'

import React, { memo, useState } from 'react'
import { Search, Filter, X, Calendar, User, Tag, Flag } from 'lucide-react'
import type { FilterState, TaskStatus, TaskPriority } from '@/lib/views/types'
import { cn } from '@/lib/utils'

interface ViewFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  disabled?: boolean
  className?: string
}

/**
 * 뷰 필터 컴포넌트
 * 모든 뷰에서 공통으로 사용하는 필터링 UI
 */
export const ViewFilters = memo(function ViewFilters({
  filters,
  onFiltersChange,
  disabled = false,
  className,
}: ViewFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 검색어 변경 핸들러
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: value || undefined,
    })
  }

  // 상태 필터 변경
  const handleStatusChange = (status: TaskStatus) => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    })
  }

  // 우선순위 필터 변경
  const handlePriorityChange = (priority: TaskPriority) => {
    const currentPriorities = filters.priority || []
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter((p) => p !== priority)
      : [...currentPriorities, priority]

    onFiltersChange({
      ...filters,
      priority: newPriorities.length > 0 ? newPriorities : undefined,
    })
  }

  // 필터 초기화
  const handleClearFilters = () => {
    onFiltersChange({})
  }

  // 활성 필터 개수 계산
  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof FilterState] !== undefined
  ).length

  const statusOptions: Array<{ value: TaskStatus; label: string; color: string }> = [
    { value: 'todo', label: '할 일', color: 'bg-gray-500' },
    { value: 'in_progress', label: '진행 중', color: 'bg-blue-500' },
    { value: 'review', label: '검토 중', color: 'bg-yellow-500' },
    { value: 'done', label: '완료', color: 'bg-green-500' },
    { value: 'cancelled', label: '취소됨', color: 'bg-red-500' },
  ]

  const priorityOptions: Array<{ value: TaskPriority; label: string; color: string }> = [
    { value: 'low', label: '낮음', color: 'text-gray-500' },
    { value: 'medium', label: '보통', color: 'text-blue-500' },
    { value: 'high', label: '높음', color: 'text-orange-500' },
    { value: 'urgent', label: '긴급', color: 'text-red-500' },
  ]

  return (
    <div className={cn('space-y-3', className)}>
      {/* 메인 필터 바 */}
      <div className="flex items-center gap-3">
        {/* 검색 필드 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="검색..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'placeholder:text-gray-400',
              disabled && 'bg-gray-50 cursor-not-allowed'
            )}
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
          )}
        </div>

        {/* 필터 토글 버튼 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium',
            'border border-gray-200 rounded-lg',
            'hover:bg-gray-50 transition-colors',
            disabled && 'opacity-50 cursor-not-allowed',
            activeFilterCount > 0 && 'border-blue-500 text-blue-600 bg-blue-50'
          )}
        >
          <Filter className="h-4 w-4" />
          <span>필터</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* 필터 초기화 */}
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            disabled={disabled}
            className={cn(
              'text-sm text-gray-600 hover:text-gray-900',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 확장된 필터 옵션 */}
      {isExpanded && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => {
                const isSelected = filters.status?.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={disabled}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full',
                      'border transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full', option.color)} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 우선순위 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => {
                const isSelected = filters.priority?.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => handlePriorityChange(option.value)}
                    disabled={disabled}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full',
                      'border transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Flag className={cn('h-3 w-3', option.color)} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 날짜 범위 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={
                  filters.dateRange?.start
                    ? new Date(filters.dateRange.start).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  onFiltersChange({
                    ...filters,
                    dateRange: date
                      ? {
                          start: date,
                          end: filters.dateRange?.end || date,
                        }
                      : undefined,
                  })
                }}
                disabled={disabled}
                className={cn(
                  'px-3 py-1.5 text-sm border border-gray-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  disabled && 'bg-gray-50 cursor-not-allowed'
                )}
              />
              <span className="text-gray-500">~</span>
              <input
                type="date"
                value={
                  filters.dateRange?.end
                    ? new Date(filters.dateRange.end).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  onFiltersChange({
                    ...filters,
                    dateRange: date
                      ? {
                          start: filters.dateRange?.start || date,
                          end: date,
                        }
                      : undefined,
                  })
                }}
                disabled={disabled}
                className={cn(
                  'px-3 py-1.5 text-sm border border-gray-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  disabled && 'bg-gray-50 cursor-not-allowed'
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* 활성 필터 태그 */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.searchQuery && (
            <FilterTag
              label={`검색: ${filters.searchQuery}`}
              onRemove={() => handleSearchChange('')}
            />
          )}
          {filters.status?.map((status) => (
            <FilterTag
              key={status}
              label={`상태: ${statusOptions.find((o) => o.value === status)?.label}`}
              onRemove={() => handleStatusChange(status)}
            />
          ))}
          {filters.priority?.map((priority) => (
            <FilterTag
              key={priority}
              label={`우선순위: ${priorityOptions.find((o) => o.value === priority)?.label}`}
              onRemove={() => handlePriorityChange(priority)}
            />
          ))}
          {filters.dateRange && (
            <FilterTag
              label={`기간: ${new Date(filters.dateRange.start).toLocaleDateString()} ~ ${new Date(
                filters.dateRange.end
              ).toLocaleDateString()}`}
              onRemove={() =>
                onFiltersChange({
                  ...filters,
                  dateRange: undefined,
                })
              }
            />
          )}
        </div>
      )}
    </div>
  )
})

/**
 * 필터 태그 컴포넌트
 */
function FilterTag({ label, onRemove }: { label?: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

export default ViewFilters