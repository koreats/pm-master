// 🔄 문서 동기화 API
// PM System 2025 - 강제 동기화 및 실시간 업데이트

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { DocumentationSyncManager } from '@/lib/documentation/realtime/sync-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, forceUpdate = false, updateType = 'full' } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: '팀 ID가 필요합니다' }, 
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = await createServiceRoleClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' }, 
        { status: 401 }
      );
    }

    // 팀 멤버십 확인
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: '팀 접근 권한이 없습니다' }, 
        { status: 403 }
      );
    }

    console.log(`🔄 문서 동기화 시작: ${updateType} (팀: ${teamId})`);
    const startTime = Date.now();

    // 동기화 매니저 초기화
    const syncManager = new DocumentationSyncManager();

    try {
      // 동기화 실행
      if (forceUpdate) {
        await syncManager.forceSyncNow();
      }

      // 동기화 트리거 (이벤트 기반)
      await syncManager.triggerDocumentationUpdate('progress_update', {
        teamId,
        updateType,
        requestedBy: user.id,
        forceUpdate,
        timestamp: new Date().toISOString()
      });

      // 동기화 상태 확인
      const syncStatus = await syncManager.getSyncStatus();

      const processingTime = Date.now() - startTime;

      // 성공 로그 이벤트 생성
      const { error: logError } = await supabase
        .from('documentation_events')
        .insert({
          id: `sync-success-${Date.now()}`,
          type: 'progress_update',
          payload: JSON.stringify({
            teamId,
            updateType,
            processingTime,
            requestedBy: user.id,
            status: 'completed'
          }),
          team_id: teamId,
          source: 'manual'
        });

      if (logError) {
        console.warn('동기화 로그 생성 실패:', logError);
      }

      return NextResponse.json({
        success: true,
        message: '문서 동기화가 성공적으로 완료되었습니다',
        syncStatus,
        processingTime,
        timestamp: new Date().toISOString(),
        details: {
          updateType,
          forceUpdate,
          eventsProcessed: syncStatus.eventQueueSize
        }
      });

    } finally {
      // 리소스 정리
      await syncManager.cleanup();
    }

  } catch (error) {
    console.error('❌ 문서 동기화 실패:', error);
    
    // 실패 로그 이벤트 생성
    try {
      const supabase = await createServiceRoleClient();
      await supabase
        .from('documentation_events')
        .insert({
          id: `sync-error-${Date.now()}`,
          type: 'quality_alert',
          payload: JSON.stringify({
            error: error instanceof Error ? error.message : '알 수 없는 오류',
            timestamp: new Date().toISOString()
          }),
          source: 'manual'
        });
    } catch (logError) {
      console.error('오류 로그 생성 실패:', logError);
    }
    
    return NextResponse.json(
      { 
        error: '문서 동기화 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    );
  }
}

// 동기화 상태 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: '팀 ID가 필요합니다' }, 
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = await createServiceRoleClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' }, 
        { status: 401 }
      );
    }

    // 팀 멤버십 확인
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: '팀 접근 권한이 없습니다' }, 
        { status: 403 }
      );
    }

    // 최근 동기화 이벤트 조회
    const { data: recentEvents, error: eventsError } = await supabase
      .from('documentation_events')
      .select('*')
      .eq('team_id', teamId)
      .in('type', ['progress_update', 'quality_alert'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventsError) {
      console.warn('최근 이벤트 조회 실패:', eventsError);
    }

    // 현재 진행 중인 작업 조회
    const { data: activeJobs, error: jobsError } = await supabase
      .from('documentation_generation_jobs')
      .select('*')
      .eq('team_id', teamId)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.warn('활성 작업 조회 실패:', jobsError);
    }

    // 마지막 성공한 동기화 시간
    const lastSuccessEvent = recentEvents?.find((e: any) => 
      e.type === 'progress_update' && 
      JSON.parse(e.payload).status === 'completed'
    );

    // 동기화 설정 조회
    const { data: settings, error: settingsError } = await supabase
      .from('documentation_settings')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.warn('동기화 설정 조회 실패:', settingsError);
    }

    const response = {
      teamId,
      isActive: settings?.auto_generation_enabled ?? true,
      syncInterval: settings?.sync_interval_minutes ?? 30,
      lastSync: lastSuccessEvent?.created_at || null,
      
      // 현재 상태
      activeJobs: activeJobs?.length || 0,
      pendingEvents: recentEvents?.filter((e: any) => !e.processed_at).length || 0,
      
      // 최근 이벤트
      recentEvents: recentEvents?.slice(0, 5).map((event: any) => ({
        id: event.id,
        type: event.type,
        createdAt: event.created_at,
        source: event.source,
        processed: !!event.processed_at
      })) || [],
      
      // 건강 상태
      healthStatus: {
        overall: 'healthy',
        lastSync: lastSuccessEvent ? 
          (Date.now() - new Date(lastSuccessEvent.created_at).getTime() < 60000 * 60) ? 'recent' : 'stale' :
          'unknown',
        hasErrors: recentEvents?.some(e => e.type === 'quality_alert') ?? false
      },
      
      // 설정 정보
      settings: settings ? {
        autoGenerationEnabled: settings.auto_generation_enabled,
        syncIntervalMinutes: settings.sync_interval_minutes,
        maxCacheVersions: settings.max_cache_versions,
        languagePreference: settings.language_preference,
        timezonePreference: settings.timezone
      } : null,
      
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ 동기화 상태 조회 실패:', error);
    
    return NextResponse.json(
      { 
        error: '동기화 상태 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    );
  }
}