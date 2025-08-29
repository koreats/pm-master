// Domain Entities
export * from './domain/entities'

// Infrastructure
export * from './infrastructure/repositories'

// Application Layer
export * from './actions'
export * from './hooks'
export * from './services'

// Core Integration Point
export { ProgressCalculationService, MetricsService } from './services'
export { GoalRepository, ProjectRepository, TaskRepository } from './infrastructure/repositories'
export { 
  Goal, Project, Task, BaseEntity,
  type GoalProps, type ProjectProps, type TaskProps, type CommonProps
} from './domain/entities'
export {
  goalKeys, projectKeys, taskKeys,
  useGoals, useProjects, useTasks,
  useCreateGoal, useUpdateGoal, useDeleteGoal,
  useCreateProject, useUpdateProject, useDeleteProject,
  useCreateTask, useUpdateTask, useDeleteTask
} from './hooks'