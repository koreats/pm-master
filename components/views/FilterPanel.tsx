'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { 
  Filter,
  Search,
  X,
  ChevronDown,
  Calendar,
  User,
  Tag,
  Flag,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Users,
  Folder
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import type { FilterState, TaskStatus, TaskPriority } from '@/lib/views/types'

interface FilterPanelProps {
  /**
   * 현재 필터 상태
   */
  filters: FilterState
  /**
   * 필터 변경 핸들러
   */
  onFiltersChange: (filters: FilterState) => void
  /**
   * 사용 가능한 필터 옵션
   */
  availableFilters?: string[]
  /**
   * 패널 표시 여부
   */
  isOpen?: boolean
  /**
   * 패널 토글 핸들러
   */
  onToggle?: () => void
  /**
   * 패널 위치
   */
  position?: 'left' | 'right' | 'top' | 'bottom'
  /**
   * 컴팩트 모드
   */
  compact?: boolean
  /**
   * 커스텀 필터 컴포넌트
   */
  customFilters?: Record<string, React.ComponentType<any>>
  className?: string
}

/**
 * 통합 필터링 패널 컴포넌트
 * 모든 뷰에서 사용 가능한 범용 필터링 시스템
 */
export function FilterPanel({
  filters = {},
  onFiltersChange,
  availableFilters = ['search', 'status', 'priority', 'assignee', 'dateRange', 'tags', 'progress', 'type'],
  isOpen = true,
  onToggle,
  position = 'left',
  compact = false,
  customFilters,
  className,
}: FilterPanelProps) {
  // 로컬 상태
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined,
  })

  // 필터 적용 핸들러
  const applyFilter = useCallback((key: string, value: any) => {
    const newFilters = { ...filters }
    
    if (value === undefined || value === null || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  // 검색 필터 적용 (디바운스)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    // 디바운스 처리
    const timeoutId = setTimeout(() => {
      applyFilter('search', value)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [applyFilter])

  // 날짜 범위 필터 적용
  const handleDateRangeChange = useCallback((type: 'from' | 'to', date: Date | undefined) => {
    const newRange = { ...dateRange }
    newRange[type] = date
    setDateRange(newRange)
    
    if (type === 'from') {
      applyFilter('dateFrom', date?.toISOString())
    } else {
      applyFilter('dateTo', date?.toISOString())
    }
  }, [dateRange, applyFilter])

  // 전체 필터 초기화
  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setDateRange({ from: undefined, to: undefined })
    onFiltersChange({})
  }, [onFiltersChange])

  // 활성 필터 개수
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter(key => {
      const value = filters[key]
      return value !== undefined && value !== null && value !== '' &&
             !(Array.isArray(value) && value.length === 0)
    }).length
  }, [filters])

  // 상태 옵션
  const statusOptions = [
    { value: 'todo', label: '할 일', icon: <Clock className="h-4 w-4" /> },
    { value: 'in_progress', label: '진행 중', icon: <AlertCircle className="h-4 w-4" /> },
    { value: 'review', label: '검토 중', icon: <FileText className="h-4 w-4" /> },
    { value: 'done', label: '완료', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'cancelled', label: '취소됨', icon: <X className="h-4 w-4" /> },
  ]

  // 우선순위 옵션
  const priorityOptions = [
    { value: 'urgent', label: '긴급', color: 'bg-red-500' },
    { value: 'high', label: '높음', color: 'bg-orange-500' },
    { value: 'medium', label: '보통', color: 'bg-yellow-500' },
    { value: 'low', label: '낮음', color: 'bg-green-500' },
  ]

  // 타입 옵션
  const typeOptions = [
    { value: 'goal', label: '목표', icon: <Flag className="h-4 w-4" /> },
    { value: 'project', label: '프로젝트', icon: <Folder className="h-4 w-4" /> },
    { value: 'task', label: '작업', icon: <CheckCircle className="h-4 w-4" /> },
  ]

  if (!isOpen && position !== 'top') return null

  const content = (
    <div className={cn(
      'bg-background border rounded-lg shadow-sm',
      compact ? 'p-3' : 'p-4',
      className
    )}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">필터</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs"
          >
            모두 지우기
          </Button>
        )}
      </div>

      {/* 필터 섹션 */}
      <Accordion type="multiple" defaultValue={['search', 'status']} className="w-full">
        {/* 검색 필터 */}
        {availableFilters.includes('search') && (
          <AccordionItem value="search" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="text-sm">검색</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="검색어 입력..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 상태 필터 */}
        {availableFilters.includes('status') && (
          <AccordionItem value="status" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">상태</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.status?.includes(option.value as TaskStatus) || false}
                      onCheckedChange={(checked) => {
                        const currentStatus = filters.status || []
                        const newStatus = checked
                          ? [...currentStatus, option.value as TaskStatus]
                          : currentStatus.filter(s => s !== option.value)
                        applyFilter('status', newStatus.length > 0 ? newStatus : undefined)
                      }}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {option.icon}
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 우선순위 필터 */}
        {availableFilters.includes('priority') && (
          <AccordionItem value="priority" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                <span className="text-sm">우선순위</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.priority?.includes(option.value as TaskPriority) || false}
                      onCheckedChange={(checked) => {
                        const currentPriority = filters.priority || []
                        const newPriority = checked
                          ? [...currentPriority, option.value as TaskPriority]
                          : currentPriority.filter(p => p !== option.value)
                        applyFilter('priority', newPriority.length > 0 ? newPriority : undefined)
                      }}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className={cn('w-3 h-3 rounded-full', option.color)} />
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 날짜 범위 필터 */}
        {availableFilters.includes('dateRange') && (
          <AccordionItem value="dateRange" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">날짜 범위</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">시작일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-8"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          format(dateRange.from, 'yyyy-MM-dd', { locale: ko })
                        ) : (
                          <span className="text-muted-foreground">날짜 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => handleDateRangeChange('from', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">종료일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-8"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.to ? (
                          format(dateRange.to, 'yyyy-MM-dd', { locale: ko })
                        ) : (
                          <span className="text-muted-foreground">날짜 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => handleDateRangeChange('to', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 진행률 필터 */}
        {availableFilters.includes('progress') && (
          <AccordionItem value="progress" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">진행률</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>최소: {filters.progressMin || 0}%</span>
                  <span>최대: {filters.progressMax || 100}%</span>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[filters.progressMin || 0, filters.progressMax || 100]}
                    onValueChange={([min, max]) => {
                      applyFilter('progressMin', min)
                      applyFilter('progressMax', max)
                    }}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 타입 필터 */}
        {availableFilters.includes('type') && (
          <AccordionItem value="type" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span className="text-sm">타입</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {typeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.type?.includes(option.value) || false}
                      onCheckedChange={(checked) => {
                        const currentType = filters.type || []
                        const newType = checked
                          ? [...currentType, option.value]
                          : currentType.filter(t => t !== option.value)
                        applyFilter('type', newType.length > 0 ? newType : undefined)
                      }}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {option.icon}
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 커스텀 필터 */}
        {customFilters && Object.entries(customFilters).map(([key, Component]) => (
          <AccordionItem key={key} value={key} className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm capitalize">{key}</span>
            </AccordionTrigger>
            <AccordionContent>
              <Component
                value={filters[key]}
                onChange={(value: any) => applyFilter(key, value)}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )

  // 위치에 따른 렌더링
  if (position === 'top') {
    return (
      <div className="border-b">
        {content}
      </div>
    )
  }

  return content
}

export default FilterPanel