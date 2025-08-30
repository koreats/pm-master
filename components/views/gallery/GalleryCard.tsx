'use client'

import React, { memo } from 'react'
import type { Task } from '@/lib/core/domain/entities/Task'
import type { Project } from '@/lib/core/domain/entities/Project'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  Clock, 
  Flag, 
  User, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Hash,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface GalleryCardProps {
  item: Task | Project
  onClick?: () => void
  aspectRatio?: number
  showImage?: boolean
  className?: string
}

/**
 * 갤러리 카드 컴포넌트
 * 태스크와 프로젝트를 카드 형태로 표시
 */
export const GalleryCard = memo(function GalleryCard({
  item,
  onClick,
  aspectRatio = 1,
  showImage = true,
  className,
}: GalleryCardProps) {
  // 타입 가드
  const isTask = (item: Task | Project): item is Task => {
    return 'getProjectId' in item
  }

  const isProject = (item: Task | Project): item is Project => {
    return 'getGoalId' in item
  }

  // 공통 속성
  const title = item.getTitle()
  const description = item.getDescription()
  const priority = item.getPriority()
  const status = item.getStatus()
  const createdAt = item.getCreatedAt()
  const updatedAt = item.getUpdatedAt()

  // 우선순위 설정
  const priorityConfig = {
    low: { icon: Flag, color: 'text-gray-400', bgColor: 'bg-gray-100', label: '낮음' },
    medium: { icon: Flag, color: 'text-blue-500', bgColor: 'bg-blue-100', label: '보통' },
    high: { icon: Flag, color: 'text-orange-500', bgColor: 'bg-orange-100', label: '높음' },
    urgent: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100', label: '긴급' },
  }

  const PriorityIcon = priorityConfig[priority].icon

  // 상태별 색상
  const statusColors = {
    // Task 상태
    todo: { bg: 'bg-gray-100', text: 'text-gray-700', label: '할 일' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: '진행 중' },
    review: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '검토 중' },
    done: { bg: 'bg-green-100', text: 'text-green-700', label: '완료' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: '취소됨' },
    // Project 상태
    planning: { bg: 'bg-purple-100', text: 'text-purple-700', label: '계획 중' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: '완료' },
    on_hold: { bg: 'bg-orange-100', text: 'text-orange-700', label: '보류' },
  }

  const statusConfig = statusColors[status as keyof typeof statusColors] || statusColors.todo

  // Task 전용 속성
  let projectId: string | undefined
  let dueDate: Date | undefined
  let estimatedHours: number | undefined
  let position: number | undefined

  if (isTask(item)) {
    projectId = item.getProjectId()
    dueDate = item.getDueDate()
    estimatedHours = item.getEstimatedHours()
    position = item.getPosition()
  }

  // Project 전용 속성
  let goalId: string | undefined
  let progress: number | undefined
  let startDate: Date | undefined
  let endDate: Date | undefined

  if (isProject(item)) {
    goalId = item.getGoalId()
    progress = item.getProgress()
    startDate = item.getStartDate()
    endDate = item.getEndDate()
  }

  // 담당자 정보
  const assignedTo = 'getAssignedTo' in item ? item.getAssignedTo() : undefined
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // 마감일 계산
  const targetDate = dueDate || endDate
  const isOverdue = targetDate && targetDate < new Date() && status !== 'done' && status !== 'completed'
  const isDueSoon = targetDate && !isOverdue && 
    (targetDate.getTime() - new Date().getTime()) < 86400000 * 2 // 2일 이내

  // 진행률 계산
  const calculateProgress = () => {
    if (progress !== undefined) return progress
    
    if (status === 'done' || status === 'completed') return 100
    if (status === 'cancelled') return 0
    if (status === 'in_progress') return 50
    if (status === 'review') return 75
    if (status === 'planning') return 10
    return 0
  }

  const displayProgress = calculateProgress()

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-lg',
        'hover:-translate-y-1',
        isOverdue && 'border-red-300',
        className
      )}
      onClick={onClick}
    >
      {/* 이미지 영역 (옵션) */}
      {showImage && (
        <div 
          className="relative overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100"
          style={{ paddingTop: `${100 / aspectRatio}%` }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {isTask(item) ? (
              <FileText className="h-16 w-16 text-blue-300" />
            ) : (
              <BarChart3 className="h-16 w-16 text-purple-300" />
            )}
          </div>
          
          {/* 우선순위 배지 */}
          <div className="absolute top-2 right-2">
            <div className={cn(
              'p-1.5 rounded-full',
              priorityConfig[priority].bgColor
            )}>
              <PriorityIcon className={cn('h-4 w-4', priorityConfig[priority].color)} />
            </div>
          </div>

          {/* 상태 배지 */}
          <div className="absolute top-2 left-2">
            <Badge className={cn(statusConfig.bg, statusConfig.text)}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 flex-1">
            {title}
          </CardTitle>
          {(status === 'done' || status === 'completed') && (
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          )}
        </div>
        {description && (
          <CardDescription className="line-clamp-2 mt-1">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 메타 정보 */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          {/* 마감일/기간 */}
          {targetDate && (
            <div
              className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-red-600 font-medium',
                isDueSoon && 'text-orange-600'
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{format(targetDate, 'MM/dd', { locale: ko })}</span>
            </div>
          )}

          {/* 예상 시간 */}
          {estimatedHours && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{estimatedHours}h</span>
            </div>
          )}

          {/* ID 표시 */}
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            <span className="font-mono">
              {isTask(item) ? `T-${item.getId().slice(0, 6)}` : `P-${item.getId().slice(0, 6)}`}
            </span>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">진행률</span>
            <span className="font-medium">{displayProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                displayProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t">
        {/* 프로젝트/목표 참조 */}
        <div className="text-xs text-gray-500">
          {isTask(item) && projectId && (
            <span>프로젝트: {projectId.slice(0, 8)}</span>
          )}
          {isProject(item) && goalId && (
            <span>목표: {goalId.slice(0, 8)}</span>
          )}
        </div>

        {/* 담당자 */}
        {assignedTo ? (
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/api/avatar/${assignedTo}`} />
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
              {getInitials(assignedTo)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
            <User className="h-3 w-3 text-gray-400" />
          </div>
        )}
      </CardFooter>
    </Card>
  )
})