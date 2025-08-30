'use client'

import React, { memo } from 'react'
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, getWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter'

interface TimelineHeaderProps {
  startDate: Date
  endDate: Date
  zoomLevel: ZoomLevel
  dayWidth: number
}

/**
 * 타임라인 헤더 컴포넌트
 * 날짜 스케일을 표시하는 헤더
 */
export const TimelineHeader = memo(function TimelineHeader({
  startDate,
  endDate,
  zoomLevel,
  dayWidth,
}: TimelineHeaderProps) {
  // 줌 레벨에 따른 날짜 간격 생성
  const getDateIntervals = () => {
    switch (zoomLevel) {
      case 'day':
        return eachDayOfInterval({ start: startDate, end: endDate })
      case 'week':
        return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 0 })
      case 'month':
        return eachMonthOfInterval({ start: startDate, end: endDate })
      case 'quarter':
        // 분기별로 표시
        const quarters = []
        let current = new Date(startDate)
        while (current <= endDate) {
          quarters.push(new Date(current))
          current.setMonth(current.getMonth() + 3)
        }
        return quarters
      default:
        return []
    }
  }

  const dateIntervals = getDateIntervals()

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    switch (zoomLevel) {
      case 'day':
        return format(date, 'd', { locale: ko })
      case 'week':
        return `W${getWeek(date)}`
      case 'month':
        return format(date, 'MMM', { locale: ko })
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `Q${quarter}`
      default:
        return ''
    }
  }

  // 상위 헤더 포맷팅 (월/년도)
  const formatTopHeader = (date: Date) => {
    switch (zoomLevel) {
      case 'day':
        return format(date, 'yyyy년 MMMM', { locale: ko })
      case 'week':
      case 'month':
        return format(date, 'yyyy년', { locale: ko })
      case 'quarter':
        return format(date, 'yyyy년', { locale: ko })
      default:
        return ''
    }
  }

  // 간격 너비 계산
  const getIntervalWidth = () => {
    switch (zoomLevel) {
      case 'day':
        return dayWidth
      case 'week':
        return dayWidth * 7
      case 'month':
        return dayWidth * 30 // 근사값
      case 'quarter':
        return dayWidth * 90 // 근사값
      default:
        return dayWidth
    }
  }

  const intervalWidth = getIntervalWidth()

  // 월별 그룹핑 (일 뷰에서 사용)
  const monthGroups = zoomLevel === 'day' ? 
    eachMonthOfInterval({ start: startDate, end: endDate }).map(month => {
      const monthStart = month < startDate ? startDate : month
      const nextMonth = new Date(month)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const monthEnd = nextMonth > endDate ? endDate : new Date(nextMonth.getTime() - 1)
      
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length
      
      return {
        date: month,
        width: daysInMonth * dayWidth,
        label: format(month, 'yyyy년 MMMM', { locale: ko }),
      }
    }) : []

  return (
    <div className="sticky top-0 z-10 bg-white border-b">
      {/* 상위 헤더 (월/년도) */}
      {zoomLevel === 'day' && (
        <div className="flex border-b">
          {monthGroups.map((group, index) => (
            <div
              key={index}
              className="border-r px-2 py-1 text-sm font-medium bg-gray-50"
              style={{ width: `${group.width}px` }}
            >
              {group.label}
            </div>
          ))}
        </div>
      )}

      {/* 메인 헤더 */}
      <div className="flex">
        {dateIntervals.map((date, index) => {
          const isWeekend = zoomLevel === 'day' && (date.getDay() === 0 || date.getDay() === 6)
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          
          return (
            <div
              key={index}
              className={cn(
                'border-r px-1 py-2 text-xs text-center',
                isWeekend && 'bg-gray-50',
                isToday && 'bg-blue-50 font-semibold'
              )}
              style={{ width: `${intervalWidth}px`, minWidth: `${intervalWidth}px` }}
            >
              {zoomLevel === 'day' && (
                <div className="text-xs text-gray-500">
                  {format(date, 'EEE', { locale: ko })}
                </div>
              )}
              <div className={cn(isToday && 'text-blue-600')}>
                {formatDate(date)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})