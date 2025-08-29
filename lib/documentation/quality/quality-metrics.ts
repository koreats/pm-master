/**
 * 문서 품질 메트릭 추적 시스템
 * PM System 2025 - Document Quality Metrics System
 */

export interface QualityMetrics {
  timestamp: Date;
  documentPath: string;
  documentType: string;
  metrics: {
    overallScore: number;
    categoryScores: {
      completeness: number;
      accuracy: number;
      consistency: number;
      readability: number;
      structure: number;
      korean_standards: number;
      technical_accuracy: number;
      accessibility: number;
    };
    ruleCompliance: {
      totalRules: number;
      passedRules: number;
      failedRules: number;
      complianceRate: number; // 0-100
    };
    contentMetrics: {
      wordCount: number;
      characterCount: number;
      paragraphCount: number;
      headingCount: number;
      codeBlockCount: number;
      linkCount: number;
      imageCount: number;
    };
    readabilityMetrics: {
      averageSentenceLength: number;
      averageParagraphLength: number;
      complexSentenceRatio: number; // 0-1
      passiveVoiceRatio: number; // 0-1 (한국어 특성상 근사치)
    };
  };
  trends: {
    scoreChange: number; // 이전 대비 점수 변화
    improvementAreas: string[];
    regressionAreas: string[];
  };
  recommendations: QualityRecommendation[];
}

export interface QualityRecommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  actionable: string;
  estimatedImpact: number; // 0-10 점수 개선 예상치
}

export interface QualityTrend {
  documentPath: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  dataPoints: QualityDataPoint[];
  summary: {
    overallTrend: 'improving' | 'stable' | 'declining';
    averageScore: number;
    bestScore: number;
    worstScore: number;
    volatility: number; // 점수 변동성 (표준편차)
  };
}

export interface QualityDataPoint {
  timestamp: Date;
  overallScore: number;
  categoryScores: QualityMetrics['metrics']['categoryScores'];
  majorChanges: string[];
}

export class QualityMetricsTracker {
  private metricsHistory: Map<string, QualityMetrics[]> = new Map();
  private readonly maxHistorySize = 100; // 문서당 최대 100개 기록

  /**
   * 문서 품질 메트릭 계산 및 저장
   */
  async trackQualityMetrics(
    documentPath: string, 
    content: string, 
    qualityReport: any
  ): Promise<QualityMetrics> {
    const contentMetrics = this.analyzeContent(content);
    const readabilityMetrics = this.analyzeReadability(content);
    const trends = await this.calculateTrends(documentPath, qualityReport.overallScore);
    
    const metrics: QualityMetrics = {
      timestamp: new Date(),
      documentPath,
      documentType: this.detectDocumentType(documentPath, content),
      metrics: {
        overallScore: qualityReport.overallScore,
        categoryScores: this.extractCategoryScores(qualityReport.categories),
        ruleCompliance: {
          totalRules: qualityReport.totalRules,
          passedRules: qualityReport.passedRules,
          failedRules: qualityReport.totalRules - qualityReport.passedRules,
          complianceRate: (qualityReport.passedRules / qualityReport.totalRules) * 100
        },
        contentMetrics,
        readabilityMetrics
      },
      trends,
      recommendations: this.generateRecommendations(qualityReport, contentMetrics, readabilityMetrics)
    };

    // 기록 저장
    this.saveMetrics(documentPath, metrics);
    
    return metrics;
  }

  /**
   * 문서 내용 분석
   */
  private analyzeContent(content: string): QualityMetrics['metrics']['contentMetrics'] {
    const words = content.match(/[\w가-힣]+/g) || [];
    const characters = content.replace(/\s/g, '');
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    const images = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];

