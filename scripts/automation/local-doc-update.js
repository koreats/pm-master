#!/usr/bin/env node

// 📝 로컬 문서 업데이트 스크립트
// PM System 2025 - API 서버 없이 문서 자동 생성

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 명령행 인자로 페이로드 받기
const payloadArg = process.argv[2];
let payload = {};

try {
  payload = payloadArg ? JSON.parse(payloadArg) : {};
} catch (error) {
  console.warn('⚠️ 페이로드 파싱 실패, 기본 설정 사용');
}

console.log('📝 로컬 문서 업데이트 시작...');

const context = payload.context || {};
const { changedFiles = [], commitMessage = '', branch = 'main' } = context;

async function updateDocumentsLocally() {
  try {
    // 1. 프로젝트 루트 확인
    const projectRoot = process.cwd();
    console.log(`📁 프로젝트 루트: ${projectRoot}`);

    // 2. 패키지 정보 읽기
    let packageInfo = {};
    try {
      const packagePath = path.join(projectRoot, 'package.json');
      packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    } catch (error) {
      console.warn('⚠️ package.json 읽기 실패');
    }

    // 3. 마스터플랜 정보 분석
    const masterPlanPath = path.join(projectRoot, 'docs/마스터플랜.md');
    let masterPlanInfo = {
      totalTasks: 0,
      completedTasks: 0,
      currentPhase: 'Phase 1',
      estimatedCompletion: new Date()
    };

    if (fs.existsSync(masterPlanPath)) {
      try {
        const masterPlanContent = fs.readFileSync(masterPlanPath, 'utf-8');
        
        // 작업 ID 추출 (T-001, T-002 등)
        const taskIdMatches = masterPlanContent.match(/T-\d{3}/g) || [];
        masterPlanInfo.totalTasks = new Set(taskIdMatches).size;

        // 완료된 작업 추정 (체크 마크 기준)
        const completedMatches = masterPlanContent.match(/- \[x\]/gi) || [];
        masterPlanInfo.completedTasks = completedMatches.length;

        // 현재 단계 추정
        const progress = masterPlanInfo.completedTasks / Math.max(masterPlanInfo.totalTasks, 1);
        if (progress >= 0.75) masterPlanInfo.currentPhase = 'Phase 4';
        else if (progress >= 0.5) masterPlanInfo.currentPhase = 'Phase 3';
        else if (progress >= 0.25) masterPlanInfo.currentPhase = 'Phase 2';

        console.log(`📋 마스터플랜 분석: ${masterPlanInfo.completedTasks}/${masterPlanInfo.totalTasks} 작업 완료`);

      } catch (error) {
        console.warn('⚠️ 마스터플랜 분석 실패:', error.message);
      }
    }

    // 4. 프로젝트 구조 분석
    const projectStats = {
      totalFiles: 0,
      typeScriptFiles: 0,
      componentFiles: 0,
      apiFiles: 0,
      testFiles: 0,
      lastUpdated: new Date()
    };

    try {
      // 파일 통계 수집
      const getFileStats = (dir, stats = projectStats) => {
        if (!fs.existsSync(dir) || path.basename(dir) === 'node_modules') return;
        
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            getFileStats(fullPath, stats);
          } else {
            stats.totalFiles++;
            
            if (item.endsWith('.ts') || item.endsWith('.tsx')) {
              stats.typeScriptFiles++;
              
              if (fullPath.includes('components/')) {
                stats.componentFiles++;
              }
              
              if (fullPath.includes('app/api/')) {
                stats.apiFiles++;
              }
            }
            
            if (item.includes('.test.') || item.includes('.spec.')) {
              stats.testFiles++;
            }
          }
        }
        
        return stats;
      };

      getFileStats('.');
      console.log(`📊 프로젝트 통계: ${projectStats.totalFiles}개 파일, ${projectStats.typeScriptFiles}개 TS 파일`);

    } catch (error) {
      console.warn('⚠️ 프로젝트 구조 분석 실패:', error.message);
    }

    // 5. 진행상황 리포트 생성
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const progressReport = generateProgressReport({
      timestamp,
      masterPlanInfo,
      projectStats,
      packageInfo,
      commitInfo: {
        branch,
        message: commitMessage,
        files: changedFiles
      }
    });

    // 6. 리포트 파일 저장
    const reportsDir = path.join(projectRoot, 'docs/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFileName = `진행상황-${new Date().toISOString().split('T')[0]}.md`;
    const reportPath = path.join(reportsDir, reportFileName);
    
    fs.writeFileSync(reportPath, progressReport);
    console.log(`📄 진행상황 리포트 생성: ${reportPath}`);

    // 7. 최신 리포트 링크 업데이트
    const latestReportPath = path.join(projectRoot, 'docs/최신-진행상황.md');
    fs.writeFileSync(latestReportPath, progressReport);
    console.log(`🔗 최신 리포트 업데이트: ${latestReportPath}`);

    // 8. 컴포넌트 문서 자동 생성
    const componentFiles = changedFiles.filter(file =>
      file.includes('components/') && (file.endsWith('.tsx') || file.endsWith('.ts'))
    );

    if (componentFiles.length > 0) {
      console.log(`🧩 컴포넌트 문서 업데이트: ${componentFiles.length}개`);
      await updateComponentDocs(componentFiles);
    }

    // 9. API 문서 자동 생성
    const apiFiles = changedFiles.filter(file =>
      file.includes('app/api/') && file.endsWith('route.ts')
    );

    if (apiFiles.length > 0) {
      console.log(`🌐 API 문서 업데이트: ${apiFiles.length}개`);
      await updateApiDocs(apiFiles);
    }

    // 10. 활동 로그 기록
    await logActivity({
      timestamp: new Date(),
      type: 'local_doc_update',
      branch,
      commitMessage,
      changedFiles,
      reportsGenerated: [reportFileName],
      stats: projectStats
    });

    console.log('✅ 로컬 문서 업데이트 완료');

  } catch (error) {
    console.error('❌ 로컬 문서 업데이트 실패:', error.message);
    process.exit(1);
  }
}

