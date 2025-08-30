'use client'

import React, { memo, useState, useMemo } from 'react'
import type { GalleryViewProps } from '@/lib/views/types'
import type { Task } from '@/lib/core/domain/entities/Task'
import type { Project } from '@/lib/core/domain/entities/Project'
import { GalleryCard } from './GalleryCard'
import { cn } from '@/lib/utils'
import { 
  Grid3x3, 
  Grid2x2, 
  Square, 
  LayoutGrid,
  Filter,
  SortAsc,
  Image,
  ImageOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * 갤러리 뷰 컴포넌트
 * 카드 기반 그리드 레이아웃
 */
export const GalleryView = memo(function GalleryView({
  data = [],
  config,
  loading,
  error,
  onItemClick,
  onItemUpdate,
  onItemDelete,
  columns: propColumns = 3,
  aspectRatio = 1.2,
  enableMasonry = false,
  className,
}: GalleryViewProps) {
  const [columns, setColumns] = useState(propColumns)
  const [showImages, setShowImages] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  // 타입 가드
  const isTask = (item: Task | Project | any): item is Task => {
    return item && typeof item.getProjectId === 'function'
  }

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(item => {
        const title = item.getTitle().toLowerCase()
        const description = item.getDescription()?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        return title.includes(query) || description.includes(query)
      })
    }

    // 상태 필터
    if (filterStatus) {
      filtered = filtered.filter(item => item.getStatus() === filterStatus)
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          const aPriority = priorityOrder[a.getPriority() as keyof typeof priorityOrder] || 99
          const bPriority = priorityOrder[b.getPriority() as keyof typeof priorityOrder] || 99
          return aPriority - bPriority
        }
        case 'status': {
          const statusOrder = { 
            todo: 0, planning: 0,
            in_progress: 1,
            review: 2,
            done: 3, completed: 3,
            cancelled: 4, on_hold: 4
          }
          const aStatus = statusOrder[a.getStatus() as keyof typeof statusOrder] || 99
          const bStatus = statusOrder[b.getStatus() as keyof typeof statusOrder] || 99
          return aStatus - bStatus
        }
        case 'date':
        default: {
          const aDate = a.getUpdatedAt().getTime()
          const bDate = b.getUpdatedAt().getTime()
          return bDate - aDate // 최신순
        }
      }
    })

    return filtered
  }, [data, searchQuery, filterStatus, sortBy])

  // 상태 목록 추출
  const availableStatuses = useMemo(() => {
    const statuses = new Set(data.map(item => item.getStatus()))
    return Array.from(statuses)
  }, [data])

  // 컬럼 설정 클래스
  const gridColumnsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  }

  // Masonry 레이아웃 시뮬레이션 (CSS Grid로 구현)
  const masonryStyle = enableMasonry ? {
    gridAutoRows: '10px',
  } : {}

  // 카드 높이 계산 (Masonry용)
  const getCardSpan = (item: any) => {
    if (!enableMasonry) return {}
    
    // 컨텐츠 양에 따라 높이 결정
    const hasDescription = !!item.getDescription()
    const baseSpan = 25 // 기본 높이
    const extraSpan = hasDescription ? 10 : 0
    const imageSpan = showImages ? 15 : 0
    
    return {
      gridRowEnd: `span ${baseSpan + extraSpan + imageSpan}`,
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-600">오류: {error.message}</div>
      </div>
    )
  }

  return (
    <div className={cn('w-full h-full flex flex-col', className)}>
      {/* 툴바 */}
      <div className="p-4 border-b space-y-3">
        {/* 검색 및 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="search"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 상태 필터 */}
          <select
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">모든 상태</option>
            {availableStatuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* 정렬 옵션 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="date">날짜순</option>
            <option value="priority">우선순위순</option>
            <option value="status">상태순</option>
          </select>
        </div>

        {/* 뷰 옵션 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* 컬럼 수 조절 */}
            <Button
              variant={columns === 1 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setColumns(1)}
              className="h-8 w-8 p-0"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={columns === 2 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setColumns(2)}
              className="h-8 w-8 p-0"
            >
              <Grid2x2 className="h-4 w-4" />
            </Button>
            <Button
              variant={columns === 3 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setColumns(3)}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={columns === 4 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setColumns(4)}
              className="h-8 w-8 p-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* 이미지 토글 */}
            <Button
              variant={showImages ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowImages(!showImages)}
              className="h-8 px-3"
            >
              {showImages ? (
                <>
                  <Image className="h-4 w-4 mr-1" />
                  이미지
                </>
              ) : (
                <>
                  <ImageOff className="h-4 w-4 mr-1" />
                  텍스트
                </>
              )}
            </Button>

            {/* 결과 수 */}
            <span className="text-sm text-gray-600">
              {filteredData.length}개 항목
            </span>
          </div>
        </div>
      </div>

      {/* 갤러리 그리드 */}
      <div className="flex-1 overflow-auto p-4">
        {filteredData.length > 0 ? (
          <div
            className={cn(
              'grid gap-4',
              gridColumnsClass[columns as keyof typeof gridColumnsClass] || gridColumnsClass[3]
            )}
            style={masonryStyle}
          >
            {filteredData.map((item) => (
              <div
                key={item.getId()}
                style={getCardSpan(item)}
                className={enableMasonry ? 'break-inside-avoid' : ''}
              >
                <GalleryCard
                  item={item as Task | Project}
                  onClick={() => onItemClick?.(item)}
                  aspectRatio={aspectRatio}
                  showImage={showImages}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-lg font-medium">항목이 없습니다</p>
            <p className="text-sm mt-1">검색 조건을 변경해보세요</p>
          </div>
        )}
      </div>
    </div>
  )
})

export default GalleryView