// 🔄 실시간 문서 동기화 React 훅
// PM System 2025 - 프론트엔드 실시간 문서 상태 관리

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { 
  DocumentationEvent,
  ProgressReportTemplate,
  MasterPlanReference,
  ProgressMetrics,
  DocumentCache 
} from '../types/documentation';

export interface DocumentationSyncStatus {
  isConnected: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
  eventsReceived: number;
  errors: string[];
}

export interface UseDocumentationSyncOptions {
  teamId: string;
  autoConnect?: boolean;
  enableRealtimeUpdates?: boolean;
  syncIntervalMs?: number;
}

export interface UseDocumentationSyncReturn {
  // 연결 상태
  status: DocumentationSyncStatus;
  
  // 문서 데이터
  progressReport: ProgressReportTemplate | null;
  masterPlan: MasterPlanReference | null;
  metrics: ProgressMetrics | null;
  
  // 캐시 상태
  cachedDocuments: DocumentCache[];
  lastCacheUpdate: Date | null;
  
  // 액션
  connect: () => void;
  disconnect: () => void;
  forceSync: () => Promise<void>;
  clearCache: () => Promise<void>;
  
  // 로딩 상태
  isLoading: boolean;
  error: Error | null;
}

/**
 * 실시간 문서 동기화 훅
 */
