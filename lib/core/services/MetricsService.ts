import { GoalRepository } from '@/lib/core/infrastructure/repositories/GoalRepository'
import { ProjectRepository } from '@/lib/core/infrastructure/repositories/ProjectRepository'
import { TaskRepository } from '@/lib/core/infrastructure/repositories/TaskRepository'
import type { Goal } from '@/lib/core/domain/entities/Goal'
import type { Project } from '@/lib/core/domain/entities/Project'
import type { Task } from '@/lib/core/domain/entities/Task'

interface DashboardMetrics {
  overview: {
    totalGoals: number
    activeGoals: number
    totalProjects: number
    activeProjects: number
    totalTasks: number
    activeTasks: number
    overdueTasks: number
  }
  progress: {
    goalsCompletionRate: number
    projectsCompletionRate: number
    tasksCompletionRate: number
    averageGoalProgress: number
  }
  productivity: {
    tasksCompletedToday: number
    tasksCompletedThisWeek: number
    averageTaskCompletionTime: number
    productivityTrend: number
  }
  time: {
    totalEstimatedHours: number
    totalActualHours: number
    timeEfficiency: number
    mostTimeConsumingProjects: Array<{
      id: string
      title: string
      actualHours: number
      estimatedHours: number
      variance: number
    }>
  }
}

interface UserPerformanceMetrics {
  overview: {
    assignedProjects: number
    assignedTasks: number
    completedTasks: number
    overdueItems: number
  }
  completion: {
    tasksCompletedToday: number
    tasksCompletedThisWeek: number
    tasksCompletedThisMonth: number
    completionStreak: number
  }
  time: {
    averageTaskTime: number
    timeEstimateAccuracy: number
    mostProductiveTimeOfDay: string
    totalHoursWorked: number
  }
  quality: {
    taskReworkRate: number
    averageTaskPriority: string
    onTimeCompletionRate: number
  }
}

interface ProjectHealthMetrics {
  health: 'healthy' | 'at_risk' | 'critical'
  score: number
  factors: {
    progress: { score: number; weight: number; status: string }
    timeline: { score: number; weight: number; status: string }
    workload: { score: number; weight: number; status: string }
    quality: { score: number; weight: number; status: string }
  }
  recommendations: string[]
  riskFactors: string[]
}

export class MetricsService {
  private goalRepository = new GoalRepository()
  private projectRepository = new ProjectRepository()
  private taskRepository = new TaskRepository()

