// 🔄 실시간 문서 동기화 관리자
// 마스터플랜 기반 진행상황을 실시간으로 추적하고 동기화

import { createClient } from '@/lib/supabase/client';
import type { 
  DocumentationEvent, 
  DocumentCache,
  TaskSummary,
  MasterPlanReference,
  ProgressMetrics,
  ValidationResult 
} from '../types/documentation';
import { ProgressDataCollector } from '../collectors/progress-collector';
import { TemplateEngine, templateEngine } from '../template-engine';

export class DocumentationSyncManager {
  private progressCollector: ProgressDataCollector;
  private templateEngine = templateEngine;
  private realtimeChannel: any;
  private fileWatcherActive: boolean = false;
  private lastSyncTime: Date = new Date();
  private eventQueue: DocumentationEvent[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private supabaseClient = createClient();

  constructor() {
    this.progressCollector = new ProgressDataCollector();
    this.initializeRealtime();
  }

  /**
   * Supabase Realtime 채널 초기화
   */
  private initializeRealtime() {
    this.realtimeChannel = this.supabaseClient
      .channel('documentation-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'documentation_events' },
        (payload: any) => this.handleDatabaseEvent(payload)
      )
      .on('broadcast',
        { event: 'progress_update' },
        (payload: any) => this.handleProgressBroadcast(payload)
      )
      .subscribe((status: any) => {
        console.log('📡 실시간 문서 동기화 채널 상태:', status);
      });
  }

  /**
   * 파일 시스템 변경 감지 시작
   */
  async startFileWatcher() {
    if (this.fileWatcherActive) return;

    this.fileWatcherActive = true;

    // 주기적 동기화 (30초마다)
    this.syncInterval = setInterval(async () => {
      await this.performPeriodicSync();
    }, 30000);

    console.log('📁 파일 워처 활성화: 30초 간격 동기화');
  }

  /**
   * 파일 시스템 변경 감지 중지
   */
  stopFileWatcher() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.fileWatcherActive = false;
    console.log('📁 파일 워처 비활성화');
  }