/**
 * 진행상황 리포트 생성
 */
function generateProgressReport(data) {
  const { timestamp, masterPlanInfo, projectStats, packageInfo, commitInfo } = data;
  
  const progressPercentage = Math.round(
    (masterPlanInfo.completedTasks / Math.max(masterPlanInfo.totalTasks, 1)) * 100
  );

  return `# PM System 2025 진행상황 리포트

> 생성일시: ${timestamp}
> 자동 생성됨 - 로컬 문서 업데이트

## 📊 전체 진행 상황

- **현재 단계**: ${masterPlanInfo.currentPhase}
- **완료률**: ${progressPercentage}% (${masterPlanInfo.completedTasks}/${masterPlanInfo.totalTasks} 작업)
- **프로젝트 버전**: ${packageInfo.version || '1.0.0'}

### 진행률 바
${'█'.repeat(Math.floor(progressPercentage / 5))}${'░'.repeat(20 - Math.floor(progressPercentage / 5))} ${progressPercentage}%

## 📁 프로젝트 통계

| 항목 | 수량 |
|------|------|
| 전체 파일 | ${projectStats.totalFiles}개 |
| TypeScript 파일 | ${projectStats.typeScriptFiles}개 |
| React 컴포넌트 | ${projectStats.componentFiles}개 |
| API 엔드포인트 | ${projectStats.apiFiles}개 |
| 테스트 파일 | ${projectStats.testFiles}개 |

## 🔄 최근 변경사항

**브랜치**: ${commitInfo.branch}
**커밋 메시지**: ${commitInfo.message || '정보 없음'}

### 변경된 파일 (${commitInfo.files.length}개)

${commitInfo.files.length > 0 
  ? commitInfo.files.map(file => `- \`${file}\``).join('\n')
  : '변경된 파일 정보 없음'
}

## 📈 품질 지표

- **TypeScript 적용률**: ${Math.round((projectStats.typeScriptFiles / Math.max(projectStats.totalFiles, 1)) * 100)}%
- **컴포넌트 구조화**: ${projectStats.componentFiles > 0 ? '✅' : '⏳'}
- **API 구현**: ${projectStats.apiFiles > 0 ? '✅' : '⏳'}
- **테스트 작성**: ${projectStats.testFiles > 0 ? '✅' : '⏳'}

## 🎯 다음 단계

${getNextSteps(masterPlanInfo, progressPercentage)}

## 🔧 기술 스택

