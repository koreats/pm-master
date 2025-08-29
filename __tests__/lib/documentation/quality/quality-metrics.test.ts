/**
 * @jest-environment jsdom
 */

import { 
  QualityMetricsTracker, 
  QualityMetrics, 
  QualityTrend,
  qualityMetricsTracker 
} from '../../../../lib/documentation/quality/quality-metrics';

describe('QualityMetricsTracker', () => {
  let tracker: QualityMetricsTracker;

  beforeEach(() => {
    tracker = new QualityMetricsTracker();
  });

  describe('메트릭 추적 기본 기능', () => {
    it('문서 품질 메트릭을 정확히 추적해야 한다', async () => {
      const content = `
# 테스트 문서

이것은 테스트 문서입니다. 여러 문단으로 구성되어 있습니다.

## 섹션 1

첫 번째 섹션입니다. 적절한 길이의 내용을 포함합니다.

\`\`\`typescript
const example = "code example";
\`\`\`

## 섹션 2

두 번째 섹션입니다. [링크 예시](https://example.com)와 함께 제공됩니다.

![이미지 예시](https://example.com/image.png)
      `;

      const mockQualityReport = {
        overallScore: 85,
        totalRules: 10,
        passedRules: 8,
        categories: {
          completeness: { score: 90 },
          accuracy: { score: 85 },
          consistency: { score: 80 },
          readability: { score: 88 },
          structure: { score: 92 },
          korean_standards: { score: 75 },
          technical_accuracy: { score: 95 },
          accessibility: { score: 70 }
        }
      };

      const metrics = await tracker.trackQualityMetrics(
        'test-doc.md', 
        content, 
        mockQualityReport
      );

      expect(metrics).toBeDefined();
      expect(metrics.documentPath).toBe('test-doc.md');
      expect(metrics.metrics.overallScore).toBe(85);
      expect(metrics.metrics.contentMetrics.wordCount).toBeGreaterThan(0);
      expect(metrics.metrics.contentMetrics.headingCount).toBe(3); // H1, H2, H2
      expect(metrics.metrics.contentMetrics.codeBlockCount).toBe(1);
      expect(metrics.metrics.contentMetrics.linkCount).toBe(1);
      expect(metrics.metrics.contentMetrics.imageCount).toBe(1);
    });

    it('내용 분석이 정확해야 한다', async () => {
      const content = `
# 제목

이것은 테스트 문서입니다.

## 하위 제목 1

첫 번째 문단입니다. 여러 단어로 구성되어 있습니다.

두 번째 문단입니다. 

## 하위 제목 2

\`\`\`javascript
console.log("hello");
\`\`\`

\`\`\`typescript
const test: string = "world";
\`\`\`

[Google](https://google.com)
[GitHub](https://github.com)

![Image 1](img1.png)
![Image 2](img2.jpg)
      `;

      const mockReport = {
        overallScore: 80,
        totalRules: 5,
        passedRules: 4,
        categories: {}
      };

      const metrics = await tracker.trackQualityMetrics('test.md', content, mockReport);

      expect(metrics.metrics.contentMetrics.headingCount).toBe(3);
      expect(metrics.metrics.contentMetrics.codeBlockCount).toBe(2);
      expect(metrics.metrics.contentMetrics.linkCount).toBe(2);
      expect(metrics.metrics.contentMetrics.imageCount).toBe(2);
      expect(metrics.metrics.contentMetrics.paragraphCount).toBeGreaterThan(1);
    });

    it('가독성 메트릭을 올바르게 계산해야 한다', async () => {
      const content = `
# 가독성 테스트

이것은 짧은 문장입니다. 이것도 짧은 문장입니다.

이것은 아주 길고 복잡한 문장으로, 여러 절과 구문을 포함하고 있으며, 콤마를 많이 사용하여, 읽기 어렵게 만들어진, 예시 문장입니다. 이런 문장은 복잡한 문장으로 분류됩니다.

문서는 작성되어 있습니다. 내용이 제공되고 있습니다. 정보가 전달되었습니다.
      `;

      const mockReport = {
        overallScore: 75,
        totalRules: 3,
        passedRules: 2,
        categories: {}
      };

      const metrics = await tracker.trackQualityMetrics('readability.md', content, mockReport);

      expect(metrics.metrics.readabilityMetrics.averageSentenceLength).toBeGreaterThan(0);
      expect(metrics.metrics.readabilityMetrics.averageParagraphLength).toBeGreaterThan(0);
      expect(metrics.metrics.readabilityMetrics.complexSentenceRatio).toBeLessThanOrEqual(1);
      expect(metrics.metrics.readabilityMetrics.passiveVoiceRatio).toBeGreaterThan(0); // "작성되어", "제공되고", "전달되었습니다"
    });
  });

  describe('문서 타입 감지', () => {
    it('경로 기반으로 문서 타입을 정확히 감지해야 한다', async () => {
      const testCases = [
        { path: 'progress-report.md', expectedType: 'progress_report' },
        { path: 'api/users/route.md', expectedType: 'api_doc' },
        { path: 'components/Button.md', expectedType: 'component_doc' },
        { path: 'README.md', expectedType: 'readme' },
        { path: 'user-guide.md', expectedType: 'general' }
      ];

      const mockReport = {
        overallScore: 80,
        totalRules: 1,
        passedRules: 1,
        categories: {}
      };

      for (const testCase of testCases) {
        const metrics = await tracker.trackQualityMetrics(
          testCase.path,
          'test content',
          mockReport
        );
        
        expect(metrics.documentType).toBe(testCase.expectedType);
      }
    });

    it('내용 기반으로 문서 타입을 감지해야 한다', async () => {
      const testCases = [
        { content: 'API 엔드포인트 설명', expectedType: 'api_doc' },
        { content: '컴포넌트 사용법 가이드', expectedType: 'component_doc' },
        { content: '사용법: 이 도구를 사용하려면...', expectedType: 'user_guide' }
      ];

      const mockReport = {
        overallScore: 80,
        totalRules: 1,
        passedRules: 1,
        categories: {}
      };

      for (const testCase of testCases) {
        const metrics = await tracker.trackQualityMetrics(
          'test.md',
          testCase.content,
          mockReport
        );
        
        expect(metrics.documentType).toBe(testCase.expectedType);
      }
    });
  });

  describe('권장사항 생성', () => {
    it('짧은 문서에 대해 길이 확장 권장사항을 제공해야 한다', async () => {
      const shortContent = 'Very short content';
      
      const mockReport = {
        overallScore: 50,
        totalRules: 5,
        passedRules: 2,
        categories: {}
      };

      const metrics = await tracker.trackQualityMetrics('short.md', shortContent, mockReport);

      const lengthRecommendation = metrics.recommendations.find(r => r.id === 'content_length');
      expect(lengthRecommendation).toBeDefined();
      expect(lengthRecommendation?.priority).toBe('high');
      expect(lengthRecommendation?.estimatedImpact).toBeGreaterThan(5);
    });

    it('제목이 없는 문서에 대해 구조 권장사항을 제공해야 한다', async () => {
      const contentWithoutHeadings = 'This is content without any headings. It has some text but no structure.';
      
      const mockReport = {
        overallScore: 60,
        totalRules: 5,
        passedRules: 3,
        categories: {}
      };

      const metrics = await tracker.trackQualityMetrics('no-headings.md', contentWithoutHeadings, mockReport);

      const headingRecommendation = metrics.recommendations.find(r => r.id === 'add_headings');
      expect(headingRecommendation).toBeDefined();
      expect(headingRecommendation?.category).toBe('structure');
    });

    it('복잡한 문서에 대해 가독성 권장사항을 제공해야 한다', async () => {
      const complexContent = 'a'.repeat(200).split('').join(' '); // 매우 긴 문장
      
      const mockReport = {
        overallScore: 70,
        totalRules: 5,
        passedRules: 3,
        categories: {}
      };

      const metrics = await tracker.trackQualityMetrics('complex.md', complexContent, mockReport);

      const sentenceLengthRecommendation = metrics.recommendations.find(r => r.id === 'sentence_length');
      expect(sentenceLengthRecommendation).toBeDefined();
      expect(sentenceLengthRecommendation?.category).toBe('readability');
    });
  });

  describe('품질 트렌드 분석', () => {
    it('충분한 기록이 있을 때 트렌드를 계산할 수 있어야 한다', async () => {
      const documentPath = 'trending-doc.md';
      
      // 여러 메트릭 기록 생성
      const baseReport = {
        totalRules: 5,
        passedRules: 3,
        categories: {}
      };

      // 점수가 향상되는 시나리오
      await tracker.trackQualityMetrics(documentPath, 'content v1', { ...baseReport, overallScore: 60 });
      await tracker.trackQualityMetrics(documentPath, 'content v2', { ...baseReport, overallScore: 70 });
      await tracker.trackQualityMetrics(documentPath, 'content v3', { ...baseReport, overallScore: 80 });

      const trend = await tracker.getQualityTrend(documentPath, 30);

      expect(trend).toBeDefined();
      expect(trend!.summary.overallTrend).toBe('improving');
      expect(trend!.dataPoints.length).toBe(3);
      expect(trend!.summary.bestScore).toBe(80);
      expect(trend!.summary.worstScore).toBe(60);
    });

    it('기록이 부족할 때는 null을 반환해야 한다', async () => {
      const trend = await tracker.getQualityTrend('non-existent-doc.md');
      expect(trend).toBeNull();

      // 기록이 하나만 있는 경우
      await tracker.trackQualityMetrics('single-record.md', 'content', {
        overallScore: 75,
        totalRules: 3,
        passedRules: 2,
        categories: {}
      });

      const singleRecordTrend = await tracker.getQualityTrend('single-record.md');
      expect(singleRecordTrend).toBeNull();
    });
  });

  describe('품질 대시보드', () => {
    it('전체 품질 대시보드 데이터를 제공해야 한다', async () => {
      // 다양한 품질 수준의 문서 생성
      const documents = [
        { path: 'excellent.md', score: 95 },
        { path: 'good1.md', score: 85 },
        { path: 'good2.md', score: 80 },
        { path: 'fair1.md', score: 70 },
        { path: 'fair2.md', score: 65 },
        { path: 'poor1.md', score: 50 },
        { path: 'poor2.md', score: 45 }
      ];

      for (const doc of documents) {
        await tracker.trackQualityMetrics(doc.path, 'content', {
          overallScore: doc.score,
          totalRules: 10,
          passedRules: Math.floor(doc.score / 10),
          categories: {}
        });
      }

      const dashboard = tracker.getQualityDashboard();

      expect(dashboard.totalDocuments).toBe(7);
      expect(dashboard.averageQuality).toBeGreaterThan(0);
      expect(dashboard.documentsByQuality.excellent).toBe(1); // 95
      expect(dashboard.documentsByQuality.good).toBe(2); // 85, 80
      expect(dashboard.documentsByQuality.fair).toBe(2); // 70, 65
      expect(dashboard.documentsByQuality.poor).toBe(2); // 50, 45
    });

    it('빈 상태에서도 대시보드가 작동해야 한다', () => {
      const dashboard = tracker.getQualityDashboard();

      expect(dashboard.totalDocuments).toBe(0);
      expect(dashboard.averageQuality).toBe(0);
      expect(dashboard.documentsByQuality.excellent).toBe(0);
      expect(dashboard.documentsByQuality.good).toBe(0);
      expect(dashboard.documentsByQuality.fair).toBe(0);
      expect(dashboard.documentsByQuality.poor).toBe(0);
    });
  });

  describe('메트릭 내보내기/가져오기', () => {
    it('메트릭을 JSON으로 내보낼 수 있어야 한다', async () => {
      await tracker.trackQualityMetrics('test1.md', 'content1', {
        overallScore: 80,
        totalRules: 5,
        passedRules: 4,
        categories: {}
      });

      await tracker.trackQualityMetrics('test2.md', 'content2', {
        overallScore: 90,
        totalRules: 5,
        passedRules: 5,
        categories: {}
      });

      const exportedData = tracker.exportMetrics();
      const parsedData = JSON.parse(exportedData);

      expect(parsedData).toBeDefined();
      expect(parsedData['test1.md']).toBeDefined();
      expect(parsedData['test2.md']).toBeDefined();
      expect(Array.isArray(parsedData['test1.md'])).toBe(true);
    });

    it('특정 문서의 메트릭만 내보낼 수 있어야 한다', async () => {
      await tracker.trackQualityMetrics('specific.md', 'content', {
        overallScore: 75,
        totalRules: 3,
        passedRules: 2,
        categories: {}
      });

      const exportedData = tracker.exportMetrics('specific.md');
      const parsedData = JSON.parse(exportedData);

      expect(Object.keys(parsedData)).toEqual(['specific.md']);
      expect(parsedData['specific.md']).toBeDefined();
    });

    it('JSON 데이터를 가져올 수 있어야 한다', () => {
      const mockData = {
        'imported.md': [{
          timestamp: new Date().toISOString(),
          documentPath: 'imported.md',
          documentType: 'general',
          metrics: {
            overallScore: 85,
            categoryScores: {
              completeness: 90,
              accuracy: 80,
              consistency: 85,
              readability: 80,
              structure: 90,
              korean_standards: 75,
              technical_accuracy: 95,
              accessibility: 70
            },
            ruleCompliance: {
              totalRules: 10,
              passedRules: 8,
              failedRules: 2,
              complianceRate: 80
            },
            contentMetrics: {
              wordCount: 500,
              characterCount: 2500,
              paragraphCount: 5,
              headingCount: 3,
              codeBlockCount: 1,
              linkCount: 2,
              imageCount: 1
            },
            readabilityMetrics: {
              averageSentenceLength: 25,
              averageParagraphLength: 120,
              complexSentenceRatio: 0.2,
              passiveVoiceRatio: 0.1
            }
          },
          trends: {
            scoreChange: 0,
            improvementAreas: [],
            regressionAreas: []
          },
          recommendations: []
        }]
      };

      const jsonData = JSON.stringify(mockData);
      
      expect(() => tracker.importMetrics(jsonData)).not.toThrow();
      
      // 가져온 후 대시보드에서 확인
      const dashboard = tracker.getQualityDashboard();
      expect(dashboard.totalDocuments).toBeGreaterThan(0);
    });

    it('잘못된 JSON 데이터 가져오기에서 에러를 발생시켜야 한다', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => tracker.importMetrics(invalidJson)).toThrow();
    });
  });

  describe('메트릭 히스토리 관리', () => {
    it('최대 히스토리 크기를 유지해야 한다', async () => {
      const documentPath = 'history-test.md';
      
      // 최대 크기(100)보다 많은 기록 생성
      for (let i = 0; i < 105; i++) {
        await tracker.trackQualityMetrics(documentPath, `content ${i}`, {
          overallScore: 50 + (i % 50),
          totalRules: 5,
          passedRules: 3,
          categories: {}
        });
      }

      const exportedData = tracker.exportMetrics(documentPath);
      const parsedData = JSON.parse(exportedData);
      const historyLength = parsedData[documentPath].length;

      // 최대 100개로 제한되어야 함
      expect(historyLength).toBeLessThanOrEqual(100);
    });
  });
});

describe('전역 qualityMetricsTracker 인스턴스', () => {
  it('전역 인스턴스가 사용 가능해야 한다', () => {
    expect(qualityMetricsTracker).toBeDefined();
    expect(qualityMetricsTracker).toBeInstanceOf(QualityMetricsTracker);
  });

  it('전역 인스턴스로 메트릭을 추적할 수 있어야 한다', async () => {
    const mockReport = {
      overallScore: 80,
      totalRules: 5,
      passedRules: 4,
      categories: {}
    };

    const metrics = await qualityMetricsTracker.trackQualityMetrics(
      'global-test.md',
      'test content',
      mockReport
    );

    expect(metrics).toBeDefined();
    expect(metrics.documentPath).toBe('global-test.md');
  });
});