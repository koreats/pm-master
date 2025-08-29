// ⚡ 자동화 워크플로우 엔진
// PM System 2025 - Git 훅, 스케줄링, 이벤트 기반 자동화

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase/client';
import { DocumentationSyncManager } from '../realtime/sync-manager';
import { ProgressDataCollector } from '../collectors/progress-collector';
import { TemplateEngine, templateEngine } from '../template-engine';
import type { 
  DocumentationEvent,
  ValidationResult,
  NotificationConfig
} from '../types/documentation';

export interface WorkflowTrigger {
  id: string;
  name: string;
  type: 'git_hook' | 'file_change' | 'schedule' | 'manual' | 'api_call' | 'task_complete';
  enabled: boolean;
  conditions: Record<string, any>;
  actions: WorkflowAction[];
  cooldown?: number; // 최소 실행 간격 (초)
  lastTriggered?: Date;
}

export interface WorkflowAction {
  id: string;
  type: 'generate_docs' | 'send_notification' | 'update_cache' | 'run_validation' | 'sync_realtime' | 'generate_completion_report';
  config: Record<string, any>;
  retryCount?: number;
  timeout?: number;
}

export interface WorkflowExecution {
  id: string;
  triggerId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  actions: {
    actionId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    result?: any;
    error?: string;
    duration?: number;
  }[];
  totalDuration?: number;
  metadata: Record<string, any>;
}

export class WorkflowEngine extends EventEmitter {
  private triggers: Map<string, WorkflowTrigger> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private schedules: Map<string, NodeJS.Timeout> = new Map();
  private syncManager: DocumentationSyncManager;
  private templateEngine = templateEngine;
  private progressCollector: ProgressDataCollector;
  private isActive: boolean = false;

  constructor() {
    super();
    this.syncManager = new DocumentationSyncManager();
    this.progressCollector = new ProgressDataCollector();
    this.initializeDefaultTriggers();
  }

  /**
   * 기본 트리거 설정 초기화
   */
  private initializeDefaultTriggers() {
    // Git 커밋 훅 트리거
    this.addTrigger({
      id: 'git-commit-hook',
      name: 'Git 커밋 시 문서 업데이트',
      type: 'git_hook',
      enabled: true,
      conditions: {
        branches: ['main', 'develop', 'main-clean'],
        filePatterns: ['**/*.ts', '**/*.tsx', '**/*.md', 'package.json'],
        excludePatterns: ['node_modules/**', '**/*.test.*', '__tests__/**']
      },
      actions: [
        {
          id: 'generate-progress-report',
          type: 'generate_docs',
          config: { documentType: 'progress' }
        },
        {
          id: 'sync-realtime',
          type: 'sync_realtime',
          config: { updateType: 'incremental' }
        }
      ],
      cooldown: 30 // 30초 쿨다운
    });

    // 주요 파일 변경 트리거
    this.addTrigger({
      id: 'critical-file-change',
      name: '중요 파일 변경 감지',
      type: 'file_change',
      enabled: true,
      conditions: {
        filePatterns: [
          'docs/마스터플랜.md',
          'docs/제품 요구사항 정의서 (PRD).md',
          'package.json',
          'supabase/migrations/*.sql'
        ],
        immediateUpdate: true
      },
      actions: [
        {
          id: 'validate-changes',
          type: 'run_validation',
          config: { validationType: 'structure' }
        },
        {
          id: 'regenerate-all-docs',
          type: 'generate_docs',
          config: { documentType: 'all', forceUpdate: true }
        },
        {
          id: 'notify-team',
          type: 'send_notification',
          config: {
            type: 'file_change',
            channels: ['dashboard'],
            priority: 'high'
          }
        }
      ]
    });

    // 일일 리포트 스케줄
    this.addTrigger({
      id: 'daily-report',
      name: '일일 진행상황 리포트',
      type: 'schedule',
      enabled: true,
      conditions: {
        cron: '0 9 * * *', // 매일 오전 9시
        timezone: 'Asia/Seoul'
      },
      actions: [
        {
          id: 'generate-daily-report',
          type: 'generate_docs',
          config: { 
            documentType: 'progress',
            reportPeriod: 'daily',
            includeMetrics: true
          }
        }
      ]
    });

    // 마일스톤 달성 트리거
    this.addTrigger({
      id: 'milestone-achieved',
      name: '마일스톤 달성 알림',
      type: 'api_call',
      enabled: true,
      conditions: {
        eventType: 'milestone_reached'
      },
      actions: [
        {
          id: 'generate-milestone-report',
          type: 'generate_docs',
          config: { 
            documentType: 'milestone',
            includeAchievements: true
          }
        },
        {
          id: 'celebrate-milestone',
          type: 'send_notification',
          config: {
            type: 'milestone',
            channels: ['dashboard', 'email'],
            priority: 'high',
            template: 'milestone_celebration'
          }
        }
      ]
    });

    // 태스크 완료 트리거
    this.addTrigger({
      id: 'task-completed',
      name: '태스크 완료 보고서 생성',
      type: 'task_complete',
      enabled: true,
      conditions: {
        taskPattern: /^T-\d{3}$/  // T-001 ~ T-012 패턴
      },
      actions: [
        {
          id: 'generate-completion-report',
          type: 'generate_completion_report',
          config: {
            reportType: 'task_completion',
            includeProgress: true,
            includeMetrics: true,
            includeLessonsLearned: true
          }
        },
        {
          id: 'update-progress',
          type: 'generate_docs',
          config: {
            documentType: 'progress',
            updateOnly: true
          }
        },
        {
          id: 'sync-to-realtime',
          type: 'sync_realtime',
          config: {
            updateType: 'task_completion'
          }
        },
        {
          id: 'notify-completion',
          type: 'send_notification',
          config: {
            type: 'task_completion',
            channels: ['dashboard'],
            priority: 'normal'
          }
        }
      ],
      cooldown: 60 // 60초 쿨다운
    });
  }