- **프레임워크**: ${packageInfo.dependencies?.['next'] ? 'Next.js' : 'React'}
- **언어**: TypeScript
- **UI**: ${packageInfo.dependencies?.['@radix-ui/react-slot'] ? 'Radix UI + shadcn/ui' : 'Custom'}
- **데이터베이스**: ${packageInfo.dependencies?.['@supabase/supabase-js'] ? 'Supabase' : 'TBD'}
- **상태관리**: ${packageInfo.dependencies?.['zustand'] ? 'Zustand' : 'React State'}

---

*이 리포트는 Git 커밋 시 자동으로 생성됩니다.*
`;
}

/**
 * 다음 단계 제안
 */
function getNextSteps(masterPlanInfo, progressPercentage) {
  if (progressPercentage < 25) {
    return `- [ ] 프로젝트 기본 구조 완성
- [ ] 핵심 컴포넌트 구현
- [ ] 기본 라우팅 설정`;
  } else if (progressPercentage < 50) {
    return `- [ ] 주요 기능 구현
- [ ] 데이터베이스 연동
- [ ] 인증 시스템 구축`;
  } else if (progressPercentage < 75) {
    return `- [ ] 고급 기능 구현
- [ ] 성능 최적화
- [ ] 테스트 작성`;
  } else {
    return `- [ ] 최종 테스트 및 배포 준비
- [ ] 문서화 완성
- [ ] 성능 점검`;
  }
}

/**
 * 컴포넌트 문서 업데이트
 */
async function updateComponentDocs(componentFiles) {
  const docsDir = 'docs/components';
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  for (const file of componentFiles) {
    try {
      const componentName = path.basename(file, path.extname(file));
      const docPath = path.join(docsDir, `${componentName}.md`);
      
      // 기본 컴포넌트 문서 생성
      const docContent = `# ${componentName}

> 파일: \`${file}\`
> 업데이트: ${new Date().toLocaleString('ko-KR')}

## 설명

${componentName} 컴포넌트

## 사용법

\`\`\`tsx
import { ${componentName} } from './${file.replace('.tsx', '')}';

<${componentName} />
\`\`\`

## Props

| 이름 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| - | - | - | - |

*자동 생성된 문서입니다. 실제 구현에 따라 수정해주세요.*
`;

      fs.writeFileSync(docPath, docContent);
      console.log(`  📝 ${componentName} 문서 생성`);

    } catch (error) {
      console.warn(`  ⚠️ ${file} 문서 생성 실패:`, error.message);
    }
  }
}

/**
 * API 문서 업데이트
 */
async function updateApiDocs(apiFiles) {
  const docsDir = 'docs/api';
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  for (const file of apiFiles) {
    try {
      const routeName = file.replace('app/api/', '').replace('/route.ts', '');
      const docPath = path.join(docsDir, `${routeName.replace('/', '-')}.md`);
      
      // 기본 API 문서 생성
      const docContent = `# ${routeName} API

> 파일: \`${file}\`
> 업데이트: ${new Date().toLocaleString('ko-KR')}

## 엔드포인트

\`GET/POST/PUT/DELETE /api/${routeName}\`

## 설명

${routeName} API 엔드포인트

## 요청

### 매개변수

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| - | - | - | - |

## 응답

### 성공 (200)

\`\`\`json
{
  "message": "성공"
}
\`\`\`

### 오류 (400, 500)

\`\`\`json
{
  "error": "오류 메시지"
}
\`\`\`

*자동 생성된 문서입니다. 실제 구현에 따라 수정해주세요.*
`;

      fs.writeFileSync(docPath, docContent);
      console.log(`  🌐 ${routeName} API 문서 생성`);

    } catch (error) {
      console.warn(`  ⚠️ ${file} API 문서 생성 실패:`, error.message);
    }
  }
}

/**
 * 활동 로그 기록
 */
async function logActivity(activityData) {
  try {
    const logDir = '.git/pm-system';
    const logFile = path.join(logDir, `activity-${new Date().toISOString().split('T')[0]}.json`);
    
    let existingLogs = [];
    if (fs.existsSync(logFile)) {
      try {
        existingLogs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      } catch (error) {
        console.warn('⚠️ 기존 로그 읽기 실패');
      }
    }

    existingLogs.push(activityData);
    fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));
    
  } catch (error) {
    console.warn('⚠️ 활동 로그 기록 실패:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  updateDocumentsLocally().catch(console.error);
}