    return {
      wordCount: words.length,
      characterCount: characters.length,
      paragraphCount: paragraphs.length,
      headingCount: headings.length,
      codeBlockCount: codeBlocks.length,
      linkCount: links.length,
      imageCount: images.length
    };
  }

  /**
   * 가독성 메트릭 분석
   */
  private analyzeReadability(content: string): QualityMetrics['metrics']['readabilityMetrics'] {
    const sentences = content.split(/[.!?]/).filter(s => s.trim());
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    
    // 평균 문장 길이
    const totalCharacters = sentences.reduce((sum, s) => sum + s.length, 0);
    const averageSentenceLength = sentences.length > 0 ? totalCharacters / sentences.length : 0;
    
    // 평균 문단 길이
    const totalParagraphChars = paragraphs.reduce((sum, p) => sum + p.length, 0);
    const averageParagraphLength = paragraphs.length > 0 ? totalParagraphChars / paragraphs.length : 0;
    
    // 복잡한 문장 비율 (길고 복잡한 문장)
    const complexSentences = sentences.filter(s => {
      const length = s.trim().length;
      const commaCount = (s.match(/,/g) || []).length;
      return length > 100 && commaCount > 2; // 100자 이상이고 쉼표가 2개 이상
    });
    const complexSentenceRatio = sentences.length > 0 ? complexSentences.length / sentences.length : 0;
    
    // 수동태 비율 (한국어 특성상 근사치)
    const passivePatterns = [
      /되어\s*있다/g,
      /되고\s*있다/g,
      /되었다/g,
      /당하다/g,
      /받다/g
    ];
    
    let passiveCount = 0;
    passivePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) passiveCount += matches.length;
    });
    
    const passiveVoiceRatio = sentences.length > 0 ? passiveCount / sentences.length : 0;

    return {
      averageSentenceLength,
      averageParagraphLength,
      complexSentenceRatio,
      passiveVoiceRatio
    };
  }

  /**
   * 문서 타입 감지
   */
  private detectDocumentType(path: string, content: string): string {
    // 경로 기반 감지
    if (path.includes('progress') || path.includes('진행상황')) {
      return 'progress_report';
    }
    if (path.includes('api/') || content.includes('API') || content.includes('endpoint')) {
      return 'api_doc';
    }
    if (path.includes('component') || content.includes('컴포넌트')) {
      return 'component_doc';
    }
    if (path.toLowerCase().includes('readme')) {
      return 'readme';
    }
    if (content.includes('사용법') || content.includes('가이드') || content.includes('how to')) {
      return 'user_guide';
    }
    
    return 'general';
  }

  /**
   * 카테고리 점수 추출
   */
  private extractCategoryScores(categories: any): QualityMetrics['metrics']['categoryScores'] {
    return {
      completeness: categories.completeness?.score || 0,
      accuracy: categories.accuracy?.score || 0,
      consistency: categories.consistency?.score || 0,
      readability: categories.readability?.score || 0,
      structure: categories.structure?.score || 0,
      korean_standards: categories.korean_standards?.score || 0,
      technical_accuracy: categories.technical_accuracy?.score || 0,
      accessibility: categories.accessibility?.score || 0
    };
  }

  /**
   * 트렌드 계산
   */
  private async calculateTrends(
    documentPath: string, 
    currentScore: number
  ): Promise<QualityMetrics['trends']> {
    const history = this.metricsHistory.get(documentPath) || [];
    
    if (history.length === 0) {
      return {
        scoreChange: 0,
        improvementAreas: [],
        regressionAreas: []
      };
    }

    const previousMetrics = history[history.length - 1];
    const scoreChange = currentScore - previousMetrics.metrics.overallScore;
    
    // 개선/퇴보 영역 분석은 이전 구현에서 수행
    const improvementAreas: string[] = [];
    const regressionAreas: string[] = [];
    
    // 카테고리별 점수 비교는 실제 구현에서 수행
    
    return {
      scoreChange,
      improvementAreas,
      regressionAreas
    };
  }

  /**
   * 개선 권장사항 생성
   */
  private generateRecommendations(
    qualityReport: any,
    contentMetrics: QualityMetrics['metrics']['contentMetrics'],
    readabilityMetrics: QualityMetrics['metrics']['readabilityMetrics']
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    // 내용 길이 기반 권장사항
    if (contentMetrics.wordCount < 200) {
      recommendations.push({
        id: 'content_length',
        category: 'completeness',
        priority: 'high',
        description: '문서가 너무 짧습니다',
        actionable: '내용을 확장하여 최소 200단어 이상 작성해주세요',
        estimatedImpact: 8
      });
    }

    // 구조 기반 권장사항
    if (contentMetrics.headingCount === 0) {
      recommendations.push({
        id: 'add_headings',
        category: 'structure',
        priority: 'high',
        description: '제목이 없어 문서 구조가 불분명합니다',
        actionable: '주요 섹션에 제목을 추가하여 문서 구조를 명확히 해주세요',
        estimatedImpact: 6
      });
    }

    // 가독성 기반 권장사항
    if (readabilityMetrics.averageSentenceLength > 150) {
      recommendations.push({
        id: 'sentence_length',
        category: 'readability',
        priority: 'medium',
        description: '문장이 너무 깁니다',
        actionable: '긴 문장을 짧게 나누어 가독성을 높여주세요',
        estimatedImpact: 4
      });
    }

    // 복잡성 기반 권장사항
    if (readabilityMetrics.complexSentenceRatio > 0.3) {
      recommendations.push({
        id: 'complexity',
        category: 'readability',
        priority: 'medium',
        description: '복잡한 문장이 많습니다',
        actionable: '문장 구조를 단순화하고 쉬운 표현을 사용해주세요',
        estimatedImpact: 5
      });
    }

    // 기술 문서 관련 권장사항
    if (contentMetrics.codeBlockCount > 0 && qualityReport.results?.some((r: any) => 
      r.ruleId === 'technical_accuracy.code_blocks' && !r.passed
    )) {
      recommendations.push({
        id: 'code_block_tags',
        category: 'technical_accuracy',
        priority: 'high',
        description: '코드 블록에 언어 태그가 누락되었습니다',
        actionable: '모든 코드 블록에 적절한 언어 태그를 추가해주세요',
        estimatedImpact: 7
      });
    }

    // 우선순위순으로 정렬하고 최대 5개로 제한
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
  }

  /**
   * 메트릭 저장
   */
  private saveMetrics(documentPath: string, metrics: QualityMetrics): void {
    if (!this.metricsHistory.has(documentPath)) {
      this.metricsHistory.set(documentPath, []);
    }

    const history = this.metricsHistory.get(documentPath)!;
    history.push(metrics);

    // 최대 크기 제한
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }
  }

  /**
   * 문서별 품질 트렌드 분석
   */
  async getQualityTrend(
    documentPath: string, 
    days: number = 30
  ): Promise<QualityTrend | null> {
    const history = this.metricsHistory.get(documentPath);
    if (!history || history.length < 2) {
      return null;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const relevantData = history.filter(m => 
      m.timestamp >= startDate && m.timestamp <= endDate
    );

    if (relevantData.length < 2) {
      return null;
    }

    const dataPoints: QualityDataPoint[] = relevantData.map(m => ({
      timestamp: m.timestamp,
      overallScore: m.metrics.overallScore,
      categoryScores: m.metrics.categoryScores,
      majorChanges: [] // 실제 구현에서는 변경사항 추적
    }));

    const scores = dataPoints.map(dp => dp.overallScore);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    
    // 표준편차 계산 (변동성)
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - averageScore, 2), 0) / scores.length;
    const volatility = Math.sqrt(variance);

    // 트렌드 방향 결정
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    let overallTrend: QualityTrend['summary']['overallTrend'];
    
    const scoreDiff = lastScore - firstScore;
    if (scoreDiff > 5) {
      overallTrend = 'improving';
    } else if (scoreDiff < -5) {
      overallTrend = 'declining';
    } else {
      overallTrend = 'stable';
    }

    return {
      documentPath,
      timeRange: { start: startDate, end: endDate },
      dataPoints,
      summary: {
        overallTrend,
        averageScore,
        bestScore,
        worstScore,
        volatility
      }
    };
  }

  /**
   * 전체 품질 대시보드 데이터
   */
  getQualityDashboard(): {
    totalDocuments: number;
    averageQuality: number;
    documentsByQuality: {
      excellent: number; // 90+
      good: number; // 75-89
      fair: number; // 60-74
      poor: number; // <60
    };
    topIssues: string[];
    improvementTrend: 'up' | 'down' | 'stable';
  } {
    const allDocuments = Array.from(this.metricsHistory.keys());
    const latestMetrics = allDocuments.map(doc => {
      const history = this.metricsHistory.get(doc)!;
      return history[history.length - 1];
    });

    const totalDocuments = allDocuments.length;
    const averageQuality = latestMetrics.length > 0 
      ? latestMetrics.reduce((sum, m) => sum + m.metrics.overallScore, 0) / latestMetrics.length 
      : 0;

    const documentsByQuality = {
      excellent: latestMetrics.filter(m => m.metrics.overallScore >= 90).length,
      good: latestMetrics.filter(m => m.metrics.overallScore >= 75 && m.metrics.overallScore < 90).length,
      fair: latestMetrics.filter(m => m.metrics.overallScore >= 60 && m.metrics.overallScore < 75).length,
      poor: latestMetrics.filter(m => m.metrics.overallScore < 60).length
    };

    // 상위 이슈 수집 (가장 많이 실패하는 권장사항)
    const allRecommendations = latestMetrics.flatMap(m => m.recommendations);
    const issueFrequency = new Map<string, number>();
    
    allRecommendations.forEach(rec => {
      issueFrequency.set(rec.category, (issueFrequency.get(rec.category) || 0) + 1);
    });

    const topIssues = Array.from(issueFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);

    // 개선 트렌드 계산 (지난 주 vs 이번 주 평균)
    let improvementTrend: 'up' | 'down' | 'stable' = 'stable';
    
    // 실제 구현에서는 시간 기반 트렌드 분석 수행

    return {
      totalDocuments,
      averageQuality: Math.round(averageQuality),
      documentsByQuality,
      topIssues,
      improvementTrend
    };
  }

  /**
   * 메트릭 내보내기 (JSON 형태)
   */
  exportMetrics(documentPath?: string): string {
    const data = documentPath 
      ? { [documentPath]: this.metricsHistory.get(documentPath) || [] }
      : Object.fromEntries(this.metricsHistory);
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * 메트릭 가져오기 (JSON에서)
   */
  importMetrics(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      for (const [documentPath, metrics] of Object.entries(data)) {
        if (Array.isArray(metrics)) {
          this.metricsHistory.set(documentPath, metrics as QualityMetrics[]);
        }
      }
    } catch (error) {
      throw new Error(`메트릭 가져오기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
}

/**
 * 전역 품질 메트릭 추적기
 */
export const qualityMetricsTracker = new QualityMetricsTracker();