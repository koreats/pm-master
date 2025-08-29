/**
 * 문서 품질 통합 관리 시스템
 * PM System 2025 - Document Quality Manager
 */

import { DocumentValidator, DocumentQualityReport } from './document-validator';
import { QualityMetricsTracker, QualityMetrics } from './quality-metrics';
import { TemplateEngine } from '../template-engine';

export interface QualityAssessmentRequest {
  documentPath: string;
  content: string;
  metadata: {
    type: 'progress_report' | 'api_doc' | 'component_doc' | 'user_guide' | 'readme';
    version: string;
    author: string;
    lastModified: Date;
    tags: string[];
    language: 'ko' | 'en';
    targetAudience: 'developer' | 'user' | 'stakeholder';
  };
  options?: {
    generateReport?: boolean;
    trackMetrics?: boolean;
    enforceMinimumQuality?: boolean;
    autoFix?: boolean;
  };
}

export interface QualityAssessmentResult {
  passed: boolean;
  qualityReport: DocumentQualityReport;
  metrics: QualityMetrics;
  generatedReport?: string;
  autoFixSuggestions?: string[];
  nextSteps: QualityNextStep[];
  summary: {
    overallStatus: 'excellent' | 'good' | 'fair' | 'poor';
    keyIssues: string[];
    strengthAreas: string[];
    improvementPotential: number; // 0-100 점수 향상 가능성
  };
}

export interface QualityNextStep {
  id: string;
  category: 'immediate' | 'short_term' | 'long_term';
  action: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: string;
  expectedImpact: number; // 0-10
}

export interface QualityGate {
  name: string;
  description: string;
  rules: QualityGateRule[];
  enabled: boolean;
  autoFix: boolean;
}

export interface QualityGateRule {
  id: string;
  type: 'minimum_score' | 'required_sections' | 'max_issues' | 'custom';
  threshold: number | string[];
  message: string;
  blocking: boolean; // 이 규칙을 만족하지 않으면 통과 불가
}

export interface QualityDashboard {
  overview: {
    totalDocuments: number;
    averageQuality: number;
    trendDirection: 'up' | 'down' | 'stable';
    lastAssessment: Date;
  };
  qualityDistribution: {
    excellent: number;
    good: number; 
    fair: number;
    poor: number;
  };
  topIssues: Array<{
    issue: string;
    frequency: number;
    category: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  improvements: Array<{
    document: string;
    previousScore: number;
    currentScore: number;
    improvementDate: Date;
  }>;
  alerts: Array<{
    id: string;
    type: 'quality_drop' | 'missing_documentation' | 'outdated_content';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    affectedDocuments: string[];
    created: Date;
  }>;
}

export class QualityManager {
  private validator: DocumentValidator;
  private metricsTracker: QualityMetricsTracker;
  private templateEngine: TemplateEngine;
  private qualityGates: Map<string, QualityGate> = new Map();
  private assessmentHistory: Map<string, QualityAssessmentResult[]> = new Map();

  constructor(
    validator?: DocumentValidator,
    metricsTracker?: QualityMetricsTracker,
    templateEngine?: TemplateEngine
  ) {
    this.validator = validator || new DocumentValidator();
    this.metricsTracker = metricsTracker || new QualityMetricsTracker();
    this.templateEngine = templateEngine || new TemplateEngine();
    
    this.initializeDefaultQualityGates();
  }

