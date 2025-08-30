'use client'

import React, { useCallback } from 'react'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Calendar,
  User,
  Flag,
  Hash,
  Type,
  Clock,
  TrendingUp,
  FileText,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { SortState, SortingState } from '@/lib/views/types'

interface SortOption {
  field: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface SortPanelProps {
  /**
   * 현재 정렬 상태
   */
  sorting: SortingState
  /**
   * 정렬 변경 핸들러
   */
  onSortingChange: (sorting: SortingState) => void
  /**
   * 사용 가능한 정렬 옵션
   */
  sortOptions?: SortOption[]
  /**
   * 다중 정렬 지원
   */
  enableMultiSort?: boolean
  /**
   * 컴팩트 모드
   */
  compact?: boolean
  /**
   * 드롭다운 모드
   */
  dropdown?: boolean
  className?: string
}

/**
 * 정렬 패널 컴포넌트
 * 데이터 정렬 옵션을 제공하는 UI 컴포넌트
 */
export function SortPanel({
  sorting,
  onSortingChange,
  sortOptions,
  enableMultiSort = false,
  compact = false,
  dropdown = false,
  className,
}: SortPanelProps) {
  // 기본 정렬 옵션
  const defaultSortOptions: SortOption[] = sortOptions || [
    {
      field: 'title',
      label: '제목',
      icon: <Type className="h-4 w-4" />,
      description: '제목 기준 정렬',
    },
    {
      field: 'status',
      label: '상태',
      icon: <Clock className="h-4 w-4" />,
      description: '작업 상태 기준 정렬',
    },
    {
      field: 'priority',
      label: '우선순위',
      icon: <Flag className="h-4 w-4" />,
      description: '우선순위 기준 정렬',
    },
    {
      field: 'assignedTo',
      label: '담당자',
      icon: <User className="h-4 w-4" />,
      description: '담당자 이름 기준 정렬',
    },
    {
      field: 'dueDate',
      label: '마감일',
      icon: <Calendar className="h-4 w-4" />,
      description: '마감일 기준 정렬',
    },
    {
      field: 'progress',
      label: '진행률',
      icon: <TrendingUp className="h-4 w-4" />,
      description: '진행률 기준 정렬',
    },
    {
      field: 'createdAt',
      label: '생성일',
      icon: <Clock className="h-4 w-4" />,
      description: '생성일 기준 정렬',
    },
    {
      field: 'updatedAt',
      label: '수정일',
      icon: <Clock className="h-4 w-4" />,
      description: '최근 수정일 기준 정렬',
    },
  ]

  // 정렬 필드 변경
  const handleFieldChange = useCallback((field: string) => {
    if (enableMultiSort && Array.isArray(sorting)) {
      // 다중 정렬 모드
      const existingSort = sorting.find(s => s.field === field)
      if (existingSort) {
        // 이미 있는 필드면 방향 토글
        onSortingChange(
          sorting.map(s =>
            s.field === field
              ? { ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }
              : s
          )
        )
      } else {
        // 새 필드 추가
        onSortingChange([...sorting, { field, direction: 'asc' }])
      }
    } else {
      // 단일 정렬 모드
      const currentSort = Array.isArray(sorting) ? sorting[0] : sorting
      if (currentSort?.field === field) {
        // 같은 필드면 방향 토글
        onSortingChange({
          field,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
        })
      } else {
        // 다른 필드면 새로 설정
        onSortingChange({ field, direction: 'asc' })
      }
    }
  }, [sorting, onSortingChange, enableMultiSort])

  // 정렬 방향 변경
  const handleDirectionChange = useCallback((direction: 'asc' | 'desc') => {
    if (Array.isArray(sorting)) {
      onSortingChange(
        sorting.map((s, index) =>
          index === 0 ? { ...s, direction } : s
        )
      )
    } else if (sorting) {
      onSortingChange({ ...sorting, direction })
    }
  }, [sorting, onSortingChange])

  // 정렬 제거
  const handleRemoveSort = useCallback((field: string) => {
    if (Array.isArray(sorting)) {
      const newSorting = sorting.filter(s => s.field !== field)
      onSortingChange(newSorting.length > 0 ? newSorting : { field: 'createdAt', direction: 'desc' })
    }
  }, [sorting, onSortingChange])

  // 정렬 초기화
  const handleResetSort = useCallback(() => {
    onSortingChange({ field: 'createdAt', direction: 'desc' })
  }, [onSortingChange])

  // 현재 정렬 정보 가져오기
  const currentSort = Array.isArray(sorting) ? sorting[0] : sorting
  const currentOption = defaultSortOptions.find(opt => opt.field === currentSort?.field)

  // 드롭다운 모드
  if (dropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={compact ? 'sm' : 'default'} className={className}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {currentOption?.label || '정렬'}
            {currentSort?.direction === 'desc' && (
              <ArrowDown className="h-3 w-3 ml-1" />
            )}
            {currentSort?.direction === 'asc' && (
              <ArrowUp className="h-3 w-3 ml-1" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {defaultSortOptions.map((option) => (
            <DropdownMenuItem
              key={option.field}
              onClick={() => handleFieldChange(option.field)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
                {currentSort?.field === option.field && (
                  <div className="flex items-center gap-1">
                    {currentSort.direction === 'asc' ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResetSort}>
            초기화
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // 일반 패널 모드
  return (
    <div className={cn('space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">정렬</h3>
          {enableMultiSort && Array.isArray(sorting) && sorting.length > 1 && (
            <Badge variant="secondary">{sorting.length}개</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetSort}
          className="h-7 text-xs"
        >
          초기화
        </Button>
      </div>

      {/* 정렬 필드 선택 */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium mb-2">정렬 기준</Label>
          {compact ? (
            <Select
              value={currentSort?.field}
              onValueChange={handleFieldChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="정렬 기준 선택" />
              </SelectTrigger>
              <SelectContent>
                {defaultSortOptions.map((option) => (
                  <SelectItem key={option.field} value={option.field}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <RadioGroup
              value={currentSort?.field}
              onValueChange={handleFieldChange}
              className="space-y-2"
            >
              {defaultSortOptions.map((option) => (
                <div key={option.field} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.field} id={option.field} />
                  <Label
                    htmlFor={option.field}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    {option.icon}
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        {/* 정렬 방향 */}
        <div>
          <Label className="text-sm font-medium mb-2">정렬 방향</Label>
          <div className="flex gap-2">
            <Button
              variant={currentSort?.direction === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDirectionChange('asc')}
              className="flex-1"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              오름차순
            </Button>
            <Button
              variant={currentSort?.direction === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDirectionChange('desc')}
              className="flex-1"
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              내림차순
            </Button>
          </div>
        </div>

        {/* 다중 정렬 목록 */}
        {enableMultiSort && Array.isArray(sorting) && sorting.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2">활성 정렬</Label>
            <div className="space-y-2">
              {sorting.map((sort, index) => {
                const option = defaultSortOptions.find(opt => opt.field === sort.field)
                return (
                  <div
                    key={sort.field}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-5 w-5 p-0 justify-center">
                        {index + 1}
                      </Badge>
                      {option?.icon}
                      <span className="text-sm">{option?.label}</span>
                      {sort.direction === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSort(sort.field)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SortPanel