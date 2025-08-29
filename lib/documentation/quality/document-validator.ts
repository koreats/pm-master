/**
 * 문서 품질 검증 시스템
 * PM System 2025 - Document Quality Validation System
 */

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  category: QualityCategory;
  weight: number; // 1-10 priority weight
  enabled: boolean;
  validator: (content: string, metadata?: DocumentMetadata) => QualityResult;
}

export interface QualityResult {
  ruleId: string;
  passed: boolean;
  score: number; // 0-100
  message: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
  location?: {
    line?: number;
    column?: number;
    section?: string;
  };
}

export interface DocumentQualityReport {
  documentPath: string;
  overallScore: number;
  passedRules: number;
  totalRules: number;
  results: QualityResult[];
  generatedAt: Date;
  categories: {
    [key in QualityCategory]: {
      score: number;
      passedCount: number;
      totalCount: number;
    };
  };
  recommendations: string[];
  isPassingMinimumThreshold: boolean;
}

export type QualityCategory = 
  | 'completeness'
  | 'accuracy' 
  | 'consistency'
  | 'readability'
  | 'structure'
  | 'korean_standards'
  | 'technical_accuracy'
  | 'accessibility';

export interface DocumentMetadata {
  type: 'progress_report' | 'api_doc' | 'component_doc' | 'user_guide' | 'readme';
  version: string;
  author: string;
  lastModified: Date;
  tags: string[];
  language: 'ko' | 'en';
  targetAudience: 'developer' | 'user' | 'stakeholder';
}