  /**
   * 주기적 동기화 수행
   */
  private async performPeriodicSync() {
    try {
      console.log('🔄 주기적 동기화 시작...');
      
      // 마스터플랜 참조 정보 수집
      const masterPlan = await this.progressCollector.getMasterPlanReference();
      
      // 변경사항 감지
      const hasChanges = await this.detectChanges(masterPlan);
      
      if (hasChanges) {
        await this.triggerDocumentationUpdate('periodic_sync', {
          masterPlan,
          timestamp: new Date(),
          source: 'file_watcher'
        });
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('❌ 주기적 동기화 실패:', error);
      await this.logEvent({
        id: `sync-error-${Date.now()}`,
        type: 'quality_alert',
        payload: { error: error instanceof Error ? error.message : '알 수 없는 오류' },
        createdAt: new Date(),
        source: 'file_watcher'
      });
    }
  }

  /**
   * 변경사항 감지
   */
  private async detectChanges(currentPlan: MasterPlanReference): Promise<boolean> {
    try {
      // 캐시된 이전 상태와 비교
      const { data: lastCache } = await this.supabaseClient
        .from('documentation_cache')
        .select('*')
        .eq('document_type', 'progress')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (!lastCache) return true; // 첫 실행

      const lastMetadata = JSON.parse(lastCache.metadata);
      
      // 주요 지표 변경 확인
      const significantChanges = (
        currentPlan.completedTasks !== lastMetadata.completedTasks ||
        currentPlan.currentTask !== lastMetadata.currentTask ||
        currentPlan.phase !== lastMetadata.phase
      );

      return significantChanges;
    } catch (error) {
      console.warn('⚠️ 변경사항 감지 실패, 안전을 위해 업데이트 수행:', error);
      return true;
    }
  }

  /**
   * 문서화 업데이트 트리거
   */
  async triggerDocumentationUpdate(eventType: string, payload: any) {
    const event: DocumentationEvent = {
      id: `doc-update-${Date.now()}`,
      type: eventType as any,
      payload,
      createdAt: new Date(),
      source: 'sync_manager'
    };

    // 이벤트 큐에 추가
    this.eventQueue.push(event);
    
    // 즉시 처리
    await this.processEventQueue();
    
    // 실시간 브로드캐스트
    await this.broadcastProgressUpdate(payload);
  }

  /**
   * 이벤트 큐 처리
   */
  private async processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      
      try {
        await this.processDocumentationEvent(event);
      } catch (error) {
        console.error('❌ 이벤트 처리 실패:', event.id, error);
        
        // 실패한 이벤트 재시도 (최대 1회)
        if (!event.payload.retryAttempt) {
          event.payload.retryAttempt = 1;
          this.eventQueue.push(event);
        }
      }
    }
  }

  /**
   * 문서화 이벤트 처리
   */
  private async processDocumentationEvent(event: DocumentationEvent) {
    console.log(`📝 문서 이벤트 처리: ${event.type}`);

    switch (event.type) {
      case 'progress_update':
        await this.handleProgressUpdate(event);
        break;
      case 'milestone_reached':
        await this.handleMilestoneReached(event);
        break;
      case 'task_completed':
        await this.handleTaskCompleted(event);
        break;
      case 'blocker_added':
        await this.handleBlockerAdded(event);
        break;
      case 'quality_alert':
        await this.handleQualityAlert(event);
        break;
    }

    // 이벤트 로깅
    await this.logEvent(event);
  }

  /**
   * 진행상황 업데이트 처리
   */
  private async handleProgressUpdate(event: DocumentationEvent) {
    try {
      // 전체 진행 리포트 생성
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
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
          to: new Date()
        }
      };

      // 문서 생성
      const progressReport = await this.templateEngine.generateProgressReport(progressData);
      
      // 캐시 업데이트
      await this.updateDocumentCache('progress', progressReport, progressData.masterPlan);
      
      console.log('✅ 진행상황 리포트 업데이트 완료');
    } catch (error) {
      console.error('❌ 진행상황 업데이트 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 마일스톤 도달 처리
   */
  private async handleMilestoneReached(event: DocumentationEvent) {
    const milestone = event.payload;
    
    console.log(`🎯 마일스톤 도달: ${milestone.title}`);
    
    // 특별 리포트 생성
    await this.generateMilestoneReport(milestone);
    
    // 알림 발송 (향후 구현)
    // await this.sendMilestoneNotification(milestone);
  }

  /**
   * 작업 완료 처리
   */
  private async handleTaskCompleted(event: DocumentationEvent) {
    const task = event.payload;
    
    console.log(`✅ 작업 완료: ${task.title}`);
    
    // 작업 완료 메트릭 업데이트
    await this.updateTaskMetrics(task);
  }

  /**
   * 차단 요소 추가 처리
   */
  private async handleBlockerAdded(event: DocumentationEvent) {
    const blocker = event.payload;
    
    console.log(`🚨 차단 요소 발생: ${blocker.description}`);
    
    // 즉시 알림 (향후 구현)
    // await this.sendBlockerAlert(blocker);
  }

  /**
   * 품질 경고 처리
   */
  private async handleQualityAlert(event: DocumentationEvent) {
    const alert = event.payload;
    
    console.log(`⚠️ 품질 경고: ${alert.error}`);
    
    // 품질 리포트 업데이트
    await this.updateQualityMetrics(alert);
  }

  /**
   * 문서 캐시 업데이트
   */
  private async updateDocumentCache(
    documentType: 'progress' | 'api' | 'component' | 'schema',
    content: string,
    metadata: any
  ) {
    const cacheEntry: Omit<DocumentCache, 'id'> = {
      documentType,
      content,
      metadata: JSON.stringify(metadata),
      lastUpdated: new Date(),
      version: `v${Date.now()}`
    };

    const { error } = await this.supabaseClient
      .from('documentation_cache')
      .upsert(cacheEntry);

    if (error) {
      console.error('❌ 문서 캐시 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 이벤트 로깅
   */
  private async logEvent(event: DocumentationEvent) {
    const { error } = await this.supabaseClient
      .from('documentation_events')
      .insert({
        id: event.id,
        type: event.type,
        payload: JSON.stringify(event.payload),
        created_at: event.createdAt.toISOString(),
        source: event.source
      });

    if (error) {
      console.error('❌ 이벤트 로깅 실패:', error);
    }
  }

  /**
   * 진행상황 브로드캐스트
   */
  private async broadcastProgressUpdate(payload: any) {
    await this.realtimeChannel.send({
      type: 'broadcast',
      event: 'progress_update',
      payload: {
        ...payload,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * 데이터베이스 이벤트 처리
   */
  private handleDatabaseEvent(payload: any) {
    console.log('📊 데이터베이스 변경 감지:', payload);
    
    // 외부 변경사항에 대한 문서 동기화
    this.triggerDocumentationUpdate('external_change', {
      table: payload.table,
      eventType: payload.eventType,
      record: payload.new || payload.old,
      source: 'database'
    });
  }

  /**
   * 진행상황 브로드캐스트 처리
   */
  private handleProgressBroadcast(payload: any) {
    console.log('📡 진행상황 브로드캐스트 수신:', payload);
    
    // UI 업데이트 트리거 (향후 구현)
    // this.notifyUIComponents(payload);
  }

  /**
   * 마일스톤 리포트 생성
   */
  private async generateMilestoneReport(milestone: any) {
    // 향후 구현: 특별한 마일스톤 리포트 템플릿 생성
    console.log('📋 마일스톤 리포트 생성 예정:', milestone.title);
  }

  /**
   * 작업 메트릭 업데이트
   */
  private async updateTaskMetrics(task: TaskSummary) {
    // 향후 구현: 작업 완료 통계 업데이트
    console.log('📊 작업 메트릭 업데이트 예정:', task.title);
  }

  /**
   * 품질 메트릭 업데이트
   */
  private async updateQualityMetrics(alert: any) {
    // 향후 구현: 품질 지표 추적
    console.log('🔍 품질 메트릭 업데이트 예정:', alert);
  }

  /**
   * 동기화 상태 확인
   */
  async getSyncStatus(): Promise<{
    isActive: boolean;
    lastSync: Date;
    eventQueueSize: number;
    realtimeConnected: boolean;
  }> {
    return {
      isActive: this.fileWatcherActive,
      lastSync: this.lastSyncTime,
      eventQueueSize: this.eventQueue.length,
      realtimeConnected: this.realtimeChannel?.state === 'joined'
    };
  }

  /**
   * 수동 동기화 실행
   */
  async forceSyncNow(): Promise<void> {
    console.log('🔄 수동 동기화 시작...');
    await this.performPeriodicSync();
    console.log('✅ 수동 동기화 완료');
  }

  /**
   * 리소스 정리
   */
  async cleanup() {
    this.stopFileWatcher();
    
    if (this.realtimeChannel) {
      await this.supabaseClient.removeChannel(this.realtimeChannel);
    }
    
    // 남은 이벤트 처리
    if (this.eventQueue.length > 0) {
      console.log(`📝 남은 ${this.eventQueue.length}개 이벤트 처리 중...`);
      await this.processEventQueue();
    }
    
    console.log('🧹 문서 동기화 매니저 정리 완료');
  }
}