  /**
   * 종합 문서 품질 평가 수행
   */
  async assessDocumentQuality(request: QualityAssessmentRequest): Promise<QualityAssessmentResult> {
    const options = {
      generateReport: true,
      trackMetrics: true,
      enforceMinimumQuality: false,
      autoFix: false,
      ...request.options
    };

    try {
      // 1. 기본 품질 검증 수행
      const qualityReport = await this.validator.validateDocument(
        request.content, 
        request.metadata
      );

      // 2. 메트릭 추적 (옵션에 따라)
      let metrics: QualityMetrics;
      if (options.trackMetrics) {
        metrics = await this.metricsTracker.trackQualityMetrics(
          request.documentPath,
          request.content,
          qualityReport
        );
      } else {
        // 기본 메트릭 생성
        metrics = await this.generateBasicMetrics(request, qualityReport);
      }

      // 3. 품질 게이트 검증
      const gateResults = await this.validateQualityGates(qualityReport, request);
      
      // 4. 자동 수정 제안 생성 (옵션에 따라)
      const autoFixSuggestions = options.autoFix 
        ? await this.generateAutoFixSuggestions(qualityReport, request.content)
        : [];

      // 5. 다음 단계 생성
      const nextSteps = this.generateNextSteps(qualityReport, metrics);

      // 6. 요약 정보 생성
      const summary = this.generateQualitySummary(qualityReport, metrics);

      // 7. 품질 리포트 생성 (옵션에 따라)
      let generatedReport: string | undefined;
      if (options.generateReport) {
        generatedReport = await this.generateQualityReport(
          qualityReport, 
          metrics, 
          request
        );
      }

      // 8. 최종 통과/실패 결정
      const passed = options.enforceMinimumQuality 
        ? qualityReport.isPassingMinimumThreshold && gateResults.passed
        : true; // 기본적으로는 정보 제공만

      const result: QualityAssessmentResult = {
        passed,
        qualityReport,
        metrics,
        generatedReport,
        autoFixSuggestions,
        nextSteps,
        summary
      };

      // 9. 평가 기록 저장
      this.saveAssessmentResult(request.documentPath, result);

      return result;

    } catch (error) {
      throw new Error(`품질 평가 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 여러 문서 일괄 품질 평가
   */
  async batchAssessment(requests: QualityAssessmentRequest[]): Promise<QualityAssessmentResult[]> {
    const results: QualityAssessmentResult[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.assessDocumentQuality(request);
        results.push(result);
      } catch (error) {
        // 개별 문서 실패가 전체를 막지 않도록 함
        console.error(`문서 ${request.documentPath} 평가 실패:`, error);
        
        // 기본 실패 결과 생성
        const failedResult: QualityAssessmentResult = {
          passed: false,
          qualityReport: this.createFailedQualityReport(request.documentPath, error),
          metrics: await this.generateBasicMetrics(request, this.createFailedQualityReport(request.documentPath, error)),
          nextSteps: [{
            id: 'fix-assessment-error',
            category: 'immediate',
            action: `평가 오류 해결: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            priority: 'high',
            estimatedEffort: '30분',
            expectedImpact: 5
          }],
          summary: {
            overallStatus: 'poor',
            keyIssues: ['문서 평가 중 오류 발생'],
            strengthAreas: [],
            improvementPotential: 0
          }
        };
        