export function useDocumentationSync(
  options: UseDocumentationSyncOptions
): UseDocumentationSyncReturn {
  const { 
    teamId, 
    autoConnect = true, 
    enableRealtimeUpdates = true,
    syncIntervalMs = 30000 
  } = options;
  
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  // 상태 관리
  const [status, setStatus] = useState<DocumentationSyncStatus>({
    isConnected: false,
    lastSync: null,
    syncInProgress: false,
    eventsReceived: 0,
    errors: []
  });
  
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null);

  // 진행상황 리포트 쿼리
  const {
    data: progressReport,
    isLoading: progressLoading,
    error: progressError
  } = useQuery({
    queryKey: ['documentation', 'progress', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentation_cache')
        .select('*')
        .eq('team_id', teamId)
        .eq('document_type', 'progress')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? JSON.parse(data.content) as ProgressReportTemplate : null;
    },
    staleTime: 5 * 60 * 1000, // 5분
    refetchInterval: syncIntervalMs
  });

  // 마스터플랜 참조 쿼리
  const {
    data: masterPlan,
    isLoading: masterPlanLoading,
    error: masterPlanError
  } = useQuery({
    queryKey: ['documentation', 'masterplan', teamId],
    queryFn: async () => {
      // API 호출로 실시간 마스터플랜 상태 가져오기
      const response = await fetch(`/api/documentation/masterplan?teamId=${teamId}`);
      if (!response.ok) throw new Error('마스터플랜 조회 실패');
      return response.json() as Promise<MasterPlanReference>;
    },
    staleTime: 2 * 60 * 1000, // 2분
    refetchInterval: syncIntervalMs
  });

  // 진행 메트릭 쿼리  
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError
  } = useQuery({
    queryKey: ['documentation', 'metrics', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/documentation/metrics?teamId=${teamId}`);
      if (!response.ok) throw new Error('메트릭 조회 실패');
      return response.json() as Promise<ProgressMetrics>;
    },
    staleTime: 10 * 60 * 1000, // 10분
    refetchInterval: syncIntervalMs
  });

  // 캐시된 문서 목록 쿼리
  const {
    data: cachedDocuments = [],
    isLoading: cacheLoading,
    error: cacheError
  } = useQuery({
    queryKey: ['documentation', 'cache', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentation_cache')
        .select('*')
        .eq('team_id', teamId)
        .order('last_updated', { ascending: false });
      
      if (error) throw error;
      
      return data as DocumentCache[];
    },
    staleTime: 5 * 60 * 1000
  });

  // 실시간 연결 설정
  const connect = useCallback(() => {
    if (!enableRealtimeUpdates || realtimeChannel) return;

    console.log('📡 실시간 문서 동기화 연결 중...');

    const channel = supabase
      .channel(`documentation-sync-${teamId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documentation_events',
          filter: `team_id=eq.${teamId}`
        },
        (payload: any) => {
          console.log('📝 문서 이벤트 수신:', payload);
          
          setStatus(prev => ({
            ...prev,
            eventsReceived: prev.eventsReceived + 1,
            lastSync: new Date()
          }));

          // 관련 쿼리 무효화하여 재조회 트리거
          queryClient.invalidateQueries({ 
            queryKey: ['documentation', 'progress', teamId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['documentation', 'masterplan', teamId] 
          });
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'documentation_cache',
          filter: `team_id=eq.${teamId}`
        },
        (payload: any) => {
          console.log('💾 문서 캐시 업데이트:', payload);
          
          setStatus(prev => ({
            ...prev,
            lastSync: new Date()
          }));

          // 캐시 쿼리 무효화
          queryClient.invalidateQueries({ 
            queryKey: ['documentation', 'cache', teamId] 
          });
        }
      )
      .on('broadcast',
        { event: 'progress_update' },
        (payload: any) => {
          console.log('📊 진행상황 브로드캐스트 수신:', payload);
          
          // UI에서 즉시 반영할 수 있도록 쿼리 무효화
          queryClient.invalidateQueries({ 
            queryKey: ['documentation'] 
          });
        }
      )
      .subscribe((status: any) => {
        console.log('📡 실시간 채널 상태:', status);
        
        setStatus(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED',
          errors: status === 'CHANNEL_ERROR' ? 
            [...prev.errors, '실시간 연결 오류'] : 
            prev.errors.filter(e => e !== '실시간 연결 오류')
        }));
      });

    setRealtimeChannel(channel);
  }, [teamId, enableRealtimeUpdates, realtimeChannel, queryClient]);

  // 연결 해제
  const disconnect = useCallback(async () => {
    if (realtimeChannel) {
      await supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }

    if (syncInterval) {
      clearInterval(syncInterval);
      setSyncInterval(null);
    }

    setStatus(prev => ({
      ...prev,
      isConnected: false
    }));

    console.log('📡 실시간 문서 동기화 연결 해제');
  }, [realtimeChannel, syncInterval]);

  // 강제 동기화
  const forceSync = useCallback(async () => {
    setStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // 서버에 강제 동기화 요청
      const response = await fetch('/api/documentation/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, forceUpdate: true })
      });

      if (!response.ok) {
        throw new Error('동기화 요청 실패');
      }

      // 모든 문서 관련 쿼리 무효화
      await queryClient.invalidateQueries({ 
        queryKey: ['documentation'] 
      });

      setStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        syncInProgress: false
      }));

      console.log('✅ 강제 동기화 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '동기화 실패';
      
      setStatus(prev => ({
        ...prev,
        syncInProgress: false,
        errors: [...prev.errors, errorMessage]
      }));

      console.error('❌ 강제 동기화 실패:', error);
      throw error;
    }
  }, [teamId, queryClient]);

  // 캐시 정리
  const clearCache = useCallback(async () => {
    try {
      const response = await fetch('/api/documentation/cache', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });

      if (!response.ok) {
        throw new Error('캐시 정리 실패');
      }

      // 캐시 쿼리 무효화
      await queryClient.invalidateQueries({ 
        queryKey: ['documentation', 'cache', teamId] 
      });

      console.log('🧹 문서 캐시 정리 완료');
    } catch (error) {
      console.error('❌ 캐시 정리 실패:', error);
      throw error;
    }
  }, [teamId, queryClient]);

  // 자동 연결
  useEffect(() => {
    if (autoConnect && !realtimeChannel) {
      connect();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (realtimeChannel) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect, realtimeChannel]);

  // 에러 통합
  const error = progressError || masterPlanError || metricsError || cacheError;
  const isLoading = progressLoading || masterPlanLoading || metricsLoading || cacheLoading;

  // 최종 캐시 업데이트 시간 계산
  const lastCacheUpdate = cachedDocuments.length > 0 ? 
    new Date(Math.max(...cachedDocuments.map(doc => new Date(doc.lastUpdated).getTime()))) : 
    null;

  return {
    // 상태
    status,
    
    // 데이터
    progressReport: progressReport || null,
    masterPlan: masterPlan || null,
    metrics: metrics || null,
    cachedDocuments,
    lastCacheUpdate,
    
    // 액션
    connect,
    disconnect, 
    forceSync,
    clearCache,
    
    // 로딩
    isLoading,
    error: error as Error | null
  };
}

/**
 * 문서 이벤트 구독 훅 (특정 이벤트 타입만)
 */
export function useDocumentationEvents(
  teamId: string,
  eventTypes: DocumentationEvent['type'][] = []
) {
  const [events, setEvents] = useState<DocumentationEvent[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!teamId || eventTypes.length === 0) return;

    setIsListening(true);

    const supabase = createClient();
    const channel = supabase
      .channel(`doc-events-${teamId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'documentation_events',
          filter: `team_id=eq.${teamId}`
        },
        (payload: any) => {
          const event = payload.new as any;
          
          if (eventTypes.includes(event.type)) {
            setEvents(prev => [
              {
                id: event.id,
                type: event.type,
                payload: JSON.parse(event.payload),
                createdAt: new Date(event.created_at),
                source: event.source
              },
              ...prev.slice(0, 99) // 최근 100개만 유지
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      setIsListening(false);
    };
  }, [teamId, eventTypes]);

  return { events, isListening };
}