  /**
   * 팀 대시보드용 종합 메트릭
   */
  async getDashboardMetrics(teamId: string): Promise<DashboardMetrics> {
    const goals = await this.goalRepository.findByTeamId(teamId)
    const goalIds = goals.map(g => g.getId())
    
    const allProjects = await Promise.all(
      goalIds.map(goalId => this.projectRepository.findByGoalId(goalId))
    ).then(results => results.flat())

    const allTasks = await Promise.all(
      allProjects.map(project => this.taskRepository.findByProjectId(project.getId()))
    ).then(results => results.flat())

    const overdueTasks = await this.taskRepository.findOverdue()
    const teamOverdueTasks = overdueTasks.filter(task => 
      allTasks.some(t => t.getId() === task.getId())
    )

    // 오늘/이번주 완료된 작업
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    const tasksCompletedToday = allTasks.filter(task => 
      task.isDone() && this.isSameDay(task.getUpdatedAt(), today)
    ).length

    const tasksCompletedThisWeek = allTasks.filter(task => 
      task.isDone() && task.getUpdatedAt() >= startOfWeek
    ).length

    // 완료 시간 평균 계산
    const completedTasksWithTime = allTasks.filter(task => 
      task.isDone() && task.getActualHours() !== undefined
    )
    const averageCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, task) => sum + task.getActualHours()!, 0) / completedTasksWithTime.length
      : 0

    // 생산성 트렌드 (이번 주 vs 지난 주)
    const lastWeekStart = new Date(startOfWeek)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    
    const tasksCompletedLastWeek = allTasks.filter(task => 
      task.isDone() && 
      task.getUpdatedAt() >= lastWeekStart && 
      task.getUpdatedAt() < startOfWeek
    ).length

    const productivityTrend = tasksCompletedLastWeek > 0 
      ? ((tasksCompletedThisWeek - tasksCompletedLastWeek) / tasksCompletedLastWeek) * 100
      : 0

    // 시간 메트릭
    const totalEstimated = allTasks.reduce((sum, task) => sum + (task.getEstimatedHours() || 0), 0)
    const totalActual = allTasks.reduce((sum, task) => sum + (task.getActualHours() || 0), 0)
    const timeEfficiency = totalEstimated > 0 ? (totalEstimated / totalActual) * 100 : 100

    // 가장 시간이 많이 걸린 프로젝트들
    const projectTimeData = await Promise.all(
      allProjects.map(async (project) => {
        const tasks = await this.taskRepository.findByProjectId(project.getId())
        const estimated = tasks.reduce((sum, t) => sum + (t.getEstimatedHours() || 0), 0)
        const actual = tasks.reduce((sum, t) => sum + (t.getActualHours() || 0), 0)
        
        return {
          id: project.getId(),
          title: project.getTitle(),
          actualHours: actual,
          estimatedHours: estimated,
          variance: actual - estimated
        }
      })
    )

    const mostTimeConsumingProjects = projectTimeData
      .filter(p => p.actualHours > 0)
      .sort((a, b) => b.actualHours - a.actualHours)
      .slice(0, 5)

    return {
      overview: {
        totalGoals: goals.length,
        activeGoals: goals.filter(g => g.isActive()).length,
        totalProjects: allProjects.length,
        activeProjects: allProjects.filter(p => p.isInProgress()).length,
        totalTasks: allTasks.length,
        activeTasks: allTasks.filter(t => t.isInProgress()).length,
        overdueTasks: teamOverdueTasks.length
      },
      progress: {
        goalsCompletionRate: goals.length > 0 
          ? Math.round((goals.filter(g => g.isCompleted()).length / goals.length) * 100)
          : 0,
        projectsCompletionRate: allProjects.length > 0
          ? Math.round((allProjects.filter(p => p.isCompleted()).length / allProjects.length) * 100)
          : 0,
        tasksCompletionRate: allTasks.length > 0
          ? Math.round((allTasks.filter(t => t.isDone()).length / allTasks.length) * 100)
          : 0,
        averageGoalProgress: goals.length > 0
          ? Math.round(goals.reduce((sum, g) => sum + g.getProgress(), 0) / goals.length)
          : 0
      },
      productivity: {
        tasksCompletedToday,
        tasksCompletedThisWeek,
        averageTaskCompletionTime: Math.round(averageCompletionTime * 10) / 10,
        productivityTrend: Math.round(productivityTrend)
      },
      time: {
        totalEstimatedHours: Math.round(totalEstimated),
        totalActualHours: Math.round(totalActual),
        timeEfficiency: Math.round(timeEfficiency),
        mostTimeConsumingProjects
      }
    }
  }

  /**
   * 사용자 개인 성과 메트릭
   */
  async getUserPerformanceMetrics(userId: string): Promise<UserPerformanceMetrics> {
    const assignedProjects = await this.projectRepository.findByAssignedUser(userId)
    const assignedTasks = await this.taskRepository.findByAssignedUser(userId)
    const completedTasks = assignedTasks.filter(t => t.isDone())
    
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const tasksCompletedToday = completedTasks.filter(task => 
      this.isSameDay(task.getUpdatedAt(), today)
    ).length

    const tasksCompletedThisWeek = completedTasks.filter(task => 
      task.getUpdatedAt() >= startOfWeek
    ).length

    const tasksCompletedThisMonth = completedTasks.filter(task => 
      task.getUpdatedAt() >= startOfMonth
    ).length

    // 완료 연속 기록
    const completionStreak = this.calculateCompletionStreak(completedTasks)

    // 평균 작업 시간
    const tasksWithTime = completedTasks.filter(t => t.getActualHours() !== undefined)
    const averageTaskTime = tasksWithTime.length > 0
      ? tasksWithTime.reduce((sum, t) => sum + t.getActualHours()!, 0) / tasksWithTime.length
      : 0

    // 시간 예측 정확도
    const tasksWithEstimates = completedTasks.filter(t => 
      t.getEstimatedHours() !== undefined && t.getActualHours() !== undefined
    )
    const timeAccuracy = tasksWithEstimates.length > 0
      ? tasksWithEstimates.reduce((sum, task) => {
          const estimated = task.getEstimatedHours()!
          const actual = task.getActualHours()!
          const accuracy = estimated > 0 ? Math.min(estimated / actual, actual / estimated) : 0
          return sum + accuracy
        }, 0) / tasksWithEstimates.length * 100
      : 100

    // 지연된 항목
    const overdueProjects = assignedProjects.filter(p => p.isOverdue()).length
    const overdueTasks = assignedTasks.filter(t => t.isOverdue()).length

    // 재작업률 (cancelled -> todo 변경 패턴으로 추정)
    const reworkTasks = assignedTasks.filter(t => t.isCancelled()).length
    const taskReworkRate = assignedTasks.length > 0 
      ? (reworkTasks / assignedTasks.length) * 100 
      : 0

    // 평균 작업 우선순위
    const priorityScores = { low: 1, medium: 2, high: 3, urgent: 4 }
    const averagePriorityScore = assignedTasks.length > 0
      ? assignedTasks.reduce((sum, t) => sum + priorityScores[t.getPriority()], 0) / assignedTasks.length
      : 2

    const priorityLabels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Urgent' }
    const averageTaskPriority = priorityLabels[Math.round(averagePriorityScore) as keyof typeof priorityLabels]

    // 정시 완료율
    const tasksWithDueDate = completedTasks.filter(t => t.getDueDate() !== undefined)
    const onTimeCompletions = tasksWithDueDate.filter(task => {
      const dueDate = task.getDueDate()!
      return task.getUpdatedAt() <= dueDate
    }).length
    const onTimeCompletionRate = tasksWithDueDate.length > 0 
      ? (onTimeCompletions / tasksWithDueDate.length) * 100 
      : 100

    return {
      overview: {
        assignedProjects: assignedProjects.length,
        assignedTasks: assignedTasks.length,
        completedTasks: completedTasks.length,
        overdueItems: overdueProjects + overdueTasks
      },
      completion: {
        tasksCompletedToday,
        tasksCompletedThisWeek,
        tasksCompletedThisMonth,
        completionStreak
      },
      time: {
        averageTaskTime: Math.round(averageTaskTime * 10) / 10,
        timeEstimateAccuracy: Math.round(timeAccuracy),
        mostProductiveTimeOfDay: '09:00-12:00', // 실제로는 완료 시간 분석 필요
        totalHoursWorked: Math.round(tasksWithTime.reduce((sum, t) => sum + t.getActualHours()!, 0))
      },
      quality: {
        taskReworkRate: Math.round(taskReworkRate),
        averageTaskPriority,
        onTimeCompletionRate: Math.round(onTimeCompletionRate)
      }
    }
  }

  /**
   * 프로젝트 건강도 분석
   */
  async getProjectHealthMetrics(projectId: string): Promise<ProjectHealthMetrics> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다')
    }

    const tasks = await this.taskRepository.findByProjectId(projectId)
    
    // 진행률 점수 (0-100)
    const progressScore = project.getProgress()
    const progressStatus = progressScore >= 80 ? 'good' : progressScore >= 50 ? 'warning' : 'critical'
    
    // 일정 점수
    let timelineScore = 100
    let timelineStatus = 'good'
    
    if (project.isOverdue()) {
      timelineScore = 0
      timelineStatus = 'critical'
    } else if (project.getEndDate()) {
      const daysRemaining = project.getDaysRemaining()
      if (daysRemaining !== null && daysRemaining < 3) {
        timelineScore = 30
        timelineStatus = 'critical'
      } else if (daysRemaining !== null && daysRemaining < 7) {
        timelineScore = 60
        timelineStatus = 'warning'
      }
    }

    // 워크로드 점수
    const totalTasks = tasks.length
    const inProgressTasks = tasks.filter(t => t.isInProgress()).length
    const todoTasks = tasks.filter(t => t.isTodo()).length
    
    let workloadScore = 100
    let workloadStatus = 'good'
    
    const activeTasks = inProgressTasks + todoTasks
    if (totalTasks > 0) {
      const workloadRatio = activeTasks / totalTasks
      if (workloadRatio > 0.8) {
        workloadScore = 40
        workloadStatus = 'critical'
      } else if (workloadRatio > 0.6) {
        workloadScore = 70
        workloadStatus = 'warning'
      }
    }

    // 품질 점수
    const overdueTasks = tasks.filter(t => t.isOverdue()).length
    const cancelledTasks = tasks.filter(t => t.isCancelled()).length
    
    let qualityScore = 100
    let qualityStatus = 'good'
    
    if (totalTasks > 0) {
      const problemTasksRatio = (overdueTasks + cancelledTasks) / totalTasks
      if (problemTasksRatio > 0.2) {
        qualityScore = 30
        qualityStatus = 'critical'
      } else if (problemTasksRatio > 0.1) {
        qualityScore = 60
        qualityStatus = 'warning'
      }
    }

    // 가중 평균 점수 계산
    const factors = {
      progress: { score: progressScore, weight: 0.3, status: progressStatus },
      timeline: { score: timelineScore, weight: 0.3, status: timelineStatus },
      workload: { score: workloadScore, weight: 0.2, status: workloadStatus },
      quality: { score: qualityScore, weight: 0.2, status: qualityStatus }
    }

    const totalScore = Object.values(factors).reduce(
      (sum, factor) => sum + (factor.score * factor.weight), 0
    )

    // 건강도 판정
    let health: 'healthy' | 'at_risk' | 'critical'
    if (totalScore >= 70) health = 'healthy'
    else if (totalScore >= 40) health = 'at_risk'
    else health = 'critical'

    // 권고사항 생성
    const recommendations: string[] = []
    const riskFactors: string[] = []

    if (progressScore < 50) {
      recommendations.push('프로젝트 진행률이 낮습니다. 작업 배분을 검토해보세요.')
      riskFactors.push('낮은 진행률')
    }
    
    if (timelineStatus === 'critical') {
      recommendations.push('일정이 지연되었습니다. 우선순위를 재조정하세요.')
      riskFactors.push('일정 지연')
    }
    
    if (workloadStatus === 'critical') {
      recommendations.push('너무 많은 작업이 진행 중입니다. 작업량을 분산시키세요.')
      riskFactors.push('과도한 워크로드')
    }
    
    if (qualityStatus === 'critical') {
      recommendations.push('작업 품질에 문제가 있습니다. 프로세스를 점검해보세요.')
      riskFactors.push('품질 문제')
    }

    if (recommendations.length === 0) {
      recommendations.push('프로젝트가 순조롭게 진행되고 있습니다.')
    }

    return {
      health,
      score: Math.round(totalScore),
      factors,
      recommendations,
      riskFactors
    }
  }

  /**
   * 완료 연속 기록 계산
   */
  private calculateCompletionStreak(completedTasks: Task[]): number {
    const sortedTasks = completedTasks
      .sort((a, b) => b.getUpdatedAt().getTime() - a.getUpdatedAt().getTime())

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const task of sortedTasks) {
      const taskDate = new Date(task.getUpdatedAt())
      taskDate.setHours(0, 0, 0, 0)

      if (this.isSameDay(taskDate, currentDate) || 
          taskDate.getTime() === currentDate.getTime() - (24 * 60 * 60 * 1000)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  /**
   * 같은 날인지 확인
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }
}