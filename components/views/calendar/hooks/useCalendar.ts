'use client'

import { useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getWeek,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Task } from '@/lib/core/domain/entities/Task'

export type CalendarView = 'month' | 'week' | 'day'

interface UseCalendarProps {
  currentDate: Date
  view: CalendarView
  tasks: Task[]
}

interface CalendarDay {
  date: Date
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  tasks: Task[]
}

export function useCalendar({ currentDate, view, tasks }: UseCalendarProps) {
  // 현재 뷰에 따른 날짜 범위 계산
  const dateRange = useMemo(() => {
    switch (view) {
      case 'month': {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
        return { start: calendarStart, end: calendarEnd }
      }
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
        return { start: weekStart, end: weekEnd }
      }
      case 'day': {
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) }
      }
    }
  }, [currentDate, view])

  // 캘린더 날짜 배열 생성
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval(dateRange)
    
    return days.map(date => {
      const dayTasks = tasks.filter(task => {
        const dueDate = task.getDueDate()
        return dueDate && isSameDay(dueDate, date)
      })

      return {
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: isSameMonth(date, currentDate),
        isToday: isToday(date),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        tasks: dayTasks,
      } as CalendarDay
    })
  }, [dateRange, currentDate, tasks])

  // 네비게이션 함수들
  const navigatePrevious = () => {
    switch (view) {
      case 'month':
        return subMonths(currentDate, 1)
      case 'week':
        return subWeeks(currentDate, 1)
      case 'day':
        return subDays(currentDate, 1)
    }
  }

  const navigateNext = () => {
    switch (view) {
      case 'month':
        return addMonths(currentDate, 1)
      case 'week':
        return addWeeks(currentDate, 1)
      case 'day':
        return addDays(currentDate, 1)
    }
  }

  const navigateToday = () => {
    return new Date()
  }

  // 헤더 타이틀 생성
  const headerTitle = useMemo(() => {
    switch (view) {
      case 'month':
        return format(currentDate, 'yyyy년 MMMM', { locale: ko })
      case 'week':
        return `${format(dateRange.start, 'yyyy년 MM월 dd일', { locale: ko })} - ${format(
          dateRange.end,
          'MM월 dd일',
          { locale: ko }
        )}`
      case 'day':
        return format(currentDate, 'yyyy년 MM월 dd일 EEEE', { locale: ko })
    }
  }, [currentDate, view, dateRange])

  // 주 번호 계산 (월 뷰에서 사용)
  const weekNumbers = useMemo(() => {
    if (view !== 'month') return []
    
    const weeks: number[] = []
    let currentWeek = dateRange.start
    
    while (currentWeek <= dateRange.end) {
      weeks.push(getWeek(currentWeek, { weekStartsOn: 0 }))
      currentWeek = addWeeks(currentWeek, 1)
    }
    
    return weeks
  }, [view, dateRange])

  // 시간 슬롯 (일/주 뷰에서 사용)
  const timeSlots = useMemo(() => {
    if (view === 'month') return []
    
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
      })
    }
    return slots
  }, [view])

  return {
    calendarDays,
    dateRange,
    headerTitle,
    weekNumbers,
    timeSlots,
    navigatePrevious,
    navigateNext,
    navigateToday,
  }
}