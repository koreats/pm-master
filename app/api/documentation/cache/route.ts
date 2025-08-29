// 💾 문서 캐시 관리 API  
// PM System 2025 - 문서 캐시 조회, 삭제, 관리

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const documentType = searchParams.get('documentType');
    const limit = parseInt(searchParams.get('limit') || '10');

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

    // 캐시 조회 쿼리 구성
    let query = supabase
      .from('documentation_cache')
      .select('id, document_type, last_updated, version, file_hash, expires_at')
      .eq('team_id', teamId)
      .order('last_updated', { ascending: false })
      .limit(limit);

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data: cacheEntries, error: cacheError } = await query;

    if (cacheError) {
      console.error('캐시 조회 실패:', cacheError);
      return NextResponse.json(
        { error: '캐시 조회에 실패했습니다' }, 
        { status: 500 }
      );
    }

    // 캐시 통계 집계
    const stats = cacheEntries.reduce((acc: any, entry: any) => {
      const type = entry.document_type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          latestUpdate: entry.last_updated,
          oldestUpdate: entry.last_updated
        };
      }
      
      acc[type].count++;
      
      if (new Date(entry.last_updated) > new Date(acc[type].latestUpdate)) {
        acc[type].latestUpdate = entry.last_updated;
      }
      
      if (new Date(entry.last_updated) < new Date(acc[type].oldestUpdate)) {
        acc[type].oldestUpdate = entry.last_updated;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // 만료된 캐시 확인
    const now = new Date();
    const expiredCount = cacheEntries.filter((entry: any) => 
      entry.expires_at && new Date(entry.expires_at) < now
    ).length;

    const response = {
      teamId,
      cacheEntries,
      stats: {
        total: cacheEntries.length,
        expired: expiredCount,
        byType: stats
      },
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 캐시 조회 실패:', error);
    
    return NextResponse.json(
      { 
        error: '캐시 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    );
  }
}

// 특정 캐시 항목 조회 (콘텐츠 포함)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, cacheId, includeContent = false } = body;

    if (!teamId || !cacheId) {
      return NextResponse.json(
        { error: '팀 ID와 캐시 ID가 필요합니다' }, 
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

    // 캐시 조회
    const selectFields = includeContent ? '*' : 'id, document_type, last_updated, version, file_hash, expires_at, metadata';
    
    const { data: cacheEntry, error: cacheError } = await supabase
      .from('documentation_cache')
      .select(selectFields)
      .eq('id', cacheId)
      .eq('team_id', teamId)
      .single();

    if (cacheError) {
      if (cacheError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '캐시 항목을 찾을 수 없습니다' }, 
          { status: 404 }
        );
      }
      
      console.error('캐시 조회 실패:', cacheError);
      return NextResponse.json(
        { error: '캐시 조회에 실패했습니다' }, 
        { status: 500 }
      );
    }

    // 메타데이터 파싱
    let metadata = null;
    try {
      metadata = JSON.parse(cacheEntry.metadata);
    } catch (parseError) {
      console.warn('메타데이터 파싱 실패:', parseError);
    }

    const response = {
      id: cacheEntry.id,
      documentType: cacheEntry.document_type,
      lastUpdated: cacheEntry.last_updated,
      version: cacheEntry.version,
      fileHash: cacheEntry.file_hash,
      expiresAt: cacheEntry.expires_at,
      metadata,
      ...(includeContent && { content: cacheEntry.content })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 캐시 항목 조회 실패:', error);
    
    return NextResponse.json(
      { 
        error: '캐시 항목 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    );
  }
}

// 캐시 삭제
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, cacheId, documentType, clearAll = false } = body;

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

    // 팀 멤버십 및 권한 확인 (관리자만 캐시 삭제 가능)
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

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: '캐시 삭제 권한이 없습니다' }, 
        { status: 403 }
      );
    }

    let deletedCount = 0;

    if (clearAll) {
      // 전체 캐시 삭제
      const { error: deleteError, count } = await supabase
        .from('documentation_cache')
        .delete()
        .eq('team_id', teamId)
        .select();

      if (deleteError) {
        console.error('전체 캐시 삭제 실패:', deleteError);
        return NextResponse.json(
          { error: '캐시 삭제에 실패했습니다' }, 
          { status: 500 }
        );
      }

      deletedCount = count || 0;

    } else if (cacheId) {
      // 특정 캐시 삭제
      const { error: deleteError, count } = await supabase
        .from('documentation_cache')
        .delete()
        .eq('id', cacheId)
        .eq('team_id', teamId)
        .select();

      if (deleteError) {
        console.error('특정 캐시 삭제 실패:', deleteError);
        return NextResponse.json(
          { error: '캐시 삭제에 실패했습니다' }, 
          { status: 500 }
        );
      }

      deletedCount = count || 0;

    } else if (documentType) {
      // 문서 타입별 캐시 삭제
      const { error: deleteError, count } = await supabase
        .from('documentation_cache')
        .delete()
        .eq('team_id', teamId)
        .eq('document_type', documentType)
        .select();

      if (deleteError) {
        console.error('문서 타입별 캐시 삭제 실패:', deleteError);
        return NextResponse.json(
          { error: '캐시 삭제에 실패했습니다' }, 
          { status: 500 }
        );
      }

      deletedCount = count || 0;

    } else {
      // 만료된 캐시 삭제
      const { error: deleteError, count } = await supabase
        .from('documentation_cache')
        .delete()
        .eq('team_id', teamId)
        .lt('expires_at', new Date().toISOString())
        .select();

      if (deleteError) {
        console.error('만료된 캐시 삭제 실패:', deleteError);
        return NextResponse.json(
          { error: '캐시 삭제에 실패했습니다' }, 
          { status: 500 }
        );
      }

      deletedCount = count || 0;
    }

    // 삭제 이벤트 로깅
    const { error: eventError } = await supabase
      .from('documentation_events')
      .insert({
        id: `cache-clear-${Date.now()}`,
        type: 'progress_update',
        payload: JSON.stringify({
          action: 'cache_cleared',
          deletedCount,
          clearAll,
          documentType,
          cacheId,
          clearedBy: user.id
        }),
        team_id: teamId,
        source: 'manual'
      });

    if (eventError) {
      console.warn('캐시 삭제 이벤트 로깅 실패:', eventError);
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount}개의 캐시 항목이 삭제되었습니다`,
      deletedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 캐시 삭제 실패:', error);
    
    return NextResponse.json(
      { 
        error: '캐시 삭제 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    );
  }
}