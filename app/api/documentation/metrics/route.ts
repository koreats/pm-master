// 📊 문서 메트릭 API
// PM System 2025 - 진행상황 메트릭 및 품질 지표 조회

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { ProgressDataCollector } from '@/lib/documentation/collectors/progress-collector';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const period = searchParams.get('period') || '30'; // 기본 30일

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
    
    // 기본 메트릭 수집
    const progressMetrics = await progressCollector.getProgressMetrics();

    // 데이터베이스에서 품질 메트릭 조회
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));

    const { data: qualityMetrics, error: qualityError } = await supabase
      .from('documentation_quality_metrics')
      .select('*')
      .eq('team_id', teamId)
      .gte('measured_at', fromDate.toISOString())
      .order('measured_at', { ascending: false });

    if (qualityError) {
      console.warn('품질 메트릭 조회 실패:', qualityError);
    }

    // 문서 생성 작업 통계
    const { data: jobStats, error: jobError } = await supabase
      .from('documentation_generation_jobs')
      .select('status, job_type, processing_time_ms, created_at')
      .eq('team_id', teamId)
      .gte('created_at', fromDate.toISOString());

    if (jobError) {
      console.warn('작업 통계 조회 실패:', jobError);
    }

    // 문서 이벤트 통계
    const { data: eventStats, error: eventError } = await supabase
      .from('documentation_events')
      .select('type, created_at, source')
      .eq('team_id', teamId)
      .gte('created_at', fromDate.toISOString());

    if (eventError) {
      console.warn('이벤트 통계 조회 실패:', eventError);
    }

    // 통계 집계
    const jobStatsAggregated = jobStats ? {
      total: jobStats.length,
      completed: jobStats.filter((j: any) => j.status === 'completed').length,
      failed: jobStats.filter((j: any) => j.status === 'failed').length,
      avgProcessingTime: jobStats
        .filter((j: any) => j.processing_time_ms)
        .reduce((avg: number, j: any, _: any, arr: any[]) => avg + (j.processing_time_ms! / arr.length), 0),
      byType: jobStats.reduce((acc: any, job: any) => {
        acc[job.job_type] = (acc[job.job_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    } : {
      total: 0,
      completed: 0, 
      failed: 0,
      avgProcessingTime: 0,
      byType: {}
    };

    const eventStatsAggregated = eventStats ? {
      total: eventStats.length,
      byType: eventStats.reduce((acc: any, event: any) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySource: eventStats.reduce((acc: any, event: any) => {
        acc[event.source] = (acc[event.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    } : {
      total: 0,
      byType: {},
      bySource: {}
    };

    // 품질 점수 계산
    const latestQualityMetrics = qualityMetrics?.[0];
    const qualityScores = latestQualityMetrics ? {
      completeness: latestQualityMetrics.completeness_score || 0,
      accuracy: latestQualityMetrics.accuracy_score || 0,
      freshness: latestQualityMetrics.freshness_score || 0,
      readability: latestQualityMetrics.readability_score || 0,
      overall: [
        latestQualityMetrics.completeness_score || 0,
        latestQualityMetrics.accuracy_score || 0,
        latestQualityMetrics.freshness_score || 0,
        latestQualityMetrics.readability_score || 0
      ].reduce((sum, score) => sum + score, 0) / 4
    } : {
      completeness: 0.5,
      accuracy: 0.5,
      freshness: 0.5,
      readability: 0.5,
      overall: 0.5
    };

    // 시계열 데이터 (일별 집계)
    const timeSeriesData = qualityMetrics ? 
      qualityMetrics.reduce((acc: any, metric: any) => {
        const date = new Date(metric.measured_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            completeness: [],
            accuracy: [],
            freshness: [],
            readability: []
          };
        }
        
        if (metric.completeness_score) acc[date].completeness.push(metric.completeness_score);
        if (metric.accuracy_score) acc[date].accuracy.push(metric.accuracy_score);
        if (metric.freshness_score) acc[date].freshness.push(metric.freshness_score);
        if (metric.readability_score) acc[date].readability.push(metric.readability_score);
        
        return acc;
      }, {} as Record<string, any>) : {};

    // 일별 평균 계산
    const timeSeriesArray = Object.values(timeSeriesData).map((day: any) => ({
      date: day.date,
      completeness: day.completeness.length > 0 ? 
        day.completeness.reduce((a: number, b: number) => a + b, 0) / day.completeness.length : 0.5,
      accuracy: day.accuracy.length > 0 ? 
        day.accuracy.reduce((a: number, b: number) => a + b, 0) / day.accuracy.length : 0.5,
      freshness: day.freshness.length > 0 ? 
        day.freshness.reduce((a: number, b: number) => a + b, 0) / day.freshness.length : 0.5,
      readability: day.readability.length > 0 ? 
        day.readability.reduce((a: number, b: number) => a + b, 0) / day.readability.length : 0.5
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 응답 데이터 구성
    const response = {
      // 기본 진행 메트릭
      progressMetrics,
      
      // 품질 점수
      qualityScores,
      
      // 문서 생성 작업 통계
      jobStats: jobStatsAggregated,
      
      // 이벤트 통계
      eventStats: eventStatsAggregated,
      
      // 시계열 데이터
      timeSeries: timeSeriesArray,
      
      // 메타정보
      period: parseInt(period),
      generatedAt: new Date().toISOString(),
      teamId,
      
      // 건강도 지표
      healthIndicators: {
        documentationCoverage: progressMetrics.codeQuality.coverage,
        automationHealth: jobStatsAggregated.total > 0 ? 
          (jobStatsAggregated.completed / jobStatsAggregated.total) : 1,
        realtimeConnectivity: eventStatsAggregated.total > 0 ? 1 : 0.5,
        overallHealth: (
          (progressMetrics.codeQuality.coverage / 100) * 0.4 +
          (jobStatsAggregated.total > 0 ? (jobStatsAggregated.completed / jobStatsAggregated.total) : 1) * 0.3 +
          qualityScores.overall * 0.3
        )
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ 메트릭 조회 실패:', error);
    
    return NextResponse.json(
      { 
        error: '메트릭 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    );
  }
}

// 품질 메트릭 업데이트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      teamId, 
      documentType, 
      filePath,
      completenessScore,
      accuracyScore,
      freshnessScore,
      readabilityScore,
      wordCount,
      codeExamplesCount,
      brokenLinksCount,
      outdatedReferencesCount
    } = body;

    if (!teamId || !documentType) {
      return NextResponse.json(
        { error: '팀 ID와 문서 타입이 필요합니다' }, 
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

    // 품질 메트릭 저장
    const { error: insertError } = await supabase
      .from('documentation_quality_metrics')
      .insert({
        team_id: teamId,
        document_type: documentType,
        file_path: filePath,
        completeness_score: completenessScore,
        accuracy_score: accuracyScore,
        freshness_score: freshnessScore,
        readability_score: readabilityScore,
        word_count: wordCount,
        code_examples_count: codeExamplesCount,
        broken_links_count: brokenLinksCount,
        outdated_references_count: outdatedReferencesCount,
        measurement_source: 'api'
      });

    if (insertError) {
      console.error('품질 메트릭 저장 실패:', insertError);
      return NextResponse.json(
        { error: '품질 메트릭 저장에 실패했습니다' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '품질 메트릭이 성공적으로 저장되었습니다',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 품질 메트릭 업데이트 실패:', error);
    
    return NextResponse.json(
      { 
        error: '품질 메트릭 업데이트 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    );
  }
}