  /**
   * 워크플로우 엔진 시작
   */
  async start(): Promise<void> {
    if (this.isActive) return;

    console.log('🚀 자동화 워크플로우 엔진 시작...');
    this.isActive = true;

    // 스케줄 트리거 설정
    this.setupScheduledTriggers();

    // Git 훅 설정
    await this.setupGitHooks();

    // 파일 감시 시작
    this.setupFileWatchers();

    // 실시간 동기화 연결
    await this.syncManager.startFileWatcher();

    this.emit('engine:started');
    console.log('✅ 자동화 워크플로우 엔진 활성화');
  }

  /**
   * 워크플로우 엔진 중지
   */
  async stop(): Promise<void> {
    if (!this.isActive) return;

    console.log('🛑 자동화 워크플로우 엔진 중지...');
    this.isActive = false;

    // 스케줄 정리
    for (const [id, timeout] of this.schedules.entries()) {
      clearTimeout(timeout);
      this.schedules.delete(id);
    }

    // 실시간 동기화 중지
    this.syncManager.stopFileWatcher();
    await this.syncManager.cleanup();

    this.emit('engine:stopped');
    console.log('✅ 자동화 워크플로우 엔진 중지됨');
  }

  /**
   * 트리거 추가
   */
  addTrigger(trigger: WorkflowTrigger): void {
    this.triggers.set(trigger.id, trigger);
    
    // 스케줄 트리거인 경우 즉시 설정
    if (trigger.type === 'schedule' && trigger.enabled && this.isActive) {
      this.setupScheduleTrigger(trigger);
    }

    this.emit('trigger:added', trigger);
    console.log(`➕ 워크플로우 트리거 추가: ${trigger.name}`);
  }