export class DocumentValidator {
  private rules: Map<string, QualityRule> = new Map();
  private minimumScore: number = 75; // 최소 품질 기준 75점
  private categoryWeights: { [key in QualityCategory]: number } = {
    completeness: 2.0,
    accuracy: 2.5,
    consistency: 1.5,
    readability: 1.8,
    structure: 1.5,
    korean_standards: 1.2,
    technical_accuracy: 2.0,
    accessibility: 1.0
  };

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * 문서 품질 검증 실행
   */
  async validateDocument(
    content: string, 
    metadata: DocumentMetadata
  ): Promise<DocumentQualityReport> {
    const results: QualityResult[] = [];
    
    // 활성화된 모든 규칙 실행
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      try {
        const result = rule.validator(content, metadata);
        results.push(result);
      } catch (error) {
        results.push({
          ruleId: rule.id,
          passed: false,
          score: 0,
          message: `규칙 실행 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          suggestions: ['규칙 구성을 확인해주세요'],
          severity: 'error'
        });
      }
    }

    // 카테고리별 점수 계산
    const categories = this.calculateCategoryScores(results);
    
    // 전체 점수 계산 (가중 평균)
    const overallScore = this.calculateWeightedScore(categories);
    
    // 통과한 규칙 수 계산
    const passedRules = results.filter(r => r.passed).length;
    
    // 권장사항 생성
    const recommendations = this.generateRecommendations(results, categories);

    return {
      documentPath: metadata.type,
      overallScore: Math.round(overallScore),
      passedRules,
      totalRules: results.length,
      results,
      generatedAt: new Date(),
      categories,
      recommendations,
      isPassingMinimumThreshold: overallScore >= this.minimumScore
    };
  }

  /**
   * 기본 품질 규칙 초기화
   */
  private initializeDefaultRules(): void {
    // 완전성 검증 규칙
    this.addRule({
      id: 'completeness.min_length',
      name: '최소 길이 요구사항',
      description: '문서는 최소 500자 이상이어야 합니다',
      category: 'completeness',
      weight: 8,
      enabled: true,
      validator: (content) => {
        const length = content.trim().length;
        const minLength = 500;
        const passed = length >= minLength;
        
        return {
          ruleId: 'completeness.min_length',
          passed,
          score: passed ? 100 : Math.max(0, (length / minLength) * 100),
          message: passed 
            ? `문서 길이가 적절합니다 (${length}자)`
            : `문서가 너무 짧습니다 (${length}자, 최소 ${minLength}자 필요)`,
          suggestions: passed ? [] : [
            '내용을 더 자세히 작성해주세요',
            '예제나 사용법을 추가해주세요',
            '배경 설명을 보강해주세요'
          ],
          severity: passed ? 'info' : 'warning'
        };
      }
    });

    this.addRule({
      id: 'completeness.headings',
      name: '제목 구조 완전성',
      description: '문서에는 적절한 제목 구조가 있어야 합니다',
      category: 'completeness',
      weight: 7,
      enabled: true,
      validator: (content) => {
        const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
        const hasH1 = /^#\s+/.test(content);
        const hasMultipleHeadings = headings.length >= 2;
        
        const passed = hasH1 && hasMultipleHeadings;
        const score = (hasH1 ? 50 : 0) + (hasMultipleHeadings ? 50 : 0);
        
        return {
          ruleId: 'completeness.headings',
          passed,
          score: passed ? 100 : score,
          message: passed 
            ? `제목 구조가 적절합니다 (${headings.length}개 제목)`
            : '적절한 제목 구조가 필요합니다',
          suggestions: passed ? [] : [
            'H1 메인 제목을 추가해주세요',
            '내용을 섹션별로 나누어 제목을 추가해주세요',
            '제목 계층 구조를 명확히 해주세요'
          ],
          severity: passed ? 'info' : 'warning'
        };
      }
    });

    // 정확성 검증 규칙
    this.addRule({
      id: 'accuracy.korean_grammar',
      name: '한국어 문법 정확성',
      description: '기본적인 한국어 문법이 준수되어야 합니다',
      category: 'accuracy',
      weight: 6,
      enabled: true,
      validator: (content, metadata) => {
        if (metadata?.language !== 'ko') {
          return {
            ruleId: 'accuracy.korean_grammar',
            passed: true,
            score: 100,
            message: '한국어 문서가 아니므로 검증을 건너뜁니다',
            suggestions: [],
            severity: 'info'
          };
        }

        // 기본적인 한국어 문법 패턴 검사
        const issues: string[] = [];
        
        // 띄어쓰기 패턴 검사
        if (/[가-힣]{10,}/.test(content)) {
          issues.push('긴 단어에서 띄어쓰기가 누락된 것 같습니다');
        }
        
        // 마침표 사용 일관성
        const sentences = content.split(/[.!?]/).filter(s => s.trim());
        const shortSentencesWithoutPeriod = sentences.filter(s => 
          s.length > 20 && s.length < 100 && !/[.!?]$/.test(s.trim())
        );
        
        if (shortSentencesWithoutPeriod.length > sentences.length * 0.3) {
          issues.push('마침표 사용이 일관되지 않습니다');
        }

        const passed = issues.length === 0;
        const score = Math.max(0, 100 - issues.length * 20);
        
        return {
          ruleId: 'accuracy.korean_grammar',
          passed,
          score,
          message: passed ? '문법이 적절합니다' : `${issues.length}개 문법 이슈 발견`,
          suggestions: passed ? [] : issues.map(issue => `수정 권장: ${issue}`),
          severity: passed ? 'info' : 'warning'
        };
      }
    });

    // 일관성 검증 규칙
    this.addRule({
      id: 'consistency.terminology',
      name: '용어 일관성',
      description: '문서 내에서 동일한 용어가 일관되게 사용되어야 합니다',
      category: 'consistency',
      weight: 7,
      enabled: true,
      validator: (content) => {
        const terms = {
          'API': ['api', 'Api'],
          'UI': ['ui', 'Ui'],
          '컴포넌트': ['컴퍼넌트'],
          '데이터베이스': ['DB', '디비'],
          '사용자': ['유저'],
          '프로젝트': ['프로젝']
        };

        const issues: string[] = [];
        const suggestions: string[] = [];

        for (const [standard, variants] of Object.entries(terms)) {
          for (const variant of variants) {
            const regex = new RegExp(`\\b${variant}\\b`, 'gi');
            if (regex.test(content)) {
              issues.push(`'${variant}' 대신 '${standard}' 사용 권장`);
              suggestions.push(`전체 문서에서 '${variant}'을 '${standard}'로 통일`);
            }
          }
        }

        const passed = issues.length === 0;
        const score = Math.max(0, 100 - issues.length * 15);

        return {
          ruleId: 'consistency.terminology',
          passed,
          score,
          message: passed ? '용어 사용이 일관됩니다' : `${issues.length}개 용어 불일치 발견`,
          suggestions: passed ? [] : suggestions,
          severity: passed ? 'info' : 'warning'
        };
      }
    });

    // 가독성 검증 규칙
    this.addRule({
      id: 'readability.paragraph_length',
      name: '문단 길이 적정성',
      description: '문단은 적절한 길이를 유지해야 합니다',
      category: 'readability',
      weight: 5,
      enabled: true,
      validator: (content) => {
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
        const longParagraphs = paragraphs.filter(p => p.length > 1000);
        const shortParagraphs = paragraphs.filter(p => p.length < 50 && p.length > 0);
        
        const totalParagraphs = paragraphs.length;
        const problematicCount = longParagraphs.length + shortParagraphs.length;
        const ratio = totalParagraphs > 0 ? problematicCount / totalParagraphs : 0;
        
        const passed = ratio < 0.3;
        const score = Math.max(0, 100 - ratio * 100);

        return {
          ruleId: 'readability.paragraph_length',
          passed,
          score,
          message: passed 
            ? '문단 길이가 적절합니다' 
            : `${longParagraphs.length}개 긴 문단, ${shortParagraphs.length}개 짧은 문단`,
          suggestions: passed ? [] : [
            '긴 문단을 여러 문단으로 나누어 주세요',
            '짧은 문단을 결합하거나 내용을 보강해주세요',
            '문단당 100-800자 정도가 적절합니다'
          ],
          severity: passed ? 'info' : 'warning'
        };
      }
    });

    // 구조적 품질 규칙
    this.addRule({
      id: 'structure.table_of_contents',
      name: '목차 존재',
      description: '긴 문서는 목차를 포함해야 합니다',
      category: 'structure',
      weight: 4,
      enabled: true,
      validator: (content) => {
        const contentLength = content.length;
        const hasTableOfContents = /(?:목차|Table of Contents|TOC)/i.test(content);
        const headingCount = (content.match(/^#{1,6}\s+/gm) || []).length;
        
        // 2000자 이상이고 제목이 4개 이상인 경우 목차 권장
        const needsTableOfContents = contentLength > 2000 && headingCount >= 4;
        
        if (!needsTableOfContents) {
          return {
            ruleId: 'structure.table_of_contents',
            passed: true,
            score: 100,
            message: '목차가 필요하지 않은 길이입니다',
            suggestions: [],
            severity: 'info'
          };
        }

        const passed = hasTableOfContents;
        return {
          ruleId: 'structure.table_of_contents',
          passed,
          score: passed ? 100 : 60,
          message: passed ? '목차가 포함되어 있습니다' : '긴 문서에 목차를 추가하는 것을 권장합니다',
          suggestions: passed ? [] : [
            '문서 상단에 목차를 추가해주세요',
            '주요 섹션 링크를 포함해주세요'
          ],
          severity: passed ? 'info' : 'info' // info로 설정 (필수는 아님)
        };
      }
    });

    // 기술 정확성 규칙
    this.addRule({
      id: 'technical_accuracy.code_blocks',
      name: '코드 블록 정확성',
      description: '코드 블록은 적절한 언어 태그를 포함해야 합니다',
      category: 'technical_accuracy',
      weight: 8,
      enabled: true,
      validator: (content) => {
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        const taggedBlocks = content.match(/```\w+[\s\S]*?```/g) || [];
        
        const totalBlocks = codeBlocks.length;
        if (totalBlocks === 0) {
          return {
            ruleId: 'technical_accuracy.code_blocks',
            passed: true,
            score: 100,
            message: '코드 블록이 없습니다',
            suggestions: [],
            severity: 'info'
          };
        }

        const taggedRatio = taggedBlocks.length / totalBlocks;
        const passed = taggedRatio >= 0.8;
        const score = taggedRatio * 100;

        return {
          ruleId: 'technical_accuracy.code_blocks',
          passed,
          score,
          message: passed 
            ? `코드 블록이 적절히 태그되었습니다 (${taggedBlocks.length}/${totalBlocks})`
            : `코드 블록에 언어 태그를 추가해주세요 (${taggedBlocks.length}/${totalBlocks})`,
          suggestions: passed ? [] : [
            '```typescript, ```javascript, ```bash 등 언어 태그 추가',
            '코드 블록의 구문 강조를 위해 언어 지정 필요'
          ],
          severity: passed ? 'info' : 'warning'
        };
      }
    });
  }

  /**
   * 규칙 추가
   */
  addRule(rule: QualityRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * 규칙 제거
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * 규칙 활성화/비활성화
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * 카테고리별 점수 계산
   */
  private calculateCategoryScores(results: QualityResult[]): DocumentQualityReport['categories'] {
    const categories = {} as DocumentQualityReport['categories'];
    
    // 모든 카테고리 초기화
    const allCategories: QualityCategory[] = [
      'completeness', 'accuracy', 'consistency', 'readability', 
      'structure', 'korean_standards', 'technical_accuracy', 'accessibility'
    ];
    
    for (const category of allCategories) {
      categories[category] = {
        score: 0,
        passedCount: 0,
        totalCount: 0
      };
    }

    // 규칙별 결과를 카테고리별로 분류
    for (const result of results) {
      const rule = this.rules.get(result.ruleId);
      if (!rule) continue;

      const category = rule.category;
      categories[category].totalCount++;
      categories[category].score += result.score;
      
      if (result.passed) {
        categories[category].passedCount++;
      }
    }

    // 평균 점수 계산
    for (const category of allCategories) {
      if (categories[category].totalCount > 0) {
        categories[category].score = categories[category].score / categories[category].totalCount;
      } else {
        categories[category].score = 100; // 규칙이 없으면 만점
      }
    }

    return categories;
  }

  /**
   * 가중 평균 점수 계산
   */
  private calculateWeightedScore(categories: DocumentQualityReport['categories']): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [categoryName, categoryData] of Object.entries(categories)) {
      const weight = this.categoryWeights[categoryName as QualityCategory];
      totalWeightedScore += categoryData.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  /**
   * 개선 권장사항 생성
   */
  private generateRecommendations(
    results: QualityResult[], 
    categories: DocumentQualityReport['categories']
  ): string[] {
    const recommendations: string[] = [];
    
    // 점수가 낮은 카테고리 식별
    const lowScoreCategories = Object.entries(categories)
      .filter(([, data]) => data.score < 70)
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, 3); // 최대 3개

    for (const [categoryName] of lowScoreCategories) {
      switch (categoryName as QualityCategory) {
        case 'completeness':
          recommendations.push('📝 문서의 완전성을 높이기 위해 누락된 섹션을 추가하고 내용을 보강해주세요');
          break;
        case 'accuracy':
          recommendations.push('✅ 정확성 향상을 위해 내용을 검토하고 오타를 수정해주세요');
          break;
        case 'consistency':
          recommendations.push('🔄 용어 사용과 스타일의 일관성을 맞춰주세요');
          break;
        case 'readability':
          recommendations.push('👁️ 가독성 개선을 위해 문단 길이를 조정하고 구조를 명확히 해주세요');
          break;
        case 'structure':
          recommendations.push('🏗️ 문서 구조를 개선하여 정보 접근성을 높여주세요');
          break;
        case 'technical_accuracy':
          recommendations.push('⚙️ 기술적 정확성을 위해 코드 예제와 설명을 점검해주세요');
          break;
      }
    }

    // 전체 점수가 낮으면 종합 권장사항 추가
    const overallScore = this.calculateWeightedScore(categories);
    if (overallScore < 60) {
      recommendations.unshift('🚨 전반적인 문서 품질 향상이 필요합니다. 단계별로 개선해나가세요');
    } else if (overallScore < 80) {
      recommendations.unshift('⚡ 문서 품질이 양호하지만 몇 가지 개선점이 있습니다');
    }

    return recommendations.slice(0, 5); // 최대 5개 권장사항
  }

  /**
   * 최소 품질 기준 설정
   */
  setMinimumScore(score: number): void {
    this.minimumScore = Math.max(0, Math.min(100, score));
  }

  /**
   * 모든 규칙 목록 반환
   */
  getRules(): QualityRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 카테고리별 규칙 필터링
   */
  getRulesByCategory(category: QualityCategory): QualityRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.category === category);
  }
}

/**
 * 기본 문서 검증기 인스턴스
 */
export const documentValidator = new DocumentValidator();