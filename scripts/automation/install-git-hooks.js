#!/usr/bin/env node

// 🔧 Git 훅 설치 스크립트
// PM System 2025 - 자동화 워크플로우 설정

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 PM System 2025 Git 훅 설치 중...');

try {
  // 1. Git 저장소 확인
  if (!fs.existsSync('.git')) {
    console.error('❌ Git 저장소가 아닙니다.');
    process.exit(1);
  }

  // 2. 훅 디렉토리 확인
  const hooksDir = '.git/hooks';
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // 3. PM System 디렉토리 생성
  const pmSystemDir = '.git/pm-system';
  if (!fs.existsSync(pmSystemDir)) {
    fs.mkdirSync(pmSystemDir, { recursive: true });
  }

  // 4. 훅 파일 복사 및 권한 설정
  const hooks = [
    'pre-commit',
    'post-commit'
  ];

  const sourceDir = path.join(__dirname, '../git-hooks');

  for (const hook of hooks) {
    const sourcePath = path.join(sourceDir, hook);
    const targetPath = path.join(hooksDir, hook);

    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ 훅 파일을 찾을 수 없습니다: ${sourcePath}`);
      continue;
    }

    // 기존 훅 백업
    if (fs.existsSync(targetPath)) {
      const backupPath = `${targetPath}.backup.${Date.now()}`;
      fs.copyFileSync(targetPath, backupPath);
      console.log(`📦 기존 훅 백업: ${backupPath}`);
    }

    // 새 훅 복사
    fs.copyFileSync(sourcePath, targetPath);

    // 실행 권한 부여 (Unix/Linux/macOS)
    if (process.platform !== 'win32') {
      try {
        execSync(`chmod +x "${targetPath}"`);
      } catch (error) {
        console.warn(`⚠️ 권한 설정 실패: ${hook}`, error.message);
      }
    }

    console.log(`✅ 훅 설치 완료: ${hook}`);
  }

  // 5. 설정 파일 생성
  const configPath = path.join(pmSystemDir, 'config.json');
  const config = {
    version: '1.0.0',
    installedAt: new Date().toISOString(),
    hooks: {
      'pre-commit': {
        enabled: true,
        description: '커밋 전 타입 체크 및 린트 검사'
      },
      'post-commit': {
        enabled: true,
        description: '커밋 후 문서 자동 생성'
      }
    },
    automation: {
      documentGeneration: true,
      realtimeSync: true,
      qualityChecks: true
    },
    notifications: {
      console: true,
      file: true
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`📝 설정 파일 생성: ${configPath}`);

  // 6. README 생성
  const readmePath = path.join(pmSystemDir, 'README.md');
  const readmeContent = `# PM System 2025 Git 훅

## 설치된 훅

### pre-commit
- TypeScript 타입 체크
- ESLint 린트 검사
- 중요 문서 변경 감지
- 문서 생성 필요성 판단

### post-commit
- 자동 문서 생성 트리거
- 진행상황 업데이트
- 활동 로그 기록
- 실시간 동기화 시작

## 설정

설정은 \`.git/pm-system/config.json\`에서 수정할 수 있습니다.

## 로그

- 일일 활동: \`.git/pm-system/activity-YYYY-MM-DD.json\`
- 문서 생성 로그: \`.git/pm-system/documentation.log\`

## 비활성화

훅을 비활성화하려면:
\`\`\`bash
rm .git/hooks/pre-commit
rm .git/hooks/post-commit
\`\`\`

또는 파일명을 변경:
\`\`\`bash
mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled
mv .git/hooks/post-commit .git/hooks/post-commit.disabled
\`\`\`

## 문제 해결

문제가 발생한 경우:
1. \`.git/pm-system/activity-*.json\` 로그 확인
2. Node.js 버전 확인 (v20+ 권장)
3. 패키지 설치 상태 확인: \`npm install\`
4. TypeScript 설정 확인: \`npm run type-check\`
`;

  fs.writeFileSync(readmePath, readmeContent);

  // 7. 테스트 실행
  console.log('🧪 훅 테스트 실행...');
  
  try {
    // Pre-commit 훅 테스트
    const preCommitPath = path.join(hooksDir, 'pre-commit');
    if (fs.existsSync(preCommitPath)) {
      console.log('📋 Pre-commit 훅 구문 검사...');
      execSync(`node -c "${preCommitPath}"`);
      console.log('✅ Pre-commit 훅 구문 올바름');
    }

    // Post-commit 훅 테스트
    const postCommitPath = path.join(hooksDir, 'post-commit');
    if (fs.existsSync(postCommitPath)) {
      console.log('📋 Post-commit 훅 구문 검사...');
      execSync(`node -c "${postCommitPath}"`);
      console.log('✅ Post-commit 훅 구문 올바름');
    }

  } catch (testError) {
    console.error('❌ 훅 테스트 실패:', testError.message);
    console.error('설치는 완료되었지만 훅에 구문 오류가 있을 수 있습니다.');
  }

  // 8. 설치 완료 메시지
  console.log('\n🎉 PM System 2025 Git 훅 설치 완료!');
  console.log('\n📋 다음 기능이 활성화되었습니다:');
  console.log('  ✅ 커밋 전 자동 품질 검사');
  console.log('  ✅ 커밋 후 문서 자동 생성');
  console.log('  ✅ 실시간 진행상황 추적');
  console.log('  ✅ 중요 문서 변경 감지');
  
  console.log('\n🔍 설정 및 로그 위치:');
  console.log(`  📝 설정: ${configPath}`);
  console.log(`  📊 로그: ${pmSystemDir}/activity-*.json`);
  console.log(`  📖 문서: ${readmePath}`);

  console.log('\n💡 다음 커밋부터 자동화가 작동합니다.');

} catch (error) {
  console.error('❌ Git 훅 설치 실패:', error.message);
  console.error('스택 트레이스:', error.stack);
  process.exit(1);
}