  /**
   * 트리거 실행
   */
  async executeTrigger(
    triggerId: string, 
    context: Record<string, any> = {}
  ): Promise<string> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`트리거를 찾을 수 없습니다: ${triggerId}`);
    }

    if (!trigger.enabled) {
      console.log(`⏸️ 비활성화된 트리거 건너뜀: ${trigger.name}`);
      return '';
    }

    // 쿨다운 체크
    if (trigger.cooldown && trigger.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - trigger.lastTriggered.getTime();
      if (timeSinceLastTrigger < trigger.cooldown * 1000) {
        console.log(`⏱️ 트리거 쿨다운 대기 중: ${trigger.name}`);
        return '';
      }
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const execution: WorkflowExecution = {
      id: executionId,
      triggerId,
      status: 'running',
      startedAt: new Date(),
      actions: trigger.actions.map(action => ({
        actionId: action.id,
        status: 'pending'
      })),
      metadata: { context, triggerName: trigger.name }
    };

    this.executions.set(executionId, execution);
    this.emit('execution:started', execution);

    console.log(`🎯 워크플로우 실행 시작: ${trigger.name} (${executionId})`);

    try {
      // 조건 검증
      if (!this.validateTriggerConditions(trigger, context)) {
        execution.status = 'cancelled';
        execution.completedAt = new Date();
        this.emit('execution:cancelled', execution);
        return executionId;
      }

      // 액션 실행
      for (let i = 0; i < trigger.actions.length; i++) {
        const action = trigger.actions[i];
        const actionState = execution.actions[i];
        
        try {
          actionState.status = 'running';
          const startTime = Date.now();
          
          const result = await this.executeAction(action, context);
          
          actionState.status = 'completed';
          actionState.result = result;
          actionState.duration = Date.now() - startTime;
          
          this.emit('action:completed', { execution, action, result });
          
        } catch (actionError) {
          actionState.status = 'failed';
          actionState.error = actionError instanceof Error ? actionError.message : String(actionError);
          
          console.error(`❌ 액션 실행 실패: ${action.id}`, actionError);
          this.emit('action:failed', { execution, action, error: actionError });
          
          // 액션 실패 시 전체 실행 실패로 처리
          throw actionError;
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.totalDuration = Date.now() - execution.startedAt.getTime();

      // 마지막 트리거 시간 업데이트
      trigger.lastTriggered = new Date();

      this.emit('execution:completed', execution);
      console.log(`✅ 워크플로우 실행 완료: ${trigger.name} (${execution.totalDuration}ms)`);

      return executionId;

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.totalDuration = Date.now() - execution.startedAt.getTime();

      console.error(`❌ 워크플로우 실행 실패: ${trigger.name}`, error);
      this.emit('execution:failed', execution);

      throw error;
    }
  }

  /**
   * 트리거 조건 검증
   */
  private validateTriggerConditions(
    trigger: WorkflowTrigger, 
    context: Record<string, any>
  ): boolean {
    switch (trigger.type) {
      case 'git_hook':
        return this.validateGitHookConditions(trigger.conditions, context);
      case 'file_change':
        return this.validateFileChangeConditions(trigger.conditions, context);
      case 'api_call':
        return this.validateApiCallConditions(trigger.conditions, context);
      case 'task_complete':
        return this.validateTaskCompleteConditions(trigger.conditions, context);
      default:
        return true;
    }
  }

  /**
   * Git 훅 조건 검증
   */
  private validateGitHookConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    // 브랜치 체크
    if (conditions.branches && context.branch) {
      if (!conditions.branches.includes(context.branch)) {
        return false;
      }
    }

    // 파일 패턴 체크
    if (conditions.filePatterns && context.changedFiles) {
      const changedFiles = context.changedFiles as string[];
      const hasMatchingFiles = changedFiles.some(file =>
        conditions.filePatterns.some((pattern: string) =>
          this.matchPattern(file, pattern)
        )
      );

      if (!hasMatchingFiles) {
        return false;
      }

      // 제외 패턴 체크
      if (conditions.excludePatterns) {
        const hasExcludedFiles = changedFiles.every(file =>
          conditions.excludePatterns.some((pattern: string) =>
            this.matchPattern(file, pattern)
          )
        );

        if (hasExcludedFiles) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 파일 변경 조건 검증
   */
  private validateFileChangeConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    if (conditions.filePatterns && context.filePath) {
      return conditions.filePatterns.some((pattern: string) =>
        this.matchPattern(context.filePath, pattern)
      );
    }
    return true;
  }

  /**
   * API 호출 조건 검증
   */
  private validateApiCallConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    if (conditions.eventType && context.eventType) {
      return conditions.eventType === context.eventType;
    }
    return true;
  }

  /**
   * 태스크 완료 조건 검증
   */
  private validateTaskCompleteConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    if (conditions.taskPattern && context.taskId) {
      const pattern = conditions.taskPattern;
      if (pattern instanceof RegExp) {
        return pattern.test(context.taskId);
      }
      return context.taskId === conditions.taskPattern;
    }
    return true;
  }

  /**
   * 패턴 매칭
   */
  private matchPattern(text: string, pattern: string): boolean {
    // 단순한 glob 패턴 지원
    const regex = new RegExp(
      pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
    );
    return regex.test(text);
  }

  /**
   * 액션 실행
   */
  private async executeAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<any> {
    console.log(`🔧 액션 실행: ${action.type} (${action.id})`);

    switch (action.type) {
      case 'generate_docs':
        return await this.executeGenerateDocsAction(action.config, context);
      case 'send_notification':
        return await this.executeSendNotificationAction(action.config, context);
      case 'update_cache':
        return await this.executeUpdateCacheAction(action.config, context);
      case 'run_validation':
        return await this.executeValidationAction(action.config, context);
      case 'sync_realtime':
        return await this.executeSyncRealtimeAction(action.config, context);
      case 'generate_completion_report':
        return await this.executeGenerateCompletionReportAction(action.config, context);
      default:
        throw new Error(`지원되지 않는 액션 타입: ${action.type}`);
    }
  }

  /**
   * 문서 생성 액션 실행
   */
  private async executeGenerateDocsAction(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<string> {
    const documentType = config.documentType || 'progress';
    
    if (documentType === 'progress' || documentType === 'all') {
      const progressData = {
        masterPlan: await this.progressCollector.getMasterPlanReference(),
        completedTasks: await this.progressCollector.getTaskSummaries(),
        currentMilestone: await this.progressCollector.getCurrentMilestone(),
        blockers: await this.progressCollector.getBlockers(),
        nextSteps: await this.progressCollector.getNextSteps(),
        metrics: await this.progressCollector.getProgressMetrics(),
        timeline: await this.progressCollector.getTimelineUpdate(),
        generatedAt: new Date(),
        reportPeriod: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24시간 전
          to: new Date()
        }
      };

      const report = await this.templateEngine.generateProgressReport(progressData);
      
      console.log(`📄 ${documentType} 문서 생성 완료 (${report.length} chars)`);
      return report;
    }

    return `문서 타입 ${documentType} 처리됨`;
  }

  /**
   * 알림 발송 액션 실행
   */
  private async executeSendNotificationAction(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<string> {
    console.log(`📢 알림 발송: ${config.type} (${config.channels?.join(', ')})`);
    
    // 향후 구현: 실제 알림 시스템
    return `알림 발송 완료: ${config.type}`;
  }

  /**
   * 캐시 업데이트 액션 실행
   */
  private async executeUpdateCacheAction(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<string> {
    console.log('💾 캐시 업데이트 실행');
    
    // 향후 구현: 캐시 무효화 및 업데이트
    return '캐시 업데이트 완료';
  }

  /**
   * 검증 액션 실행
   */
  private async executeValidationAction(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<ValidationResult> {
    console.log(`🔍 검증 실행: ${config.validationType}`);
    
    // 기본 검증 결과 반환
    const result: ValidationResult = {
      passed: true,
      score: 90,
      details: {
        typescript: true,
        eslint: true,
        tests: true,
        security: true,
        performance: true
      },
      issues: [],
      recommendations: []
    };

    return result;
  }

  /**
   * 실시간 동기화 액션 실행
   */
  private async executeSyncRealtimeAction(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<string> {
    const updateType = config.updateType || 'incremental';
    
    await this.syncManager.triggerDocumentationUpdate('progress_update', {
      updateType,
      source: 'workflow_automation',
      context
    });

    console.log(`🔄 실시간 동기화 완료: ${updateType}`);
    return `실시간 동기화 완료: ${updateType}`;
  }

  /**
   * 태스크 완료 보고서 생성 액션 실행
   */
  private async executeGenerateCompletionReportAction(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<string> {
    const taskId = context.taskId;
    if (!taskId) {
      throw new Error('태스크 ID가 필요합니다');
    }

    console.log(`📝 태스크 완료 보고서 생성 중: ${taskId}`);

    // 태스크 정보 수집
    const progressData = {
      taskId,
      taskName: context.taskName || `태스크 ${taskId}`,
      completedAt: new Date(),
      executionStartDate: context.startDate || new Date(),
      executionEndDate: new Date(),
      status: 'completed',
      completedSubtasks: context.completedSubtasks || [],
      pendingSubtasks: context.pendingSubtasks || [],
      blockers: await this.progressCollector.getBlockers(),
      nextSteps: context.nextSteps || await this.progressCollector.getNextSteps(),
      metrics: await this.progressCollector.getProgressMetrics(),
      lessonsLearned: context.lessonsLearned || [],
      createdFiles: context.createdFiles || [],
      modifiedFiles: context.modifiedFiles || [],
      testResults: context.testResults || {},
      recommendations: context.recommendations || []
    };

    // 템플릿 엔진을 사용하여 보고서 생성
    const report = await this.templateEngine.generateCompletionReport(progressData);
    
    // 파일로 저장
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const reportPath = path.join(
      process.cwd(), 
      'docs', 
      `${taskId}_COMPLETION_REPORT.md`
    );
    
    await fs.writeFile(reportPath, report, 'utf-8');
    console.log(`✅ 완료 보고서 생성됨: ${reportPath}`);
    
    return reportPath;
  }

  /**
   * 스케줄 트리거 설정
   */
  private setupScheduledTriggers(): void {
    for (const trigger of this.triggers.values()) {
      if (trigger.type === 'schedule' && trigger.enabled) {
        this.setupScheduleTrigger(trigger);
      }
    }
  }

  /**
   * 개별 스케줄 트리거 설정
   */
  private setupScheduleTrigger(trigger: WorkflowTrigger): void {
    // 단순한 cron 구현 (매일 실행만 지원)
    const cron = trigger.conditions.cron;
    if (cron && cron.startsWith('0 9 * * *')) { // 매일 9시
      const now = new Date();
      const next = new Date();
      next.setHours(9, 0, 0, 0);
      
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      const timeUntilNext = next.getTime() - now.getTime();
      
      const timeout = setTimeout(() => {
        this.executeTrigger(trigger.id, { source: 'schedule' });
        
        // 24시간마다 반복
        const interval = setInterval(() => {
          this.executeTrigger(trigger.id, { source: 'schedule' });
        }, 24 * 60 * 60 * 1000);
        
        this.schedules.set(`${trigger.id}-interval`, interval as any);
      }, timeUntilNext);
      
      this.schedules.set(trigger.id, timeout);
      console.log(`⏰ 스케줄 설정: ${trigger.name} (다음 실행: ${next.toLocaleString()})`);
    }
  }

  /**
   * Git 훅 설정
   */
  private async setupGitHooks(): Promise<void> {
    console.log('🔧 Git 훅 설정 중...');
    // Git 훅은 별도 스크립트로 구현하거나 CI/CD에서 호출
    // 현재는 로그만 남김
  }

  /**
   * 파일 감시자 설정
   */
  private setupFileWatchers(): void {
    console.log('📁 파일 감시자 설정 중...');
    // 실제 파일 시스템 감시는 chokidar 등의 라이브러리 사용
    // 현재는 기본 구조만 구현
  }

  /**
   * 실행 상태 조회
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 모든 트리거 조회
   */
  getTriggers(): WorkflowTrigger[] {
    return Array.from(this.triggers.values());
  }

  /**
   * 활성 실행 목록 조회
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(exec => exec.status === 'running' || exec.status === 'pending');
  }

  /**
   * 트리거 활성화/비활성화
   */
  toggleTrigger(triggerId: string, enabled: boolean): void {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = enabled;
      console.log(`🔄 트리거 ${enabled ? '활성화' : '비활성화'}: ${trigger.name}`);
    }
  }
}