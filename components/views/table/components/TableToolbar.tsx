'use client'

import React from 'react'
import { Table } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Download,
  Upload,
  Settings2,
  X,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { Task } from '@/lib/core/domain/entities/Task'
import { cn } from '@/lib/utils'

interface TableToolbarProps {
  table: Table<Task>
  onExport?: () => void
  onImport?: () => void
  className?: string
}

/**
 * 테이블 툴바 컴포넌트
 * 검색, 필터링, 정렬, 컬럼 표시/숨김 기능 제공
 */
export function TableToolbar({
  table,
  onExport,
  onImport,
  className,
}: TableToolbarProps) {
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all')

  // 글로벌 필터 적용
  React.useEffect(() => {
    table.setGlobalFilter(globalFilter)
  }, [globalFilter, table])

  // 상태 필터 적용
  React.useEffect(() => {
    if (statusFilter === 'all') {
      table.getColumn('status')?.setFilterValue(undefined)
    } else {
      table.getColumn('status')?.setFilterValue(statusFilter)
    }
  }, [statusFilter, table])

  // 우선순위 필터 적용
  React.useEffect(() => {
    if (priorityFilter === 'all') {
      table.getColumn('priority')?.setFilterValue(undefined)
    } else {
      table.getColumn('priority')?.setFilterValue(priorityFilter)
    }
  }, [priorityFilter, table])

  // 활성 필터 개수
  const activeFilterCount = [
    globalFilter,
    statusFilter !== 'all',
    priorityFilter !== 'all',
  ].filter(Boolean).length

  // 모든 필터 초기화
  const clearAllFilters = () => {
    setGlobalFilter('')
    setStatusFilter('all')
    setPriorityFilter('all')
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {/* 검색 */}
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="검색..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 pr-4"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            )}
          </div>

          {/* 상태 필터 */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="todo">할 일</SelectItem>
              <SelectItem value="in_progress">진행 중</SelectItem>
              <SelectItem value="review">검토 중</SelectItem>
              <SelectItem value="done">완료</SelectItem>
              <SelectItem value="cancelled">취소됨</SelectItem>
            </SelectContent>
          </Select>

          {/* 우선순위 필터 */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="우선순위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 우선순위</SelectItem>
              <SelectItem value="urgent">긴급</SelectItem>
              <SelectItem value="high">높음</SelectItem>
              <SelectItem value="medium">보통</SelectItem>
              <SelectItem value="low">낮음</SelectItem>
            </SelectContent>
          </Select>

          {/* 필터 초기화 */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-9"
            >
              필터 초기화
              <Badge className="ml-2" variant="secondary">
                {activeFilterCount}
              </Badge>
            </Button>
          )}
        </div>

        {/* 우측 액션 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 정렬 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <SortAsc className="h-4 w-4 mr-2" />
                정렬
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                onClick={() => table.getColumn('title')?.toggleSorting(false)}
              >
                제목 (오름차순)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                onClick={() => table.getColumn('title')?.toggleSorting(true)}
              >
                제목 (내림차순)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                onClick={() => table.getColumn('dueDate')?.toggleSorting(false)}
              >
                마감일 (가까운 순)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                onClick={() => table.getColumn('dueDate')?.toggleSorting(true)}
              >
                마감일 (먼 순)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                onClick={() => table.getColumn('priority')?.toggleSorting(true)}
              >
                우선순위 (높은 순)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                onClick={() => table.getColumn('createdAt')?.toggleSorting(true)}
              >
                최신 순
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 컬럼 표시/숨김 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Settings2 className="h-4 w-4 mr-2" />
                컬럼
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>표시할 컬럼</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const columnName = {
                    title: '제목',
                    status: '상태',
                    priority: '우선순위',
                    assignedTo: '담당자',
                    progress: '진행률',
                    dueDate: '마감일',
                    estimatedHours: '예상 시간',
                    projectId: '프로젝트',
                    createdAt: '생성일',
                    updatedAt: '수정일',
                  }[column.id] || column.id

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {columnName}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 내보내기 */}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="h-9">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          )}

          {/* 가져오기 */}
          {onImport && (
            <Button variant="outline" size="sm" onClick={onImport} className="h-9">
              <Upload className="h-4 w-4 mr-2" />
              가져오기
            </Button>
          )}
        </div>
      </div>

      {/* 활성 필터 태그 */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {globalFilter && (
            <Badge variant="secondary" className="gap-1">
              검색: {globalFilter}
              <button
                onClick={() => setGlobalFilter('')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              상태: {statusFilter}
              <button
                onClick={() => setStatusFilter('all')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {priorityFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              우선순위: {priorityFilter}
              <button
                onClick={() => setPriorityFilter('all')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}