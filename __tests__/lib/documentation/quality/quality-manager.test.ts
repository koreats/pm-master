/**
 * @jest-environment jsdom
 */

// @ts-nocheck
import { 
  QualityManager, 
  QualityAssessmentRequest, 
  QualityGate,
  qualityManager 
} from '../../../../lib/documentation/quality/quality-manager';
import { DocumentValidator } from '../../../../lib/documentation/quality/document-validator';
import { QualityMetricsTracker } from '../../../../lib/documentation/quality/quality-metrics';
import { TemplateEngine } from '../../../../lib/documentation/template-engine';

describe('QualityManager', () => {
  let manager: QualityManager;
  let mockValidator: jest.Mocked<DocumentValidator>;
  let mockMetricsTracker: jest.Mocked<QualityMetricsTracker>;
  let mockTemplateEngine: jest.Mocked<TemplateEngine>;

  beforeEach(() => {
    // Mock dependencies
    mockValidator = {
      validateDocument: jest.fn()
    } as any;

    mockMetricsTracker = {
      trackQualityMetrics: jest.fn(),
      getQualityDashboard: jest.fn()
    } as any;

    mockTemplateEngine = {
      renderTemplate: jest.fn()
    } as any;

    manager = new QualityManager(mockValidator, mockMetricsTracker, mockTemplateEngine);
  });

  describe('문서 품질 평가', () => {
    const sampleRequest: QualityAssessmentRequest = {
      documentPath: 'test-document.md',
      content: `
# 테스트 문서

이것은 테스트용 문서입니다.

## 사용법

상세한 사용법을 설명합니다.
      `,
      metadata: {
        type: 'user_guide',
        version: '1.0.0',
        author: 'test-author',
        lastModified: new Date('2024-01-12'),
        tags: ['test', 'guide'],
        language: 'ko',
        targetAudience: 'developer'
      }
    };

    it('기본 품질 평가를 수행할 수 있어야 한다', async () => {
      // Mock 응답 설정
      const mockQualityReport = {
        documentPath: 'test-document.md',
        overallScore: 85,
        passedRules: 8,
        totalRules: 10,
        results: [],
        generatedAt: new Date(),
        categories: {
          completeness: { score: 90, passedCount: 3, totalCount: 3 },
          accuracy: { score: 80, passedCount: 2, totalCount: 3 },
          consistency: { score: 85, passedCount: 2, totalCount: 2 },
          readability: { score: 88, passedCount: 4, totalCount: 4 },
          structure: { score: 90, passedCount: 2, totalCount: 2 },
          korean_standards: { score: 75, passedCount: 1, totalCount: 2 },
          technical_accuracy: { score: 95, passedCount: 3, totalCount: 3 },
          accessibility: { score: 70, passedCount: 1, totalCount: 2 }
        },
        recommendations: ['문서 품질 개선을 위한 권장사항'],
        isPassingMinimumThreshold: true
      };

      const mockMetrics = {
        timestamp: new Date(),
        documentPath: 'test-document.md',
        documentType: 'user_guide',
        metrics: {
          overallScore: 85,
          categoryScores: {
            completeness: 90,
            accuracy: 80,
            consistency: 85,
            readability: 88,
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
            wordCount: 15,
            characterCount: 45,
            paragraphCount: 3,
            headingCount: 2,
            codeBlockCount: 0,
            linkCount: 0,
            imageCount: 0
          },
          readabilityMetrics: {
            averageSentenceLength: 25,
            averageParagraphLength: 50,
            complexSentenceRatio: 0.2,
            passiveVoiceRatio: 0.1
          }
        },
        trends: {
          scoreChange: 5,
          improvementAreas: ['구조'],
          regressionAreas: []
        },
        recommendations: [
          {
            id: 'improve_accessibility',
            category: 'accessibility',
            priority: 'medium' as const,
            description: '접근성 향상 필요',
            actionable: '대체 텍스트와 구조적 마크업을 개선하세요',
            estimatedImpact: 5
          }
        ]
      };

      mockValidator.validateDocument.mockResolvedValue(mockQualityReport);
      mockMetricsTracker.trackQualityMetrics.mockResolvedValue(mockMetrics);
      mockTemplateEngine.renderTemplate.mockResolvedValue('Generated quality report content');

      const result = await manager.assessDocumentQuality(sampleRequest);

      expect(result).toBeDefined();
      expect(result.passed).toBe(true);
      expect(result.qualityReport).toEqual(mockQualityReport);
      expect(result.metrics).toEqual(mockMetrics);
      expect(result.summary.overallStatus).toBe('good'); // 85점
      expect(result.nextSteps.length).toBeGreaterThan(0);
    });

    it('품질 점수에 따라 올바른 상태를 반환해야 한다', async () => {
      const testScores = [
        { score: 95, expectedStatus: 'excellent' },
        { score: 85, expectedStatus: 'good' },
        { score: 65, expectedStatus: 'fair' },
        { score: 45, expectedStatus: 'poor' }
      ];

      for (const { score, expectedStatus } of testScores) {
        const mockReport = {
          documentPath: 'test.md',
          overallScore: score,
          passedRules: 5,
          totalRules: 10,
          results: [],
          generatedAt: new Date(),
          categories: {},
          recommendations: [],
          isPassingMinimumThreshold: score >= 75
        };

        mockValidator.validateDocument.mockResolvedValue(mockReport as any);
        mockMetricsTracker.trackQualityMetrics.mockResolvedValue({} as any);

        const result = await manager.assessDocumentQuality(sampleRequest);
        expect(result.summary.overallStatus).toBe(expectedStatus);
      }
    });

    it('자동 수정 제안을 생성할 수 있어야 한다', async () => {
      const mockReport = {
        documentPath: 'test.md',
        overallScore: 60,
        passedRules: 3,
        totalRules: 8,
        results: [
          {
            ruleId: 'completeness.min_length',
            passed: false,
            score: 30,
            message: '문서가 너무 짧습니다',
            suggestions: ['내용을 확장하세요'],
            severity: 'warning' as const
          },
          {
            ruleId: 'technical_accuracy.code_blocks',
            passed: false,
            score: 40,
            message: '코드 블록에 언어 태그가 없습니다',
            suggestions: ['언어 태그를 추가하세요'],
            severity: 'warning' as const
          }
        ],
        generatedAt: new Date(),
        categories: {},
        recommendations: [],
        isPassingMinimumThreshold: false
      };

      mockValidator.validateDocument.mockResolvedValue(mockReport as any);
      mockMetricsTracker.trackQualityMetrics.mockResolvedValue({} as any);

      const result = await manager.assessDocumentQuality({
        ...sampleRequest,
        options: { autoFix: true }
      });

      expect(result.autoFixSuggestions).toBeDefined();
      expect(result.autoFixSuggestions!.length).toBeGreaterThan(0);
      expect(result.autoFixSuggestions![0]).toContain('내용을 확장');
    });
  });

  describe('일괄 품질 평가', () => {
    it('여러 문서를 동시에 평가할 수 있어야 한다', async () => {
      const requests: QualityAssessmentRequest[] = [
        {
          documentPath: 'doc1.md',
          content: 'Content 1',
          metadata: {
            type: 'readme',
            version: '1.0.0',
            author: 'test',
            lastModified: new Date(),
            tags: [],
            language: 'ko',
            targetAudience: 'user'
          }
        },
        {
          documentPath: 'doc2.md', 
          content: 'Content 2',
          metadata: {
            type: 'api_doc',
            version: '1.0.0',
            author: 'test',
            lastModified: new Date(),
            tags: [],
            language: 'ko',
            targetAudience: 'developer'
          }
        }
      ];

      const mockReport = {
        documentPath: 'test.md',
        overallScore: 80,
        passedRules: 7,
        totalRules: 10,
        results: [],
        generatedAt: new Date(),
        categories: {},
        recommendations: [],
        isPassingMinimumThreshold: true
      };

      mockValidator.validateDocument.mockResolvedValue(mockReport as any);
      mockMetricsTracker.trackQualityMetrics.mockResolvedValue({} as any);

      const results = await manager.batchAssessment(requests);

      expect(results).toHaveLength(2);
      expect(results[0].qualityReport.documentPath).toBe('test.md');
      expect(results[1].qualityReport.documentPath).toBe('test.md');
    });

    it('개별 문서 평가 실패가 전체를 중단시키지 않아야 한다', async () => {
      const requests: QualityAssessmentRequest[] = [
        {
          documentPath: 'good-doc.md',
          content: 'Good content',
          metadata: {
            type: 'readme',
            version: '1.0.0',
            author: 'test',
            lastModified: new Date(),
            tags: [],
            language: 'ko',
            targetAudience: 'user'
          }
        },
        {
          documentPath: 'failing-doc.md',
          content: 'Failing content',
          metadata: {
            type: 'api_doc',
            version: '1.0.0',
            author: 'test',
            lastModified: new Date(),
            tags: [],
            language: 'ko',
            targetAudience: 'developer'
          }
        }
      ];

      let callCount = 0;
      mockValidator.validateDocument.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // 첫 번째 호출은 성공
          return Promise.resolve({
            documentPath: 'good-doc.md',
            overallScore: 85,
            passedRules: 8,
            totalRules: 10,
            results: [],
            generatedAt: new Date(),
            categories: {},
            recommendations: [],
            isPassingMinimumThreshold: true
          } as any);
        } else {
          // 두 번째 호출은 실패
          return Promise.reject(new Error('Validation failed'));
        }
      });

      mockMetricsTracker.trackQualityMetrics.mockResolvedValue({} as any);

      const results = await manager.batchAssessment(requests);

      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(false);
      expect(results[1].nextSteps[0].action).toContain('평가 오류 해결');
    });
  });

  describe('품질 게이트 관리', () => {
    it('품질 게이트를 추가하고 관리할 수 있어야 한다', () => {
      const customGate: QualityGate = {
        name: 'custom_gate',
        description: '사용자 정의 게이트',
        enabled: true,
        autoFix: false,
        rules: [
          {
            id: 'custom_rule',
            type: 'minimum_score',
            threshold: 80,
            message: '커스텀 최소 점수 80점',
            blocking: true
          }
        ]
      };

      manager.addQualityGate(customGate);

      const retrievedGate = manager.getQualityGate('custom_gate');
      expect(retrievedGate).toEqual(customGate);

      const allGates = manager.listQualityGates();
      expect(allGates.some(gate => gate.name === 'custom_gate')).toBe(true);
    });

    it('품질 게이트를 제거할 수 있어야 한다', () => {
      const gateName = 'test_gate';
      const testGate: QualityGate = {
        name: gateName,
        description: '테스트 게이트',
        enabled: true,
        autoFix: false,
        rules: []
      };

      manager.addQualityGate(testGate);
      expect(manager.getQualityGate(gateName)).toBeDefined();

      manager.removeQualityGate(gateName);
      expect(manager.getQualityGate(gateName)).toBeUndefined();
    });

    it('기본 품질 게이트들이 초기화되어야 한다', () => {
      const gates = manager.listQualityGates();
      
      expect(gates.some(g => g.name === 'minimum_quality')).toBe(true);
      expect(gates.some(g => g.name === 'production_ready')).toBe(true);
    });
  });

  describe('품질 대시보드', () => {
    it('종합적인 품질 대시보드를 제공해야 한다', async () => {
      const mockBasicDashboard = {
        totalDocuments: 10,
        averageQuality: 78,
        documentsByQuality: {
          excellent: 2,
          good: 5,
          fair: 2,
          poor: 1
        },
        topIssues: [],
        improvementTrend: 'up' as const
      };

      mockMetricsTracker.getQualityDashboard.mockReturnValue(mockBasicDashboard);

      const dashboard = await manager.getQualityDashboard();

      expect(dashboard.overview.totalDocuments).toBe(10);
      expect(dashboard.overview.averageQuality).toBe(78);
      expect(dashboard.overview.trendDirection).toBe('up');
      expect(dashboard.qualityDistribution).toEqual(mockBasicDashboard.documentsByQuality);
    });
  });

  describe('에러 처리', () => {
    it('검증 중 에러가 발생해도 적절히 처리해야 한다', async () => {
      const request: QualityAssessmentRequest = {
        documentPath: 'error-doc.md',
        content: 'Content that causes error',
        metadata: {
          type: 'readme',
          version: '1.0.0',
          author: 'test',
          lastModified: new Date(),
          tags: [],
          language: 'ko',
          targetAudience: 'user'
        }
      };

      mockValidator.validateDocument.mockRejectedValue(new Error('Validation error'));

      await expect(manager.assessDocumentQuality(request)).rejects.toThrow('품질 평가 실패');
    });

    it('부분적 실패 상황에서도 최대한 정보를 제공해야 한다', async () => {
      const request: QualityAssessmentRequest = {
        documentPath: 'partial-fail.md',
        content: 'Content',
        metadata: {
          type: 'readme',
          version: '1.0.0',
          author: 'test',
          lastModified: new Date(),
          tags: [],
          language: 'ko',
          targetAudience: 'user'
        },
        options: {
          generateReport: false,
          trackMetrics: false
        }
      };

      const mockReport = {
        documentPath: 'partial-fail.md',
        overallScore: 70,
        passedRules: 6,
        totalRules: 10,
        results: [],
        generatedAt: new Date(),
        categories: {},
        recommendations: [],
        isPassingMinimumThreshold: false
      };

      mockValidator.validateDocument.mockResolvedValue(mockReport as any);

      const result = await manager.assessDocumentQuality(request);

      expect(result).toBeDefined();
      expect(result.generatedReport).toBeUndefined(); // 생성하지 않았으므로
      expect(result.metrics).toBeDefined(); // 기본 메트릭은 생성됨
    });
  });

  describe('템플릿 통합', () => {
    it('품질 리포트를 템플릿으로 생성할 수 있어야 한다', async () => {
      const request: QualityAssessmentRequest = {
        documentPath: 'template-test.md',
        content: 'Test content for template generation',
        metadata: {
          type: 'user_guide',
          version: '1.0.0',
          author: 'test',
          lastModified: new Date(),
          tags: ['test'],
          language: 'ko',
          targetAudience: 'developer'
        },
        options: { generateReport: true }
      };

      const mockReport = {
        documentPath: 'template-test.md',
        overallScore: 88,
        passedRules: 9,
        totalRules: 10,
        results: [],
        generatedAt: new Date(),
        categories: {},
        recommendations: [],
        isPassingMinimumThreshold: true
      };

      const mockGeneratedReport = `
# 문서 품질 평가 리포트: template-test.md

## 전체 점수: 88점

## 상태: good

생성일: ${new Date().toLocaleDateString()}
      `;

      mockValidator.validateDocument.mockResolvedValue(mockReport as any);
      mockMetricsTracker.trackQualityMetrics.mockResolvedValue({} as any);
      mockTemplateEngine.renderTemplate.mockResolvedValue(mockGeneratedReport);

      const result = await manager.assessDocumentQuality(request);

      expect(result.generatedReport).toBeDefined();
      expect(result.generatedReport).toContain('template-test.md');
      expect(result.generatedReport).toContain('88점');
      expect(mockTemplateEngine.renderTemplate).toHaveBeenCalledWith(
        'quality_report',
        expect.objectContaining({
          title: expect.stringContaining('template-test.md'),
          overallScore: 88
        })
      );
    });
  });

  describe('성능 최적화', () => {
    it('대량 평가 시에도 적절한 성능을 유지해야 한다', async () => {
      const requests: QualityAssessmentRequest[] = Array.from({ length: 20 }, (_, i) => ({
        documentPath: `performance-test-${i}.md`,
        content: `Test content ${i}`,
        metadata: {
          type: 'readme',
          version: '1.0.0',
          author: 'test',
          lastModified: new Date(),
          tags: [],
          language: 'ko',
          targetAudience: 'user'
        },
        options: { generateReport: false, trackMetrics: false }
      }));

      const mockReport = {
        documentPath: 'test.md',
        overallScore: 75,
        passedRules: 7,
        totalRules: 10,
        results: [],
        generatedAt: new Date(),
        categories: {},
        recommendations: [],
        isPassingMinimumThreshold: true
      };

      mockValidator.validateDocument.mockResolvedValue(mockReport as any);

      const startTime = performance.now();
      const results = await manager.batchAssessment(requests);
      const endTime = performance.now();

      expect(results).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(5000); // 5초 이내
    });
  });
});

describe('전역 qualityManager 인스턴스', () => {
  it('전역 인스턴스가 사용 가능해야 한다', () => {
    expect(qualityManager).toBeDefined();
    expect(qualityManager).toBeInstanceOf(QualityManager);
  });

  it('전역 인스턴스로 품질 평가를 수행할 수 있어야 한다', async () => {
    const request: QualityAssessmentRequest = {
      documentPath: 'global-test.md',
      content: 'Simple test content for global instance',
      metadata: {
        type: 'readme',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'user'
      },
      options: { 
        generateReport: false,
        trackMetrics: false,
        enforceMinimumQuality: false
      }
    };

    // 전역 인스턴스는 실제 validator와 연결되므로 실제 평가가 수행됨
    const result = await qualityManager.assessDocumentQuality(request);

    expect(result).toBeDefined();
    expect(result.qualityReport).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(typeof result.qualityReport.overallScore).toBe('number');
  });
});