import { Goal, Project, Task } from '@/lib/core/domain/entities'
import { createGoalSchema, createProjectSchema, createTaskSchema } from '@/lib/core/domain/schemas'
import { ProgressCalculationService } from '@/lib/core/services'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
      select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn() })) })),
      update: jest.fn(() => ({ eq: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })) })),
      delete: jest.fn(() => ({ eq: jest.fn() })),
    }))
  }))
}))

describe('Core Data Models Integration Tests', () => {
  const mockData = {
    goal: {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      teamId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      title: 'Test Goal',
      description: 'Test goal description',
      createdBy: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
    },
    project: {
      id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
      goalId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      title: 'Test Project',
      description: 'Test project description',
      createdBy: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      assignedTo: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
      priority: 'high' as const,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
    },
    task: {
      id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
      projectId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
      title: 'Test Task',
      description: 'Test task description',
      createdBy: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      assignedTo: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
      estimatedHours: 8,
      position: 0,
    }
  }

  describe('Domain Entities', () => {
    describe('Goal Entity', () => {
      it('should create goal with factory method', () => {
        const goal = Goal.create(mockData.goal)
        
        expect(goal.getId()).toBe(mockData.goal.id)
        expect(goal.getTeamId()).toBe(mockData.goal.teamId)
        expect(goal.getTitle()).toBe(mockData.goal.title)
        expect(goal.getDescription()).toBe(mockData.goal.description)
        expect(goal.getStatus()).toBe('active')
        expect(goal.getProgress()).toBe(0)
        expect(goal.getCreatedBy()).toBe(mockData.goal.createdBy)
        expect(goal.getStartDate()).toEqual(mockData.goal.startDate)
        expect(goal.getEndDate()).toEqual(mockData.goal.endDate)
        expect(goal.isActive()).toBe(true)
        expect(goal.isCompleted()).toBe(false)
      })

      it('should update goal progress and auto-complete at 100%', () => {
        const goal = Goal.create(mockData.goal)
        
        goal.updateProgress(50)
        expect(goal.getProgress()).toBe(50)
        expect(goal.isActive()).toBe(true)
        
        goal.updateProgress(100)
        expect(goal.getProgress()).toBe(100)
        expect(goal.isCompleted()).toBe(true)
        expect(goal.isActive()).toBe(false)
      })

      it('should calculate days remaining correctly', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 10)
        
        const goalData = { ...mockData.goal, endDate: futureDate }
        const goal = Goal.create(goalData)
        
        const daysRemaining = goal.getDaysRemaining()
        expect(daysRemaining).toBe(10)
      })

      it('should detect overdue goals', () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 5)
        
        const goalData = { ...mockData.goal, endDate: pastDate }
        const goal = Goal.create(goalData)
        
        expect(goal.isOverdue()).toBe(true)
      })
    })

    describe('Project Entity', () => {
      it('should create project with factory method', () => {
        const project = Project.create(mockData.project)
        
        expect(project.getId()).toBe(mockData.project.id)
        expect(project.getGoalId()).toBe(mockData.project.goalId)
        expect(project.getTitle()).toBe(mockData.project.title)
        expect(project.getDescription()).toBe(mockData.project.description)
        expect(project.getStatus()).toBe('planning')
        expect(project.getPriority()).toBe('high')
        expect(project.getProgress()).toBe(0)
        expect(project.getCreatedBy()).toBe(mockData.project.createdBy)
        expect(project.getAssignedTo()).toBe(mockData.project.assignedTo)
        expect(project.isPlanning()).toBe(true)
        expect(project.isCompleted()).toBe(false)
      })

      it('should update project progress and auto-complete at 100%', () => {
        const project = Project.create(mockData.project)
        
        project.updateProgress(75)
        expect(project.getProgress()).toBe(75)
        expect(project.isPlanning()).toBe(true)
        
        project.updateProgress(100)
        expect(project.getProgress()).toBe(100)
        expect(project.isCompleted()).toBe(true)
      })

      it('should assign and unassign users', () => {
        const project = Project.create(mockData.project)
        
        expect(project.isAssigned()).toBe(true)
        expect(project.isAssignedTo('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b')).toBe(true)
        
        project.unassign()
        expect(project.isAssigned()).toBe(false)
        expect(project.getAssignedTo()).toBeUndefined()
        
        project.assignTo('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c')
        expect(project.isAssignedTo('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c')).toBe(true)
      })

      it('should calculate project duration', () => {
        const project = Project.create(mockData.project)
        const duration = project.getDuration()
        
        // Duration between 2025-01-01 and 2025-06-30 should be about 180 days
        expect(duration).toBeGreaterThanOrEqual(180)
        expect(duration).toBeLessThan(185)
      })
    })

    describe('Task Entity', () => {
      it('should create task with factory method', () => {
        const task = Task.create(mockData.task)
        
        expect(task.getId()).toBe(mockData.task.id)
        expect(task.getProjectId()).toBe(mockData.task.projectId)
        expect(task.getTitle()).toBe(mockData.task.title)
        expect(task.getDescription()).toBe(mockData.task.description)
        expect(task.getStatus()).toBe('todo')
        expect(task.getPriority()).toBe('medium')
        expect(task.getCreatedBy()).toBe(mockData.task.createdBy)
        expect(task.getAssignedTo()).toBe(mockData.task.assignedTo)
        expect(task.getDueDate()).toEqual(mockData.task.dueDate)
        expect(task.getEstimatedHours()).toBe(mockData.task.estimatedHours)
        expect(task.getPosition()).toBe(mockData.task.position)
        expect(task.isTodo()).toBe(true)
        expect(task.isDone()).toBe(false)
      })

      it('should handle task status transitions', () => {
        const task = Task.create(mockData.task)
        
        task.updateStatus('in_progress')
        expect(task.isInProgress()).toBe(true)
        expect(task.isTodo()).toBe(false)
        
        task.updateStatus('done')
        expect(task.isDone()).toBe(true)
        expect(task.isInProgress()).toBe(false)
        expect(task.isCompleted()).toBe(true)
      })

      it('should calculate time variance', () => {
        const task = Task.create(mockData.task)
        
        task.updateActualHours(10)
        const variance = task.getVarianceHours()
        expect(variance).toBe(2) // 10 actual - 8 estimated = 2
        expect(task.isOverEstimate()).toBe(true)
        expect(task.isUnderEstimate()).toBe(false)
      })

      it('should handle task positioning', () => {
        const task = Task.create(mockData.task)
        
        expect(task.getPosition()).toBe(0)
        
        task.moveToPosition(5)
        expect(task.getPosition()).toBe(5)
        
        task.moveUp()
        expect(task.getPosition()).toBe(4)
        
        task.moveDown()
        expect(task.getPosition()).toBe(5)
      })

      it('should detect overdue tasks', () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 2)
        
        const taskData = { ...mockData.task, dueDate: pastDate }
        const task = Task.create(taskData)
        
        expect(task.isOverdue()).toBe(true)
      })

      it('should calculate days until due', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7)
        
        const taskData = { ...mockData.task, dueDate: futureDate }
        const task = Task.create(taskData)
        
        const daysUntilDue = task.getDaysUntilDue()
        expect(daysUntilDue).toBe(7)
      })
    })
  })

  describe('Schema Validation', () => {
    it('should validate goal creation schema', () => {
      const validGoalData = {
        teamId: mockData.goal.teamId,
        title: mockData.goal.title,
        description: mockData.goal.description,
        createdBy: mockData.goal.createdBy,
        startDate: mockData.goal.startDate,
        endDate: mockData.goal.endDate,
      }

      const result = createGoalSchema.safeParse(validGoalData)
      if (!result.success) {
        console.log('Goal schema validation errors:', result.error.issues)
      }
      expect(result.success).toBe(true)
    })

    it('should reject invalid goal data', () => {
      const invalidGoalData = {
        teamId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        title: '', // Empty title should fail
        createdBy: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      }

      const result = createGoalSchema.safeParse(invalidGoalData)
      expect(result.success).toBe(false)
    })

    it('should validate project creation schema', () => {
      const validProjectData = {
        goalId: mockData.project.goalId,
        title: mockData.project.title,
        description: mockData.project.description,
        priority: mockData.project.priority,
        createdBy: mockData.project.createdBy,
        assignedTo: mockData.project.assignedTo,
        startDate: mockData.project.startDate,
        endDate: mockData.project.endDate,
      }

      const result = createProjectSchema.safeParse(validProjectData)
      if (!result.success) {
        console.log('Project schema validation errors:', result.error.issues)
      }
      expect(result.success).toBe(true)
    })

    it('should validate task creation schema', () => {
      const validTaskData = {
        projectId: mockData.task.projectId,
        title: mockData.task.title,
        description: mockData.task.description,
        priority: mockData.task.priority,
        createdBy: mockData.task.createdBy,
        assignedTo: mockData.task.assignedTo,
        dueDate: mockData.task.dueDate,
        estimatedHours: mockData.task.estimatedHours,
        position: mockData.task.position,
      }

      const result = createTaskSchema.safeParse(validTaskData)
      if (!result.success) {
        console.log('Task schema validation errors:', result.error.issues)
      }
      expect(result.success).toBe(true)
    })

    it('should reject date validation errors', () => {
      const invalidDateData = {
        teamId: mockData.goal.teamId,
        title: mockData.goal.title,
        createdBy: mockData.goal.createdBy,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'), // End date before start date
      }

      const result = createGoalSchema.safeParse(invalidDateData)
      expect(result.success).toBe(false)
    })
  })

  describe('Business Logic Integration', () => {
    it('should handle hierarchical progress calculation concept', async () => {
      // Note: This is a conceptual test since we're mocking Supabase
      // In a real environment, this would test the actual database integration
      
      const goal = Goal.create(mockData.goal)
      const project = Project.create(mockData.project)
      const task1 = Task.create({ ...mockData.task, id: 'task-1' })
      const task2 = Task.create({ ...mockData.task, id: 'task-2', title: 'Task 2' })
      
      // Simulate task completion
      task1.updateStatus('done')
      task2.updateStatus('in_progress')
      
      // In a real scenario, this would trigger:
      // 1. Task completion updates project progress to 50%
      // 2. Project progress update cascades to goal progress
      
      expect(task1.isDone()).toBe(true)
      expect(task2.isInProgress()).toBe(true)
      
      // Mock progress calculation logic
      const completedTasks = [task1, task2].filter(t => t.isDone()).length
      const totalTasks = 2
      const projectProgress = Math.round((completedTasks / totalTasks) * 100)
      
      expect(projectProgress).toBe(50)
    })

    it('should maintain data consistency across entities', () => {
      const goal = Goal.create(mockData.goal)
      const project = Project.create(mockData.project)
      const task = Task.create(mockData.task)
      
      // Verify relationships
      expect(project.getGoalId()).toBe(goal.getId())
      expect(task.getProjectId()).toBe(project.getId())
      
      // Verify entity states
      expect(goal.isActive()).toBe(true)
      expect(project.isPlanning()).toBe(true)
      expect(task.isTodo()).toBe(true)
      
      // Verify immutability preservation
      const originalGoalId = goal.getId()
      const originalProjectId = project.getId()
      const originalTaskId = task.getId()
      
      goal.updateTitle('Updated Goal')
      project.updateTitle('Updated Project')
      task.updateTitle('Updated Task')
      
      expect(goal.getId()).toBe(originalGoalId)
      expect(project.getId()).toBe(originalProjectId)
      expect(task.getId()).toBe(originalTaskId)
    })

    it('should handle priority and status workflows correctly', () => {
      const task = Task.create(mockData.task)
      
      // Test priority changes
      expect(task.getPriority()).toBe('medium')
      task.updatePriority('urgent')
      expect(task.getPriority()).toBe('urgent')
      expect(task.isUrgent()).toBe(true)
      expect(task.isHighPriority()).toBe(true)
      
      // Test status workflow
      task.updateStatus('in_progress')
      expect(task.isInProgress()).toBe(true)
      
      task.updateStatus('review')
      expect(task.isInReview()).toBe(true)
      
      task.updateStatus('done')
      expect(task.isDone()).toBe(true)
      expect(task.isCompleted()).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle boundary values correctly', () => {
      const goal = Goal.create(mockData.goal)
      const project = Project.create(mockData.project)
      const task = Task.create(mockData.task)
      
      // Test progress boundaries
      goal.updateProgress(0)
      expect(goal.getProgress()).toBe(0)
      
      goal.updateProgress(100)
      expect(goal.getProgress()).toBe(100)
      expect(goal.isCompleted()).toBe(true)
      
      // Test position boundaries
      task.updatePosition(0)
      expect(task.getPosition()).toBe(0)
      
      task.moveUp() // Should not go below 0
      expect(task.getPosition()).toBe(0)
      
      // Test time calculations
      task.updateEstimatedHours(0.1) // Minimum allowed
      expect(task.getEstimatedHours()).toBe(0.1)
      
      task.updateActualHours(0.1)
      expect(task.getActualHours()).toBe(0.1)
    })

    it('should handle null and undefined values gracefully', () => {
      const minimalGoal = Goal.create({
        id: 'goal-minimal',
        teamId: 'team-1',
        title: 'Minimal Goal',
        createdBy: 'user-1'
      })
      
      expect(minimalGoal.getDescription()).toBeUndefined()
      expect(minimalGoal.getStartDate()).toBeUndefined()
      expect(minimalGoal.getEndDate()).toBeUndefined()
      expect(minimalGoal.getDaysRemaining()).toBeNull()
      expect(minimalGoal.isOverdue()).toBe(false)
      
      const minimalTask = Task.create({
        id: 'task-minimal',
        projectId: 'project-1',
        title: 'Minimal Task',
        createdBy: 'user-1'
      })
      
      expect(minimalTask.getDescription()).toBeUndefined()
      expect(minimalTask.getAssignedTo()).toBeUndefined()
      expect(minimalTask.getDueDate()).toBeUndefined()
      expect(minimalTask.getEstimatedHours()).toBeUndefined()
      expect(minimalTask.getActualHours()).toBeUndefined()
      expect(minimalTask.getVarianceHours()).toBeNull()
      expect(minimalTask.getDaysUntilDue()).toBeNull()
    })
  })
})

describe('Progress Calculation Service', () => {
  it('should be instantiable', () => {
    const service = new ProgressCalculationService()
    expect(service).toBeInstanceOf(ProgressCalculationService)
  })
})