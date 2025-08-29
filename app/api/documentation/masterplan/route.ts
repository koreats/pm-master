// 📋 마스터플랜 참조 정보 API
// PM System 2025 - 실시간 마스터플랜 상태 조회

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { ProgressDataCollector } from '@/lib/documentation/collectors/progress-collector';

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

    // 진행상황 수집기 초기화
    const progressCollector = new ProgressDataCollector();
    
    // 마스터플랜 참조 정보 수집
    const masterPlan = await progressCollector.getMasterPlanReference();

    // 추가 정보 수집
    const [
      taskSummaries,
      currentMilestone,
      blockers,
      nextSteps,
      timelineUpdate
    ] = await Promise.all([
      progressCollector.getTaskSummaries(),
      progressCollector.getCurrentMilestone(),
      progressCollector.getBlockers(),
      progressCollector.getNextSteps(),
      progressCollector.getTimelineUpdate()
    ]);

    // 응답 데이터 구성
    const response = {
      masterPlan,
      taskSummaries,
      currentMilestone,
      blockers,
      nextSteps,
      timelineUpdate,
      generatedAt: new Date().toISOString(),
      teamId,
      // 캐시 헤더를 위한 해시
      contentHash: Buffer.from(JSON.stringify(masterPlan)).toString('base64').slice(0, 8)
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'ETag': `"${response.contentHash}"`,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ 마스터플랜 조회 실패:', error);
    
    return NextResponse.json(
      { 
        error: '마스터플랜 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, taskId, status, progress } = body;

    if (!teamId || !taskId) {
      return NextResponse.json(
        { error: '팀 ID와 작업 ID가 필요합니다' }, 
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

    // 작업 상태 업데이트 이벤트 생성
    const { error: eventError } = await supabase
      .from('documentation_events')
      .insert({
        id: `task-update-${Date.now()}`,
        type: status === 'completed' ? 'task_completed' : 'progress_update',
        payload: JSON.stringify({
          taskId,
          status,
          progress,
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        }),
        team_id: teamId,
        source: 'manual'
      });

    if (eventError) {
      console.error('이벤트 생성 실패:', eventError);
    }

    // 마스터플랜 재조회 및 반환
    const progressCollector = new ProgressDataCollector();
    const updatedMasterPlan = await progressCollector.getMasterPlanReference();

    return NextResponse.json({
      success: true,
      masterPlan: updatedMasterPlan,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 마스터플랜 업데이트 실패:', error);
    
    return NextResponse.json(
      { 
        error: '마스터플랜 업데이트 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    );
  }
}