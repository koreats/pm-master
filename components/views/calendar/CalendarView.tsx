'use client'

import React, { memo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import type { CalendarViewProps } from '@/lib/views/types'
import type { Task } from '@/lib/core/domain/entities/Task'
import { CalendarGrid } from './CalendarGrid'
import { CalendarEvent } from './CalendarEvent'
import { useCalendar } from './hooks/useCalendar'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Calendar, Clock, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, parse } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 캘린더 뷰 컴포넌트
 * 월/주/일 뷰를 지원하는 캘린더
 */
export const CalendarView = memo(function CalendarView({
  data = [],
  config,
  loading,
  error,
  onItemClick,
  onItemUpdate,
  onItemDelete,
  onEventDrop,
  view = 'month',
  onViewChange,
  onDateChange,
  className,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState(view)

  // 포인터 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // 캘린더 훅 사용
  const {
    calendarDays,
    dateRange,
    headerTitle,
    weekNumbers,
    timeSlots,
    navigatePrevious,
    navigateNext,
    navigateToday,
  } = useCalendar({
    currentDate,
    view: currentView,
    tasks: data,
  })

  // 드래그 중인 태스크 찾기
  const activeTask = activeId ? data.find(task => task.getId() === activeId) : null

  // 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // 드래그 종료
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !onEventDrop) {
      setActiveId(null)
      return
    }

    const taskId = active.id as string
    const overData = over.data.current

    if (overData?.type === 'calendar-grid') {
      const newDate = overData.date as Date
      const timeSlot = overData.timeSlot as number | undefined

      // 시간 슬롯이 있으면 해당 시간으로, 없으면 날짜만 변경
      if (timeSlot !== undefined) {
        newDate.setHours(timeSlot)
      }

      await onEventDrop(taskId, newDate)
    }

    setActiveId(null)
  }

  // 네비게이션 핸들러
  const handlePrevious = () => {
    const newDate = navigatePrevious()
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  const handleNext = () => {
    const newDate = navigateNext()
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  const handleToday = () => {
    const newDate = navigateToday()
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  // 뷰 변경 핸들러
  const handleViewChange = (newView: 'month' | 'week' | 'day') => {
    setCurrentView(newView)
    onViewChange?.(newView)
  }

  // 요일 헤더
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('w-full h-full flex flex-col', className)}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="px-3"
            >
              오늘
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold ml-4">{headerTitle}</h2>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={currentView === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('month')}
              className="px-3"
            >
              <Calendar className="h-4 w-4 mr-1" />월
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('week')}
              className="px-3"
            >
              <CalendarDays className="h-4 w-4 mr-1" />주
            </Button>
            <Button
              variant={currentView === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('day')}
              className="px-3"
            >
              <Clock className="h-4 w-4 mr-1" />일
            </Button>
          </div>
        </div>

        {/* 캘린더 본체 */}
        <div className="flex-1 overflow-auto">
          {currentView === 'month' ? (
            // 월 뷰
            <div className="h-full">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 border-b">
                {weekDays.map((day, index) => (
                  <div
                    key={day}
                    className={cn(
                      'p-2 text-center text-sm font-medium',
                      index === 0 && 'text-red-500',
                      index === 6 && 'text-blue-500'
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 flex-1">
                {calendarDays.map((day) => (
                  <CalendarGrid
                    key={day.date.toISOString()}
                    date={day.date}
                    tasks={day.tasks}
                    view={currentView}
                    isToday={day.isToday}
                    isCurrentMonth={day.isCurrentMonth}
                    isWeekend={day.isWeekend}
                    onTaskClick={onItemClick}
                    onDateClick={(date) => {
                      setCurrentDate(date)
                      handleViewChange('day')
                    }}
                  />
                ))}
              </div>
            </div>
          ) : currentView === 'week' ? (
            // 주 뷰
            <div className="h-full flex">
              {/* 시간 라벨 */}
              <div className="w-16 border-r">
                <div className="h-10 border-b" /> {/* 헤더 공간 */}
                {timeSlots.map(slot => (
                  <div
                    key={slot.hour}
                    className="h-20 border-b px-2 py-1 text-xs text-gray-500"
                  >
                    {slot.label}
                  </div>
                ))}
              </div>

              {/* 날짜별 컬럼 */}
              <div className="flex-1 grid grid-cols-7">
                {calendarDays.map((day) => (
                  <div key={day.date.toISOString()} className="border-r">
                    {/* 날짜 헤더 */}
                    <div
                      className={cn(
                        'h-10 border-b p-2 text-center text-sm',
                        day.isToday && 'bg-blue-50 font-semibold'
                      )}
                    >
                      <div>{format(day.date, 'E', { locale: ko })}</div>
                      <div className={cn(day.isToday && 'text-blue-600')}>
                        {day.dayNumber}
                      </div>
                    </div>

                    {/* 시간별 그리드 */}
                    {timeSlots.map(slot => (
                      <CalendarGrid
                        key={`${day.date.toISOString()}-${slot.hour}`}
                        date={day.date}
                        tasks={day.tasks}
                        view={currentView}
                        isToday={day.isToday}
                        isCurrentMonth={true}
                        isWeekend={day.isWeekend}
                        onTaskClick={onItemClick}
                        timeSlot={slot.hour}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 일 뷰
            <div className="h-full flex">
              {/* 시간 라벨 */}
              <div className="w-16 border-r">
                {timeSlots.map(slot => (
                  <div
                    key={slot.hour}
                    className="h-16 border-b px-2 py-1 text-xs text-gray-500"
                  >
                    {slot.label}
                  </div>
                ))}
              </div>

              {/* 일정 그리드 */}
              <div className="flex-1">
                {timeSlots.map(slot => (
                  <CalendarGrid
                    key={slot.hour}
                    date={currentDate}
                    tasks={calendarDays[0]?.tasks || []}
                    view={currentView}
                    isToday={calendarDays[0]?.isToday || false}
                    isCurrentMonth={true}
                    isWeekend={calendarDays[0]?.isWeekend || false}
                    onTaskClick={onItemClick}
                    timeSlot={slot.hour}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 드래그 오버레이 */}
      <DragOverlay>
        {activeTask && (
          <CalendarEvent
            task={activeTask}
            view={currentView}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
})

export default CalendarView