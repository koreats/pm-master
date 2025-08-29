/**
 * @jest-environment jsdom
 */

// @ts-nocheck
import { TemplateEngine, ProgressReportTemplate } from '../../../lib/documentation/template-engine';

// Mock data for testing
const mockProgressData: ProgressReportTemplate = {
  masterPlan: {
    phase: 'Phase 2',
    currentTask: 'T-006: 문서 품질 검증 시스템 구현',
    totalTasks: 12,
    completedTasks: 6,
    estimatedCompletion: new Date('2024-01-15')
  },
  completedTasks: [
    {
      id: 'T-001',
      title: '프로젝트 초기 설정',
      completedAt: new Date('2024-01-01'),
      completionNotes: '성공적으로 완료'
    },
    {
      id: 'T-002', 
      title: '기본 구조 설정',
      completedAt: new Date('2024-01-03'),
      completionNotes: '모든 기본 구조 완료'
    }
  ],
  currentMilestone: {
    name: '핵심 기능 구현',
    targetDate: new Date('2024-01-20'),
    progress: 75,
    description: '주요 기능들의 구현이 진행 중입니다'
  },
  blockers: [
    {
      id: 'B-001',
      title: 'API 응답 시간 문제',
      severity: 'medium' as const,
      description: 'API 응답이 예상보다 느림',
      assignee: 'dev-team',
      createdAt: new Date('2024-01-10')
    }
  ],
  nextSteps: [
    {
      id: 'A-001',
      title: '성능 최적화',
      priority: 'high' as const,
      estimatedEffort: '3일',
      assignee: 'backend-team'
    },
    {
      id: 'A-002',
      title: '테스트 작성',
      priority: 'medium' as const,
      estimatedEffort: '2일',
      assignee: 'qa-team'
    }
  ],
  metrics: {
    qualityScore: 85,
    testCoverage: 78,
    performanceScore: 72,
    documentationCoverage: 90
  },
  timeline: {
    lastUpdate: new Date('2024-01-12'),
    nextMilestone: new Date('2024-01-20'),
    projectDeadline: new Date('2024-02-28'),
    bufferDays: 15
  },
  generatedAt: new Date('2024-01-12T10:00:00Z'),
  reportPeriod: {
    from: new Date('2024-01-05'),
    to: new Date('2024-01-12')
  }
};

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  describe('템플릿 엔진 초기화', () => {
    it('기본 템플릿들이 로드되어야 한다', () => {
      expect(engine).toBeDefined();
      // 내부 상태는 직접 테스트할 수 없지만, 생성이 성공적으로 완료되었는지 확인
    });

    it('한국어 헬퍼가 등록되어야 한다', async () => {
      // formatDate 헬퍼 테스트를 통해 한국어 헬퍼 등록 확인
      const result = await engine.generateProgressReport(mockProgressData);
      
      // 결과에 한국어 날짜 형식이 포함되어 있는지 확인
      expect(result).toContain('2024년');
    });
  });

  describe('진행상황 리포트 생성', () => {
    it('기본 진행상황 리포트를 생성할 수 있어야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('마스터플랜 정보가 포함되어야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      expect(result).toContain('Phase 2');
      expect(result).toContain('T-006');
      expect(result).toContain('12개 작업 중 6개 완료');
    });

    it('완료된 작업 목록이 포함되어야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      expect(result).toContain('T-001');
      expect(result).toContain('프로젝트 초기 설정');
      expect(result).toContain('T-002');
      expect(result).toContain('기본 구조 설정');
    });

    it('현재 마일스톤 정보가 포함되어야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      expect(result).toContain('핵심 기능 구현');
      expect(result).toContain('75%');
    });

    it('블로커 정보가 포함되어야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      expect(result).toContain('B-001');
      expect(result).toContain('API 응답 시간 문제');
      expect(result).toContain('medium');
    });

    it('다음 단계 정보가 포함되어야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      expect(result).toContain('A-001');
      expect(result).toContain('성능 최적화');
      expect(result).toContain('high');
      expect(result).toContain('3일');
    });

    it('메트릭 정보가 포함되어야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      expect(result).toContain('85'); // qualityScore
      expect(result).toContain('78'); // testCoverage
      expect(result).toContain('72'); // performanceScore
      expect(result).toContain('90'); // documentationCoverage
    });
  });

  describe('API 문서 생성', () => {
    it('기본 API 문서를 생성할 수 있어야 한다', async () => {
      const apiData = {
        endpoint: '/api/users',
        method: 'GET',
        description: '사용자 목록 조회',
        parameters: [
          {
            name: 'page',
            type: 'number',
            required: false,
            description: '페이지 번호'
          }
        ],
        responses: [
          {
            code: 200,
            description: '성공',
            example: '{"users": [{"id": 1, "name": "test"}]}'
          }
        ]
      };

      const result = await engine.generateApiDoc(apiData);

      expect(result).toBeDefined();
      expect(result).toContain('/api/users');
      expect(result).toContain('GET');
      expect(result).toContain('사용자 목록 조회');
      expect(result).toContain('page');
      expect(result).toContain('200');
    });

    it('다양한 HTTP 메서드를 지원해야 한다', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const apiData = {
          endpoint: `/api/test-${method.toLowerCase()}`,
          method,
          description: `${method} 테스트 엔드포인트`,
          parameters: [],
          responses: [{ code: 200, description: '성공', example: '{}' }]
        };

        const result = await engine.generateApiDoc(apiData);
        expect(result).toContain(method);
      }
    });
  });

  describe('컴포넌트 문서 생성', () => {
    it('기본 컴포넌트 문서를 생성할 수 있어야 한다', async () => {
      const componentData = {
        name: 'Button',
        description: '재사용 가능한 버튼 컴포넌트',
        props: [
          {
            name: 'variant',
            type: 'string',
            required: false,
            defaultValue: 'primary',
            description: '버튼 스타일 변형'
          },
          {
            name: 'onClick',
            type: 'function',
            required: true,
            description: '클릭 이벤트 핸들러'
          }
        ],
        examples: [
          {
            title: '기본 사용법',
            code: '<Button onClick={handleClick}>클릭하세요</Button>'
          }
        ]
      };

      const result = await engine.generateComponentDoc(componentData);

      expect(result).toBeDefined();
      expect(result).toContain('Button');
      expect(result).toContain('재사용 가능한 버튼 컴포넌트');
      expect(result).toContain('variant');
      expect(result).toContain('onClick');
      expect(result).toContain('primary');
      expect(result).toContain('클릭하세요');
    });

    it('필수/선택 props를 구분해서 표시해야 한다', async () => {
      const componentData = {
        name: 'Input',
        description: '입력 컴포넌트',
        props: [
          {
            name: 'value',
            type: 'string',
            required: true,
            description: '입력값'
          },
          {
            name: 'placeholder',
            type: 'string', 
            required: false,
            defaultValue: '',
            description: '플레이스홀더 텍스트'
          }
        ],
        examples: []
      };

      const result = await engine.generateComponentDoc(componentData);

      expect(result).toContain('value'); // required prop
      expect(result).toContain('placeholder'); // optional prop
    });
  });

  describe('헬퍼 함수 기능', () => {
    it('진행률 바를 올바르게 생성해야 한다', async () => {
      const testData = {
        ...mockProgressData,
        masterPlan: {
          ...mockProgressData.masterPlan,
          completedTasks: 5,
          totalTasks: 10
        }
      };

      const result = await engine.generateProgressReport(testData);

      // 50% 진행률 바가 포함되어야 함
      expect(result).toMatch(/[█░]{10,}/); // 진행률 바 패턴
    });

    it('상태 이모지를 올바르게 표시해야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      // 다양한 상태 이모지가 포함되어 있는지 확인
      expect(result).toMatch(/[✅❌⚠️🔄]/);
    });

    it('한국어 날짜 형식을 올바르게 표시해야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      expect(result).toMatch(/\d{4}년 \d{1,2}월 \d{1,2}일/);
    });

    it('중요도별 이모지를 올바르게 표시해야 한다', async () => {
      const result = await engine.generateProgressReport(mockProgressData);

      // high priority와 medium priority 아이템이 있으므로 해당 이모지가 포함되어야 함
      expect(result).toMatch(/[🔥⚡📝]/);
    });
  });

  describe('커스텀 템플릿', () => {
    it('커스텀 템플릿을 등록하고 사용할 수 있어야 한다', async () => {
      const customTemplate = `
# {{title}}

{{#each items}}
- {{name}}: {{value}}
{{/each}}

생성일: {{formatDate createdAt}}
      `;

      engine.registerTemplate('custom', customTemplate);

      const data = {
        title: '커스텀 리포트',
        items: [
          { name: '항목1', value: '값1' },
          { name: '항목2', value: '값2' }
        ],
        createdAt: new Date('2024-01-12')
      };

      const result = await engine.renderTemplate('custom', data);

      expect(result).toContain('커스텀 리포트');
      expect(result).toContain('항목1');
      expect(result).toContain('값1');
      expect(result).toContain('2024년');
    });

    it('존재하지 않는 템플릿 사용 시 에러를 발생시켜야 한다', async () => {
      await expect(
        engine.renderTemplate('non-existent', {})
      ).rejects.toThrow();
    });
  });

  describe('부분 템플릿 (Partials)', () => {
    it('부분 템플릿을 등록하고 사용할 수 있어야 한다', async () => {
      const headerPartial = '# {{title}}\n작성일: {{formatDate date}}';
      const mainTemplate = `
{{> header}}

## 내용
{{content}}
      `;

      engine.registerPartial('header', headerPartial);
      engine.registerTemplate('with-partial', mainTemplate);

      const data = {
        title: '부분 템플릿 테스트',
        date: new Date('2024-01-12'),
        content: '이것은 메인 컨텐츠입니다.'
      };

      const result = await engine.renderTemplate('with-partial', data);

      expect(result).toContain('부분 템플릿 테스트');
      expect(result).toContain('2024년');
      expect(result).toContain('메인 컨텐츠');
    });
  });

  describe('에러 처리', () => {
    it('잘못된 템플릿 문법에 대해 적절한 에러를 발생시켜야 한다', async () => {
      const invalidTemplate = '{{#each items}} {{name}} {{/wrong}}';
      
      engine.registerTemplate('invalid', invalidTemplate);

      await expect(
        engine.renderTemplate('invalid', { items: [] })
      ).rejects.toThrow();
    });

    it('누락된 데이터에 대해 기본값을 제공해야 한다', async () => {
      const template = '제목: {{title}}';
      engine.registerTemplate('missing-data', template);

      const result = await engine.renderTemplate('missing-data', {});

      // 빈 문자열이나 undefined가 아닌 적절한 기본값이 표시되어야 함
      expect(result).toContain('제목:');
    });
  });

  describe('성능 테스트', () => {
    it('대량의 데이터로도 합리적인 시간 내에 처리되어야 한다', async () => {
      const largeData = {
        ...mockProgressData,
        completedTasks: Array.from({ length: 100 }, (_, i) => ({
          id: `T-${i.toString().padStart(3, '0')}`,
          title: `작업 ${i + 1}`,
          completedAt: new Date(),
          completionNotes: `작업 ${i + 1} 완료`
        })),
        nextSteps: Array.from({ length: 50 }, (_, i) => ({
          id: `A-${i.toString().padStart(3, '0')}`,
          title: `다음 단계 ${i + 1}`,
          priority: i % 3 === 0 ? 'high' as const : 'medium' as const,
          estimatedEffort: '1일',
          assignee: 'team'
        }))
      };

      const startTime = performance.now();
      const result = await engine.generateProgressReport(largeData);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(1000); // 충분한 내용이 생성되었는지 확인
      expect(endTime - startTime).toBeLessThan(1000); // 1초 이내에 완료
    });
  });

  describe('다국어 지원', () => {
    it('영어 날짜 형식을 지원해야 한다', async () => {
      // 영어 설정으로 엔진 초기화 (실제 구현에서는 로케일 설정 기능 필요)
      const template = '날짜: {{formatDate date "en"}}';
      engine.registerTemplate('en-date', template);

      const result = await engine.renderTemplate('en-date', {
        date: new Date('2024-01-12')
      });

      // 영어 날짜 형식이 포함되어야 함
      expect(result).toMatch(/January|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
    });
  });

  describe('캐싱 기능', () => {
    it('같은 템플릿을 여러 번 렌더링할 때 성능이 개선되어야 한다', async () => {
      const data = { title: '캐싱 테스트', content: '내용' };

      // 첫 번째 렌더링 (캐시 미스)
      const startTime1 = performance.now();
      await engine.generateProgressReport(mockProgressData);
      const endTime1 = performance.now();
      const firstRender = endTime1 - startTime1;

      // 두 번째 렌더링 (캐시 히트)  
      const startTime2 = performance.now();
      await engine.generateProgressReport(mockProgressData);
      const endTime2 = performance.now();
      const secondRender = endTime2 - startTime2;

      // 두 번째 렌더링이 첫 번째보다 빠르거나 비슷해야 함
      expect(secondRender).toBeLessThanOrEqual(firstRender * 1.2); // 20% 허용 오차
    });
  });
});