import { GoalRepository } from '@/lib/core/infrastructure/repositories/GoalRepository'
import { ProjectRepository } from '@/lib/core/infrastructure/repositories/ProjectRepository'
import { TaskRepository } from '@/lib/core/infrastructure/repositories/TaskRepository'
import type { Goal } from '@/lib/core/domain/entities/Goal'
import type { Project } from '@/lib/core/domain/entities/Project'
import type { Task } from '@/lib/core/domain/entities/Task'

interface ProgressMetrics {
  totalItems: number
  completedItems: number
  progress: number
  completionRate: number
}

interface ProjectProgress extends ProgressMetrics {
  projectId: string
  title: string
  status: string
  estimatedHours?: number
  actualHours?: number
  timeVariance?: number
}

interface GoalProgress extends ProgressMetrics {
  goalId: string
  title: string
  status: string
  projects: ProjectProgress[]
  overallTimeVariance?: number
}

interface TeamMetrics {
  goals: {
    total: number
    active: number
    completed: number
    archived: number
    averageProgress: number
  }
  projects: {
    total: number
    planning: number
    in_progress: number
    review: number
    completed: number
    on_hold: number
    overdue: number
  }
  tasks: {
    total: number
    todo: number
    in_progress: number
    review: number
    done: number
    cancelled: number
    overdue: number
  }
  productivity: {
    averageTasksPerProject: number
    averageProjectsPerGoal: number
    completionVelocity: number
    timeAccuracy: number
  }
}

export class ProgressCalculationService {
  private goalRepository = new GoalRepository()
  private projectRepository = new ProjectRepository()
  private taskRepository = new TaskRepository()

  /**
   * 작업 기반으로 프로젝트 진행률 계산
   */
  async calculateProjectProgress(projectId: string): Promise<number> {
    const tasks = await this.taskRepository.findByProjectId(projectId)
    
    if (tasks.length === 0) {
      return 0
    }

    const completedTasks = tasks.filter(task => task.isDone()).length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  /**
   * 프로젝트 기반으로 목표 진행률 계산
   */
  async calculateGoalProgress(goalId: string): Promise<number> {
    const projects = await this.projectRepository.findByGoalId(goalId)
    
    if (projects.length === 0) {
      return 0
    }

    // 각 프로젝트의 진행률을 가져와서 평균 계산
    const projectProgresses = await Promise.all(
      projects.map(async (project) => {
        const calculatedProgress = await this.calculateProjectProgress(project.getId())
        return calculatedProgress
      })
    )

    const totalProgress = projectProgresses.reduce((sum, progress) => sum + progress, 0)
    return Math.round(totalProgress / projects.length)
  }

  /**
   * 프로젝트 진행률 업데이트 및 목표 진행률 자동 업데이트
   */
  async updateProjectProgressAndGoal(projectId: string): Promise<{ 
    projectProgress: number; 
    goalProgress: number;
    project: Project;
    goal: Goal;
  }> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다')
    }

    // 프로젝트 진행률 계산 및 업데이트
    const calculatedProjectProgress = await this.calculateProjectProgress(projectId)
    const updatedProject = await this.projectRepository.updateProgress(projectId, calculatedProjectProgress)

    // 목표 진행률 계산 및 업데이트
    const goalId = project.getGoalId()
    const calculatedGoalProgress = await this.calculateGoalProgress(goalId)
    const updatedGoal = await this.goalRepository.updateProgress(goalId, calculatedGoalProgress)

