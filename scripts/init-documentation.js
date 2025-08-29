#!/usr/bin/env node

/**
 * 문서화 시스템 초기화 스크립트
 * 기존 완료 보고서를 인식하고 시스템에 등록
 * 사용법: npm run docs:init
 */

const fs = require('fs').promises;
const path = require('path');

async function initDocumentationSystem() {
  console.log('🚀 문서화 시스템 초기화 시작...\n');
  
  try {
    // 1. docs 디렉토리 확인
    const docsDir = path.join(__dirname, '..', 'docs');
    const files = await fs.readdir(docsDir);
    
    // 2. 완료 보고서 파일 찾기
    const completionReports = files.filter(file => 
      /^T-\d{3}_COMPLETION_REPORT\.md$/.test(file)
    );
    
    console.log(`📁 발견된 완료 보고서: ${completionReports.length}개`);
    completionReports.forEach(report => {
      console.log(`   ✅ ${report}`);
    });
    
    // 3. 태스크리스트 분석
    const taskListPath = path.join(docsDir, '태스크리스트.md');
    const taskListContent = await fs.readFile(taskListPath, 'utf-8');
    const allTasks = extractAllTasks(taskListContent);
    
    console.log(`\n📋 전체 태스크: ${allTasks.length}개`);
    
    // 4. 진행 상황 계산
    const completedTasks = completionReports.map(file => 
      file.replace('_COMPLETION_REPORT.md', '')
    );
    
    const pendingTasks = allTasks.filter(task => 
      !completedTasks.includes(task.id)
    );
    
    console.log(`\n📊 진행 상황:`);
    console.log(`   ✅ 완료: ${completedTasks.length}개 (${completedTasks.join(', ')})`);
    console.log(`   ⏳ 진행중/대기: ${pendingTasks.length}개`);
    
    // 5. 현재 단계 확인
    const currentPhase = getCurrentPhase(completedTasks.length);
    console.log(`\n🎯 현재 단계: ${currentPhase.name}`);
    console.log(`   ${currentPhase.description}`);
    
    // 6. 다음 태스크 확인
    if (pendingTasks.length > 0) {
      const nextTask = pendingTasks[0];
      console.log(`\n📌 다음 태스크: ${nextTask.id} ${nextTask.name}`);
      console.log(`   마스터플랜 명령어를 사용하여 진행하세요.`);
    }
    
    // 7. 메타데이터 파일 생성
    const metadata = {
      initialized: new Date().toISOString(),
      totalTasks: allTasks.length,
      completedTasks: completedTasks,
      pendingTasks: pendingTasks.map(t => t.id),
      currentPhase: currentPhase.id,
      nextTask: pendingTasks[0]?.id || null,
      lastUpdated: new Date().toISOString()
    };
    
    const metadataPath = path.join(docsDir, '.documentation-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`\n💾 메타데이터 저장: ${metadataPath}`);
    
    // 8. 진행률 보고서 생성 제안
    console.log('\n📝 권장 작업:');
    console.log('   1. 진행 상황 보고서 생성: npm run docs:progress');
    console.log('   2. 다음 태스크 시작: 마스터플랜의 해당 명령어 실행');
    if (completedTasks.length > 0) {
      const lastCompleted = completedTasks[completedTasks.length - 1];
      console.log(`   3. 최근 완료 보고서 확인: docs/${lastCompleted}_COMPLETION_REPORT.md`);
    }
    
    console.log('\n✅ 문서화 시스템 초기화 완료!');
    
  } catch (error) {
    console.error('❌ 초기화 중 오류 발생:', error);
    process.exit(1);
  }
}

function extractAllTasks(content) {
  const tasks = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^## (T-\d{3})\s+(.+)$/);
    if (match) {
      tasks.push({
        id: match[1],
        name: match[2]
      });
    }
  });
  
  return tasks;
}

function getCurrentPhase(completedCount) {
  const phases = [
    {
      id: 'phase1',
      name: 'Phase 1: 기반 구축',
      description: 'T-001 ~ T-003 (프로젝트 설정, 인증, DB 스키마)',
      minTasks: 0,
      maxTasks: 3
    },
    {
      id: 'phase2',
      name: 'Phase 2: 핵심 기능',
      description: 'T-004 ~ T-006 (데이터 모델, 대시보드, UI 컴포넌트)',
      minTasks: 3,
      maxTasks: 6
    },
    {
      id: 'phase3',
      name: 'Phase 3: 고급 기능',
      description: 'T-006 ~ T-009 (뷰 시스템, 실시간 협업, 자동화)',
      minTasks: 6,
      maxTasks: 9
    },
    {
      id: 'phase4',
      name: 'Phase 4: 최적화 및 배포',
      description: 'T-010 ~ T-012 (PWA, 접근성, 테스팅/배포)',
      minTasks: 9,
      maxTasks: 12
    }
  ];
  
  for (const phase of phases) {
    if (completedCount >= phase.minTasks && completedCount < phase.maxTasks) {
      return phase;
    }
  }
  
  return phases[phases.length - 1];
}

// 스크립트 실행
initDocumentationSystem();