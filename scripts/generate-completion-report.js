#!/usr/bin/env node

/**
 * 태스크 완료 보고서 생성 스크립트
 * 사용법: npm run docs:generate-report T-001
 */

const fs = require('fs').promises;
const path = require('path');

// 태스크 ID를 명령줄 인자에서 가져오기
const taskId = process.argv[2];

if (!taskId) {
  console.error('❌ 태스크 ID를 입력해주세요.');
  console.log('사용법: npm run docs:generate-report T-001');
  process.exit(1);
}

// 태스크 ID 유효성 검증
if (!/^T-\d{3}$/.test(taskId)) {
  console.error('❌ 잘못된 태스크 ID 형식입니다. (예: T-001)');
  process.exit(1);
}

async function generateCompletionReport(taskId) {
  try {
    console.log(`🚀 ${taskId} 완료 보고서 생성 시작...`);

    // 태스크리스트에서 태스크 정보 읽기
    const taskListPath = path.join(__dirname, '..', 'docs', '태스크리스트.md');
    const taskListContent = await fs.readFile(taskListPath, 'utf-8');
    
    // 태스크 정보 추출
    const taskInfo = extractTaskInfo(taskListContent, taskId);
    if (!taskInfo) {
      console.error(`❌ 태스크 ${taskId}를 찾을 수 없습니다.`);
      process.exit(1);
    }

    // 완료 보고서 템플릿 생성
    const report = generateReportTemplate(taskId, taskInfo);
    
    // 보고서 파일 저장
    const reportPath = path.join(__dirname, '..', 'docs', `${taskId}_COMPLETION_REPORT.md`);
    await fs.writeFile(reportPath, report, 'utf-8');
    
    console.log(`✅ 완료 보고서 생성 완료: ${reportPath}`);
    
    // WorkflowEngine 트리거 호출 (옵션)
    await triggerWorkflowEngine(taskId, taskInfo);
    
  } catch (error) {
    console.error('❌ 보고서 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

function extractTaskInfo(content, taskId) {
  const lines = content.split('\n');
  let taskName = '';
  let requirements = [];
  let subtasks = [];
  let inTask = false;
  let section = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 태스크 섹션 시작
    if (line.startsWith(`## ${taskId} `)) {
      inTask = true;
      taskName = line.replace(`## ${taskId} `, '').trim();
      continue;
    }
    
    // 다음 태스크 섹션 시작하면 종료
    if (inTask && line.startsWith('## T-') && !line.startsWith(`## ${taskId}`)) {
      break;
    }
    
    if (inTask) {
      // 섹션 헤더 감지
      if (line.startsWith('### 요구사항')) {
        section = 'requirements';
      } else if (line.startsWith('### 서브태스크')) {
        section = 'subtasks';
      } else if (line.startsWith('### ')) {
        section = 'other';
      }
      
      // 내용 수집
      if (section === 'requirements' && line.startsWith('- ')) {
        requirements.push(line.substring(2));
      } else if (section === 'subtasks' && /^\d+\./.test(line)) {
        subtasks.push(line);
      }
    }
  }
  
  if (!taskName) return null;
  
  return {
    name: taskName,
    requirements,
    subtasks
  };
}

function generateReportTemplate(taskId, taskInfo) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `# ${taskId} ${taskInfo.name} - 완료 보고서

## 📋 작업 개요

- **작업 ID**: ${taskId}
- **작업명**: ${taskInfo.name}
- **완료일**: ${dateStr}
- **상태**: ✅ 완료

---

## 🎯 작업 목표

${taskInfo.requirements.map(req => `- ${req}`).join('\n')}

---

## ✅ 완료된 작업

### 서브태스크 완료 현황
${taskInfo.subtasks.map(task => {
  // 자동 문서 생성 서브태스크는 제외
  if (task.includes('자동 완료 보고서 생성')) return '';
  return `- ✅ ${task}`;
}).filter(Boolean).join('\n')}

---

## 📊 작업 결과

### 성공 항목
- ✅ [구체적인 성공 항목을 입력하세요]

### 대기 중인 작업
- ⏳ [필요한 경우 대기 중인 작업을 입력하세요]

---

## 🔍 발견된 이슈 및 해결

### 이슈 1: [이슈 제목]
- **문제**: [문제 설명]
- **해결**: [해결 방법]
- **상태**: ✅ 해결됨

---

## 📝 다음 단계 권장사항

### 즉시 필요한 작업
1. [다음 작업 1]
2. [다음 작업 2]

### 다음 태스크
- [다음 태스크 정보]

---

## 📂 생성/수정된 파일

\`\`\`
✨ 신규 파일:
├── [새로 생성된 파일 목록]

📦 수정된 파일:
├── [수정된 파일 목록]
\`\`\`

---

## 🛠️ 개발 환경 상태

### 테스트 결과
- 단위 테스트: [통과/실패]
- 통합 테스트: [통과/실패]
- E2E 테스트: [통과/실패]

### 빌드 상태
- \`npm run build\`: [성공/실패]
- \`npm run type-check\`: [성공/실패]
- \`npm run lint\`: [성공/실패]

---

## 💡 참고사항

[추가적인 참고사항이나 주의사항을 입력하세요]

---

## 📈 진행률

\`\`\`
${taskId} ${taskInfo.name}: ████████████████████ 100%

서브태스크 완료율:
${taskInfo.subtasks.map((task, index) => {
  if (task.includes('자동 완료 보고서 생성')) return '';
  return `${index + 1}. ${task.split('. ')[1].substring(0, 30)}... [██████████] 100%`;
}).filter(Boolean).join('\n')}
\`\`\`

---

## 🎉 결론

${taskId} ${taskInfo.name} 작업이 성공적으로 완료되었습니다.

[작업 완료에 대한 종합적인 평가와 다음 단계에 대한 안내를 입력하세요]

---

**작성자**: PM System 2025 자동 문서 생성 시스템  
**작성일**: ${dateStr}  
**검토 상태**: ✅ 자동 생성됨

---

## 📞 지원

추가 지원이 필요하시면:
- \`docs/\` 폴더의 다른 문서 참조
- GitHub Issues에 문제 보고
- 마스터플랜 및 태스크리스트 확인
`;
}

async function triggerWorkflowEngine(taskId, taskInfo) {
  try {
    // WorkflowEngine 인스턴스 생성 및 트리거 실행
    // 현재는 로그만 출력
    console.log(`🔄 WorkflowEngine 트리거 호출: task-completed (${taskId})`);
    
    // 실제 구현 시:
    // const { WorkflowEngine } = require('../lib/documentation/automation/workflow-engine');
    // const engine = new WorkflowEngine();
    // await engine.executeTrigger('task-completed', { taskId, taskInfo });
    
  } catch (error) {
    console.warn('⚠️ WorkflowEngine 트리거 실행 실패:', error.message);
  }
}

// 스크립트 실행
generateCompletionReport(taskId);