        results.push(failedResult);
      }
    }

    return results;
  }

  /**
   * 품질 대시보드 데이터 생성
   */
  async getQualityDashboard(): Promise<QualityDashboard> {
    const basicDashboard = this.metricsTracker.getQualityDashboard();
    
    // 평가 기록에서 추가 정보 수집
    const allAssessments = Array.from(this.assessmentHistory.values()).flat();
    const recentAssessments = allAssessments.filter(
      assessment => assessment.qualityReport.generatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // 상위 이슈 분석
    const issueFrequency = new Map<string, { count: number; category: string; impact: 'high' | 'medium' | 'low' }>();
    
    for (const assessment of recentAssessments) {
      for (const result of assessment.qualityReport.results) {
        if (!result.passed) {
          const key = result.message.substring(0, 50); // 메시지 앞부분으로 그룹화
          const current = issueFrequency.get(key) || { count: 0, category: 'general', impact: 'medium' };
          issueFrequency.set(key, {
            ...current,
            count: current.count + 1,
            impact: result.severity === 'error' ? 'high' : result.severity === 'warning' ? 'medium' : 'low'
          });
        }
      }
    }

    const topIssues = Array.from(issueFrequency.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([issue, data]) => ({
        issue,
        frequency: data.count,
        category: data.category,
        impact: data.impact
      }));

    // 개선 사항 추적
    const improvements = this.findQualityImprovements();

    // 알림 생성
    const alerts = this.generateQualityAlerts(recentAssessments);

    return {
      overview: {
        totalDocuments: basicDashboard.totalDocuments,
        averageQuality: basicDashboard.averageQuality,
        trendDirection: basicDashboard.improvementTrend,
        lastAssessment: recentAssessments.length > 0 
          ? recentAssessments[recentAssessments.length - 1].qualityReport.generatedAt
          : new Date()
      },
      qualityDistribution: basicDashboard.documentsByQuality,
      topIssues,
      improvements,
      alerts
    };
  }

  /**
   * 품질 게이트 관리
   */
  addQualityGate(gate: QualityGate): void {
    this.qualityGates.set(gate.name, gate);
  }

  removeQualityGate(gateName: string): void {
    this.qualityGates.delete(gateName);
  }

  getQualityGate(gateName: string): QualityGate | undefined {
    return this.qualityGates.get(gateName);
  }

  listQualityGates(): QualityGate[] {
    return Array.from(this.qualityGates.values());
  }

  /**
   * 기본 품질 게이트 초기화
   */
  private initializeDefaultQualityGates(): void {
    // 기본 품질 게이트
    this.addQualityGate({
      name: 'minimum_quality',
      description: '최소 품질 기준',
      enabled: true,
      autoFix: false,
      rules: [
        {
          id: 'min_score',
          type: 'minimum_score',
          threshold: 75,
          message: '문서 품질 점수가 75점 이상이어야 합니다',
          blocking: false
        },
        {
          id: 'max_critical_issues',
          type: 'max_issues',
          threshold: 0,
          message: '치명적 오류가 없어야 합니다',
          blocking: true
        }
      ]
    });

    // 프로덕션 배포용 게이트
    this.addQualityGate({
      name: 'production_ready',
      description: '프로덕션 배포 준비 완료',
      enabled: false, // 기본적으로 비활성화
      autoFix: true,
      rules: [
        {
          id: 'prod_min_score',
          type: 'minimum_score',
          threshold: 90,
          message: '프로덕션 배포를 위해서는 90점 이상이어야 합니다',
          blocking: true
        },
        {
          id: 'required_sections',
          type: 'required_sections',
          threshold: ['# ', '## ', 'usage', 'api'],
          message: '필수 섹션이 누락되었습니다',
          blocking: true
        }
      ]
    });
  }

  /**
   * 품질 게이트 검증
   */
  private async validateQualityGates(
    qualityReport: DocumentQualityReport,
    request: QualityAssessmentRequest
  ): Promise<{ passed: boolean; failedGates: string[]; messages: string[] }> {
    const failedGates: string[] = [];
    const messages: string[] = [];
    let overallPassed = true;

    for (const gate of this.qualityGates.values()) {
      if (!gate.enabled) continue;

      let gatePassed = true;

      for (const rule of gate.rules) {
        const rulePassed = await this.evaluateGateRule(rule, qualityReport, request);
        
        if (!rulePassed) {
          gatePassed = false;
          messages.push(`[${gate.name}] ${rule.message}`);
          
          if (rule.blocking) {
            overallPassed = false;
          }
        }
      }

      if (!gatePassed) {
        failedGates.push(gate.name);
      }
    }

    return {
      passed: overallPassed,
      failedGates,
      messages
    };
  }

  /**
   * 개별 게이트 규칙 평가
   */
  private async evaluateGateRule(
    rule: QualityGateRule,
    qualityReport: DocumentQualityReport,
    request: QualityAssessmentRequest
  ): Promise<boolean> {
    switch (rule.type) {
      case 'minimum_score':
        return qualityReport.overallScore >= (rule.threshold as number);
        
      case 'required_sections':
        const requiredSections = rule.threshold as string[];
        return requiredSections.every(section => 
          request.content.toLowerCase().includes(section.toLowerCase())
        );
        
      case 'max_issues':
        const criticalIssues = qualityReport.results.filter(r => 
          !r.passed && r.severity === 'error'
        );
        return criticalIssues.length <= (rule.threshold as number);
        
      case 'custom':
        // 사용자 정의 규칙은 추후 확장 가능
        return true;
        
      default:
        return true;
    }
  }

  /**
   * 자동 수정 제안 생성
   */
  private async generateAutoFixSuggestions(
    qualityReport: DocumentQualityReport,
    content: string
  ): Promise<string[]> {
    const suggestions: string[] = [];

    for (const result of qualityReport.results) {
      if (!result.passed && result.suggestions.length > 0) {
        // 자동 수정 가능한 항목들에 대한 구체적인 수정 제안
        switch (result.ruleId) {
          case 'completeness.min_length':
            suggestions.push('문서에 상세한 설명과 예제를 추가하여 내용을 확장하세요');
            break;
            
          case 'completeness.headings':
            suggestions.push('문서에 메인 제목(# )과 섹션 제목(## )을 추가하여 구조를 명확히 하세요');
            break;
            
          case 'technical_accuracy.code_blocks':
            suggestions.push('모든 코드 블록에 언어 태그를 추가하세요 (예: ```typescript)');
            break;
            
          case 'consistency.terminology':
            suggestions.push('문서 전체에서 동일한 용어를 일관되게 사용하세요');
            break;
            
          default:
            if (result.suggestions.length > 0) {
              suggestions.push(`${result.ruleId}: ${result.suggestions[0]}`);
            }
        }
      }
    }

    return suggestions.slice(0, 10); // 최대 10개 제안
  }

  /**
   * 다음 단계 생성
   */
  private generateNextSteps(
    qualityReport: DocumentQualityReport,
    metrics: QualityMetrics
  ): QualityNextStep[] {
    const steps: QualityNextStep[] = [];

    // 점수 기반 우선순위 결정
    if (qualityReport.overallScore < 60) {
      steps.push({
        id: 'urgent_quality_improvement',
        category: 'immediate',
        action: '문서 품질이 매우 낮습니다. 기본적인 내용과 구조를 보완해주세요',
        priority: 'high',
        estimatedEffort: '2-4시간',
        expectedImpact: 8
      });
    } else if (qualityReport.overallScore < 80) {
      steps.push({
        id: 'quality_enhancement',
        category: 'short_term',
        action: '문서 품질 개선을 위해 주요 권장사항을 적용해주세요',
        priority: 'medium',
        estimatedEffort: '1-2시간',
        expectedImpact: 6
      });
    }

    // 카테고리별 낮은 점수 영역 개선
    for (const [category, data] of Object.entries(qualityReport.categories)) {
      if (data.score < 70) {
        const categoryNames: { [key: string]: string } = {
          completeness: '완성도',
          accuracy: '정확성',
          consistency: '일관성',
          readability: '가독성',
          structure: '구조',
          technical_accuracy: '기술적 정확성'
        };

        steps.push({
          id: `improve_${category}`,
          category: 'short_term',
          action: `${categoryNames[category] || category} 영역을 중점적으로 개선해주세요`,
          priority: data.score < 50 ? 'high' : 'medium',
          estimatedEffort: '1-3시간',
          expectedImpact: Math.floor((100 - data.score) / 10)
        });
      }
    }

    // 권장사항 기반 단계
    for (const recommendation of metrics.recommendations) {
      if (recommendation.priority === 'high') {
        steps.push({
          id: recommendation.id,
          category: 'immediate',
          action: recommendation.actionable,
          priority: recommendation.priority,
          estimatedEffort: '30분-1시간',
          expectedImpact: recommendation.estimatedImpact
        });
      }
    }

    return steps
      .sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 8); // 최대 8개 단계
  }

  /**
   * 품질 요약 생성
   */
  private generateQualitySummary(
    qualityReport: DocumentQualityReport,
    metrics: QualityMetrics
  ): QualityAssessmentResult['summary'] {
    let overallStatus: 'excellent' | 'good' | 'fair' | 'poor';
    
    if (qualityReport.overallScore >= 90) {
      overallStatus = 'excellent';
    } else if (qualityReport.overallScore >= 75) {
      overallStatus = 'good';
    } else if (qualityReport.overallScore >= 60) {
      overallStatus = 'fair';
    } else {
      overallStatus = 'poor';
    }

    // 주요 이슈 식별
    const keyIssues = qualityReport.results
      .filter(r => !r.passed && r.severity !== 'info')
      .sort((a, b) => {
        const severityOrder = { 'error': 3, 'warning': 2, 'info': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 5)
      .map(r => r.message);

    // 강점 영역 식별
    const strengthAreas = Object.entries(qualityReport.categories)
      .filter(([, data]) => data.score >= 85)
      .map(([category]) => {
        const categoryNames: { [key: string]: string } = {
          completeness: '완성도',
          accuracy: '정확성',
          consistency: '일관성',
          readability: '가독성',
          structure: '구조',
          technical_accuracy: '기술적 정확성'
        };
        return categoryNames[category] || category;
      });

    // 개선 가능성 계산
    const currentScore = qualityReport.overallScore;
    const maxPossibleImprovement = 100 - currentScore;
    const improvementPotential = Math.min(
      maxPossibleImprovement,
      qualityReport.recommendations.length * 5 // 권장사항당 5점 개선 가정
    );

    return {
      overallStatus,
      keyIssues,
      strengthAreas,
      improvementPotential
    };
  }

  /**
   * 기본 메트릭 생성 (메트릭 추적 비활성화 시)
   */
  private async generateBasicMetrics(
    request: QualityAssessmentRequest,
    qualityReport: DocumentQualityReport
  ): Promise<QualityMetrics> {
    // 기본적인 메트릭만 생성
    return {
      timestamp: new Date(),
      documentPath: request.documentPath,
      documentType: request.metadata.type,
      metrics: {
        overallScore: qualityReport.overallScore,
        categoryScores: {
          completeness: qualityReport.categories.completeness?.score || 0,
          accuracy: qualityReport.categories.accuracy?.score || 0,
          consistency: qualityReport.categories.consistency?.score || 0,
          readability: qualityReport.categories.readability?.score || 0,
          structure: qualityReport.categories.structure?.score || 0,
          korean_standards: qualityReport.categories.korean_standards?.score || 0,
          technical_accuracy: qualityReport.categories.technical_accuracy?.score || 0,
          accessibility: qualityReport.categories.accessibility?.score || 0
        },
        ruleCompliance: {
          totalRules: qualityReport.totalRules,
          passedRules: qualityReport.passedRules,
          failedRules: qualityReport.totalRules - qualityReport.passedRules,
          complianceRate: (qualityReport.passedRules / qualityReport.totalRules) * 100
        },
        contentMetrics: {
          wordCount: (request.content.match(/[\w가-힣]+/g) || []).length,
          characterCount: request.content.replace(/\s/g, '').length,
          paragraphCount: request.content.split(/\n\s*\n/).filter(p => p.trim()).length,
          headingCount: (request.content.match(/^#{1,6}\s+.+$/gm) || []).length,
          codeBlockCount: (request.content.match(/```[\s\S]*?```/g) || []).length,
          linkCount: (request.content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length,
          imageCount: (request.content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length
        },
        readabilityMetrics: {
          averageSentenceLength: 0,
          averageParagraphLength: 0,
          complexSentenceRatio: 0,
          passiveVoiceRatio: 0
        }
      },
      trends: {
        scoreChange: 0,
        improvementAreas: [],
        regressionAreas: []
      },
      recommendations: []
    };
  }

  /**
   * 품질 평가 실패 시 기본 리포트 생성
   */
  private createFailedQualityReport(documentPath: string, error: any): DocumentQualityReport {
    return {
      documentPath,
      overallScore: 0,
      passedRules: 0,
      totalRules: 0,
      results: [],
      generatedAt: new Date(),
      categories: {
        completeness: { score: 0, passedCount: 0, totalCount: 0 },
        accuracy: { score: 0, passedCount: 0, totalCount: 0 },
        consistency: { score: 0, passedCount: 0, totalCount: 0 },
        readability: { score: 0, passedCount: 0, totalCount: 0 },
        structure: { score: 0, passedCount: 0, totalCount: 0 },
        korean_standards: { score: 0, passedCount: 0, totalCount: 0 },
        technical_accuracy: { score: 0, passedCount: 0, totalCount: 0 },
        accessibility: { score: 0, passedCount: 0, totalCount: 0 }
      },
      recommendations: [`평가 오류 해결 필요: ${error instanceof Error ? error.message : '알 수 없는 오류'}`],
      isPassingMinimumThreshold: false
    };
  }

  /**
   * 품질 리포트 생성
   */
  private async generateQualityReport(
    qualityReport: DocumentQualityReport,
    metrics: QualityMetrics,
    request: QualityAssessmentRequest
  ): Promise<string> {
    const reportData = {
      title: `문서 품질 평가 리포트: ${request.documentPath}`,
      generatedAt: new Date(),
      document: {
        path: request.documentPath,
        type: request.metadata.type,
        author: request.metadata.author,
        lastModified: request.metadata.lastModified
      },
      overallScore: qualityReport.overallScore,
      status: qualityReport.overallScore >= 90 ? 'excellent' :
              qualityReport.overallScore >= 75 ? 'good' :
              qualityReport.overallScore >= 60 ? 'fair' : 'poor',
      categories: qualityReport.categories,
      metrics: metrics.metrics,
      recommendations: qualityReport.recommendations,
      nextSteps: this.generateNextSteps(qualityReport, metrics)
    };

    // 템플릿 엔진을 사용하여 리포트 생성
    return await this.templateEngine.renderTemplate('quality_report', reportData);
  }

  /**
   * 평가 결과 저장
   */
  private saveAssessmentResult(documentPath: string, result: QualityAssessmentResult): void {
    if (!this.assessmentHistory.has(documentPath)) {
      this.assessmentHistory.set(documentPath, []);
    }

    const history = this.assessmentHistory.get(documentPath)!;
    history.push(result);

    // 최대 50개 기록 유지
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  /**
   * 품질 개선 사항 찾기
   */
  private findQualityImprovements(): QualityDashboard['improvements'] {
    const improvements: QualityDashboard['improvements'] = [];

    for (const [documentPath, assessments] of this.assessmentHistory.entries()) {
      if (assessments.length >= 2) {
        const previous = assessments[assessments.length - 2];
        const current = assessments[assessments.length - 1];
        
        const improvement = current.qualityReport.overallScore - previous.qualityReport.overallScore;
        
        if (improvement >= 10) { // 10점 이상 개선
          improvements.push({
            document: documentPath,
            previousScore: previous.qualityReport.overallScore,
            currentScore: current.qualityReport.overallScore,
            improvementDate: current.qualityReport.generatedAt
          });
        }
      }
    }

    return improvements
      .sort((a, b) => b.improvementDate.getTime() - a.improvementDate.getTime())
      .slice(0, 10);
  }

  /**
   * 품질 알림 생성
   */
  private generateQualityAlerts(recentAssessments: QualityAssessmentResult[]): QualityDashboard['alerts'] {
    const alerts: QualityDashboard['alerts'] = [];

    // 품질 하락 알림
    const qualityDrops = recentAssessments.filter(assessment => 
      assessment.qualityReport.overallScore < 60
    );

    if (qualityDrops.length > 0) {
      alerts.push({
        id: 'quality-drop-' + Date.now(),
        type: 'quality_drop',
        severity: 'critical',
        message: `${qualityDrops.length}개 문서의 품질이 60점 미만입니다`,
        affectedDocuments: qualityDrops.map(a => a.qualityReport.documentPath),
        created: new Date()
      });
    }

    // 문서 누락 알림 (실제 구현에서는 프로젝트 구조 분석 필요)
    // 이는 예시이며, 실제로는 프로젝트의 파일 구조를 분석해야 함

    return alerts;
  }
}

/**
 * 전역 품질 관리자 인스턴스
 */
export const qualityManager = new QualityManager();