    return {
      projectProgress: calculatedProjectProgress,
      goalProgress: calculatedGoalProgress,
      project: updatedProject,
      goal: updatedGoal
    }
  }

  /**
   * 작업 상태 변경 시 상위 엔티티들의 진행률 자동 업데이트
   */
  async updateProgressOnTaskStatusChange(taskId: string): Promise<{
    taskProgress: Task;
    projectProgress: number;
    goalProgress: number;
  }> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) {
      throw new Error('작업을 찾을 수 없습니다')
    }

    const projectId = task.getProjectId()
    const progressUpdate = await this.updateProjectProgressAndGoal(projectId)

    return {
      taskProgress: task,
      projectProgress: progressUpdate.projectProgress,
      goalProgress: progressUpdate.goalProgress
    }
  }

  /**
   * 팀 전체 메트릭 계산
   */
  async calculateTeamMetrics(teamId: string): Promise<TeamMetrics> {
    const goals = await this.goalRepository.findByTeamId(teamId)
    const goalIds = goals.map(goal => goal.getId())
    
    // 모든 프로젝트와 작업 가져오기
    const allProjects = await Promise.all(
      goalIds.map(goalId => this.projectRepository.findByGoalId(goalId))
    ).then(results => results.flat())

    const allTasks = await Promise.all(
      allProjects.map(project => this.taskRepository.findByProjectId(project.getId()))
    ).then(results => results.flat())

    // 지연된 항목들
    const overdueProjects = await this.projectRepository.findOverdue()
    const overdueTasks = await this.taskRepository.findOverdue()

    // 목표 메트릭
    const goalStats = {
      total: goals.length,
      active: goals.filter(g => g.isActive()).length,
      completed: goals.filter(g => g.isCompleted()).length,
      archived: goals.filter(g => g.isArchived()).length,
      averageProgress: goals.length > 0 
        ? Math.round(goals.reduce((sum, goal) => sum + goal.getProgress(), 0) / goals.length)
        : 0
    }

    // 프로젝트 메트릭
    const projectStats = {
      total: allProjects.length,
      planning: allProjects.filter(p => p.isPlanning()).length,
      in_progress: allProjects.filter(p => p.isInProgress()).length,
      review: allProjects.filter(p => p.isInReview()).length,
      completed: allProjects.filter(p => p.isCompleted()).length,
      on_hold: allProjects.filter(p => p.isOnHold()).length,
      overdue: overdueProjects.filter(p => 
        goalIds.includes(p.getGoalId())
      ).length
    }

    // 작업 메트릭
    const taskStats = {
      total: allTasks.length,
      todo: allTasks.filter(t => t.isTodo()).length,
      in_progress: allTasks.filter(t => t.isInProgress()).length,
      review: allTasks.filter(t => t.isInReview()).length,
      done: allTasks.filter(t => t.isDone()).length,
      cancelled: allTasks.filter(t => t.isCancelled()).length,
      overdue: overdueTasks.length
    }

    // 생산성 메트릭
    const tasksWithEstimates = allTasks.filter(t => 
      t.getEstimatedHours() !== undefined && t.getActualHours() !== undefined
    )
    
    const timeAccuracy = tasksWithEstimates.length > 0
      ? tasksWithEstimates.reduce((sum, task) => {
          const estimated = task.getEstimatedHours()!
          const actual = task.getActualHours()!
          const accuracy = estimated > 0 ? Math.min(estimated / actual, actual / estimated) : 0
          return sum + accuracy
        }, 0) / tasksWithEstimates.length
      : 0

    const productivityStats = {
      averageTasksPerProject: allProjects.length > 0 
        ? Math.round((allTasks.length / allProjects.length) * 10) / 10
        : 0,
      averageProjectsPerGoal: goals.length > 0 
        ? Math.round((allProjects.length / goals.length) * 10) / 10
        : 0,
      completionVelocity: this.calculateCompletionVelocity(allTasks),
      timeAccuracy: Math.round(timeAccuracy * 100)
    }

    return {
      goals: goalStats,
      projects: projectStats,
      tasks: taskStats,
      productivity: productivityStats
    }
  }

  /**
   * 목표별 상세 진행률 정보
   */
  async getGoalDetailedProgress(goalId: string): Promise<GoalProgress> {
    const goal = await this.goalRepository.findById(goalId)
    if (!goal) {
      throw new Error('목표를 찾을 수 없습니다')
    }

    const projects = await this.projectRepository.findByGoalId(goalId)
    
    const projectProgresses: ProjectProgress[] = await Promise.all(
      projects.map(async (project) => {
        const tasks = await this.taskRepository.findByProjectId(project.getId())
        const completedTasks = tasks.filter(task => task.isDone()).length
        
        const totalEstimated = tasks.reduce((sum, task) => 
          sum + (task.getEstimatedHours() || 0), 0)
        const totalActual = tasks.reduce((sum, task) => 
          sum + (task.getActualHours() || 0), 0)
        
        return {
          projectId: project.getId(),
          title: project.getTitle(),
          status: project.getStatus(),
          totalItems: tasks.length,
          completedItems: completedTasks,
          progress: project.getProgress(),
          completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
          estimatedHours: totalEstimated > 0 ? totalEstimated : undefined,
          actualHours: totalActual > 0 ? totalActual : undefined,
          timeVariance: totalEstimated > 0 && totalActual > 0 
            ? totalActual - totalEstimated 
            : undefined
        }
      })
    )

    const completedProjects = projects.filter(p => p.isCompleted()).length
    const overallTimeVariance = projectProgresses
      .filter(p => p.timeVariance !== undefined)
      .reduce((sum, p) => sum + p.timeVariance!, 0)

    return {
      goalId: goal.getId(),
      title: goal.getTitle(),
      status: goal.getStatus(),
      totalItems: projects.length,
      completedItems: completedProjects,
      progress: goal.getProgress(),
      completionRate: projects.length > 0 ? (completedProjects / projects.length) * 100 : 0,
      projects: projectProgresses,
      overallTimeVariance: overallTimeVariance !== 0 ? overallTimeVariance : undefined
    }
  }

  /**
   * 완료 속도 계산 (최근 30일 기준)
   */
  private calculateCompletionVelocity(tasks: Task[]): number {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentCompletedTasks = tasks.filter(task => 
      task.isDone() && task.getUpdatedAt() >= thirtyDaysAgo
    )

    // 하루 평균 완료 작업 수
    return Math.round((recentCompletedTasks.length / 30) * 10) / 10
  }

  /**
   * 시간 예측 정확도 분석
   */
  async getTimeEstimateAccuracy(projectId?: string): Promise<{
    totalTasks: number
    tasksWithEstimates: number
    averageVariance: number
    accuracyRate: number
    underEstimatedTasks: number
    overEstimatedTasks: number
  }> {
    const tasks = projectId 
      ? await this.taskRepository.findByProjectId(projectId)
      : [] // 전체 작업은 별도 메서드로 구현 필요

    const tasksWithBothHours = tasks.filter(t => 
      t.getEstimatedHours() !== undefined && t.getActualHours() !== undefined
    )

    if (tasksWithBothHours.length === 0) {
      return {
        totalTasks: tasks.length,
        tasksWithEstimates: 0,
        averageVariance: 0,
        accuracyRate: 0,
        underEstimatedTasks: 0,
        overEstimatedTasks: 0
      }
    }

    const variances = tasksWithBothHours.map(task => {
      const estimated = task.getEstimatedHours()!
      const actual = task.getActualHours()!
      return actual - estimated
    })

    const averageVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length
    
    const accurateTasks = tasksWithBothHours.filter(task => {
      const variance = task.getVarianceHours()
      return variance !== null && Math.abs(variance) <= (task.getEstimatedHours()! * 0.2) // 20% 오차 범위
    })

    return {
      totalTasks: tasks.length,
      tasksWithEstimates: tasksWithBothHours.length,
      averageVariance: Math.round(averageVariance * 10) / 10,
      accuracyRate: Math.round((accurateTasks.length / tasksWithBothHours.length) * 100),
      underEstimatedTasks: tasksWithBothHours.filter(t => t.isUnderEstimate()).length,
      overEstimatedTasks: tasksWithBothHours.filter(t => t.isOverEstimate()).length
    }
  }
}