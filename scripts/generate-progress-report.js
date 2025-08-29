#!/usr/bin/env node

/**
 * 진행 상황 보고서 생성 스크립트
 * 사용법: npm run docs:progress
 */

const fs = require('fs').promises;
const path = require('path');

async function generateProgressReport() {
  console.log('📊 진행 상황 보고서 생성 시작...\n');
  
  try {
    // 1. 메타데이터 읽기
    const docsDir = path.join(__dirname, '..', 'docs');
    const metadataPath = path.join(docsDir, '.documentation-metadata.json');
    
    let metadata = {};
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      console.log('⚠️ 메타데이터 파일이 없습니다. 초기화를 실행합니다...');
      // 초기화 스크립트 실행
      require('./init-documentation.js');
      return;
    }
    
    // 2. 진행률 계산
    const totalTasks = metadata.totalTasks || 12;
    const completedCount = metadata.completedTasks?.length || 0;
    const progressPercentage = Math.round((completedCount / totalTasks) * 100);
    
    // 3. 현재 날짜
    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // 4. 보고서 생성
    const report = generateReport(metadata, progressPercentage, dateStr);
    
    // 5. 보고서 저장
    const reportName = `PROGRESS_REPORT_${now.toISOString().split('T')[0]}.md`;
    const reportPath = path.join(docsDir, 'reports', reportName);
    
    // reports 디렉토리 생성
    await fs.mkdir(path.join(docsDir, 'reports'), { recursive: true });
    
    await fs.writeFile(reportPath, report, 'utf-8');
    console.log(`✅ 진행 상황 보고서 생성 완료: ${reportPath}`);
    
    // 6. 간단한 요약 출력
    console.log('\n📈 현재 진행 상황:');
    console.log(`   전체 진행률: ${progressPercentage}%`);
    console.log(`   완료된 태스크: ${completedCount}/${totalTasks}`);
    if (metadata.nextTask) {
      console.log(`   다음 태스크: ${metadata.nextTask}`);
    }
    
  } catch (error) {
    console.error('❌ 보고서 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

function generateReport(metadata, progressPercentage, dateStr) {
  const completedTasks = metadata.completedTasks || [];
  const pendingTasks = metadata.pendingTasks || [];
  
  // 진행률 바 생성
  const progressBar = generateProgressBar(progressPercentage);
  
  return `# PM System 2025 - 진행 상황 보고서

## 📅 보고서 정보
- **생성일시**: ${dateStr}
- **프로젝트**: PM System 2025
- **전체 진행률**: ${progressPercentage}%

---

## 📊 전체 진행 상황

### 진행률
\`\`\`
전체: ${progressBar} ${progressPercentage}%
완료: ${completedTasks.length}개 / 전체: ${metadata.totalTasks}개
\`\`\`

### 현재 단계
- **${getPhaseInfo(completedTasks.length).name}**
- ${getPhaseInfo(completedTasks.length).description}

---

## ✅ 완료된 태스크

${completedTasks.map(taskId => {
  return `### ${taskId}
- 상태: ✅ 완료
- 보고서: [${taskId}_COMPLETION_REPORT.md](${taskId}_COMPLETION_REPORT.md)`;
}).join('\n\n')}

---

## ⏳ 진행 예정 태스크

${pendingTasks.slice(0, 5).map((taskId, index) => {
  const priority = index === 0 ? '🔴 높음' : index === 1 ? '🟠 중간' : '🟢 보통';
  return `### ${taskId}
- 우선순위: ${priority}
- 상태: ${index === 0 ? '🔄 다음 작업' : '⏳ 대기중'}`;
}).join('\n\n')}

${pendingTasks.length > 5 ? `\n... 외 ${pendingTasks.length - 5}개 태스크` : ''}

---

## 📈 마일스톤 진행 상황

${generateMilestones(completedTasks.length)}

---

## 🎯 다음 단계

${metadata.nextTask ? `
### 즉시 진행할 태스크: ${metadata.nextTask}

1. 마스터플랜의 해당 태스크 명령어 실행
2. 서브태스크 순차적 진행
3. 완료 후 보고서 생성: \`npm run docs:generate-report ${metadata.nextTask}\`
` : '모든 태스크가 완료되었습니다! 🎉'}

---

## 📝 권장사항

1. **정기적인 진행 상황 확인**
   - 매일 또는 태스크 완료 시마다 \`npm run docs:progress\` 실행

2. **완료 보고서 작성**
   - 각 태스크 완료 시 \`npm run docs:generate-report T-XXX\` 실행

3. **문서 동기화**
   - 필요시 \`npm run docs:sync\` 실행하여 실시간 동기화

---

## 🔗 관련 문서

- [마스터플랜](../마스터플랜.md)
- [태스크리스트](../태스크리스트.md)
- [제품 요구사항 정의서](../제품%20요구사항%20정의서%20(PRD).md)

---

*이 보고서는 PM System 2025 자동 문서 생성 시스템에 의해 생성되었습니다.*
`;
}

function generateProgressBar(percentage) {
  const filled = Math.round(percentage / 5); // 20칸 중 채워진 칸
  const empty = 20 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getPhaseInfo(completedCount) {
  if (completedCount < 3) {
    return {
      name: 'Phase 1: 기반 구축',
      description: '프로젝트 초기 설정, 인증 시스템, 데이터베이스 구축'
    };
  } else if (completedCount < 6) {
    return {
      name: 'Phase 2: 핵심 기능',
      description: '데이터 모델, 대시보드, UI 컴포넌트 개발'
    };
  } else if (completedCount < 9) {
    return {
      name: 'Phase 3: 고급 기능',
      description: '뷰 시스템, 실시간 협업, 자동화 기능 구현'
    };
  } else {
    return {
      name: 'Phase 4: 최적화 및 배포',
      description: 'PWA, 접근성, 테스팅 및 배포 준비'
    };
  }
}

function generateMilestones(completedCount) {
  const milestones = [
    { name: 'M1: 기반 완성', target: 3, date: '2025-02-10' },
    { name: 'M2: 핵심 기능 완성', target: 6, date: '2025-03-03' },
    { name: 'M3: 고급 기능 완성', target: 9, date: '2025-03-31' },
    { name: 'M4: 프로덕션 준비', target: 12, date: '2025-04-14' }
  ];
  
  return milestones.map(m => {
    const progress = Math.min(100, Math.round((completedCount / m.target) * 100));
    const status = progress >= 100 ? '✅ 달성' : progress > 0 ? '🔄 진행중' : '⏳ 대기';
    const bar = generateProgressBar(progress);
    
    return `### ${m.name}
- 목표일: ${m.date}
- 진행률: ${bar} ${progress}%
- 상태: ${status}`;
  }).join('\n\n');
}

// 스크립트 실행
generateProgressReport();