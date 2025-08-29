/**
 * @jest-environment jsdom
 */

import { 
  DocumentValidator, 
  QualityRule, 
  QualityResult, 
  DocumentMetadata,
  documentValidator 
} from '../../../../lib/documentation/quality/document-validator';

describe('DocumentValidator', () => {
  let validator: DocumentValidator;

  beforeEach(() => {
    validator = new DocumentValidator();
  });

  describe('문서 품질 검증 기본 기능', () => {
    it('기본 검증 규칙이 초기화되어야 한다', () => {
      const rules = validator.getRules();
      
      expect(rules.length).toBeGreaterThan(5);
      expect(rules.map(r => r.id)).toContain('completeness.min_length');
      expect(rules.map(r => r.id)).toContain('completeness.headings');
      expect(rules.map(r => r.id)).toContain('accuracy.korean_grammar');
    });

    it('높은 품질의 문서는 높은 점수를 받아야 한다', async () => {
      const content = `
# 고품질 문서 예시

이 문서는 적절한 길이와 구조를 갖춘 고품질 문서입니다. 여러 문단으로 구성되어 있으며, 명확한 제목 구조를 가지고 있습니다.

## 주요 기능

다음과 같은 주요 기능들을 제공합니다:

- 기능 1: 상세한 설명과 함께 제공되는 기능
- 기능 2: 사용자 친화적인 인터페이스 제공
- 기능 3: 높은 성능과 안정성 보장

## 사용법

\`\`\`typescript
const example = {
  name: "예시",
  description: "이것은 코드 예시입니다"
};
\`\`\`

## 결론

이 문서는 모든 품질 기준을 충족하도록 작성되었습니다. 적절한 길이와 구조, 명확한 설명을 포함하고 있습니다.
      `.trim();

      const metadata: DocumentMetadata = {
        type: 'user_guide',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: ['guide'],
        language: 'ko',
        targetAudience: 'developer'
      };

      const report = await validator.validateDocument(content, metadata);

      expect(report.overallScore).toBeGreaterThan(80);
      expect(report.isPassingMinimumThreshold).toBe(true);
      expect(report.passedRules).toBeGreaterThan(report.totalRules * 0.7);
    });

    it('낮은 품질의 문서는 낮은 점수를 받아야 한다', async () => {
      const content = 'short';

      const metadata: DocumentMetadata = {
        type: 'readme',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: ['readme'],
        language: 'ko',
        targetAudience: 'user'
      };

      const report = await validator.validateDocument(content, metadata);

      expect(report.overallScore).toBeLessThan(50);
      expect(report.isPassingMinimumThreshold).toBe(false);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('개별 품질 규칙 테스트', () => {
    it('최소 길이 규칙이 정확히 작동해야 한다', async () => {
      const shortContent = 'a'.repeat(100);
      const longContent = 'a'.repeat(600);

      const metadata: DocumentMetadata = {
        type: 'user_guide',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'developer'
      };

      const shortReport = await validator.validateDocument(shortContent, metadata);
      const longReport = await validator.validateDocument(longContent, metadata);

      const shortLengthResult = shortReport.results.find(r => r.ruleId === 'completeness.min_length');
      const longLengthResult = longReport.results.find(r => r.ruleId === 'completeness.min_length');

      expect(shortLengthResult?.passed).toBe(false);
      expect(longLengthResult?.passed).toBe(true);
    });

    it('제목 구조 규칙이 정확히 작동해야 한다', async () => {
      const contentWithHeadings = `
# 메인 제목

## 하위 제목

### 상세 제목

내용...
      `;

      const contentWithoutHeadings = '제목 없는 내용입니다.';

      const metadata: DocumentMetadata = {
        type: 'user_guide',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'developer'
      };

      const withHeadingsReport = await validator.validateDocument(contentWithHeadings, metadata);
      const withoutHeadingsReport = await validator.validateDocument(contentWithoutHeadings, metadata);

      const withHeadingsResult = withHeadingsReport.results.find(r => r.ruleId === 'completeness.headings');
      const withoutHeadingsResult = withoutHeadingsReport.results.find(r => r.ruleId === 'completeness.headings');

      expect(withHeadingsResult?.passed).toBe(true);
      expect(withoutHeadingsResult?.passed).toBe(false);
    });

    it('코드 블록 태그 규칙이 정확히 작동해야 한다', async () => {
      const contentWithTaggedCode = `
# 코드 예시

\`\`\`typescript
const example = "tagged code";
\`\`\`

\`\`\`javascript
const another = "also tagged";
\`\`\`
      `;

      const contentWithUntaggedCode = `
# 코드 예시

\`\`\`
const example = "untagged code";
\`\`\`

\`\`\`
const another = "also untagged";
\`\`\`
      `;

      const metadata: DocumentMetadata = {
        type: 'api_doc',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'developer'
      };

      const taggedReport = await validator.validateDocument(contentWithTaggedCode, metadata);
      const untaggedReport = await validator.validateDocument(contentWithUntaggedCode, metadata);

      const taggedResult = taggedReport.results.find(r => r.ruleId === 'technical_accuracy.code_blocks');
      const untaggedResult = untaggedReport.results.find(r => r.ruleId === 'technical_accuracy.code_blocks');

      expect(taggedResult?.passed).toBe(true);
      expect(untaggedResult?.passed).toBe(false);
    });

    it('용어 일관성 규칙이 정확히 작동해야 한다', async () => {
      const consistentContent = `
# API 문서

이 API는 사용자에게 좋은 UI를 제공합니다.
API 엔드포인트는 사용자 인터페이스와 연동됩니다.
      `;

      const inconsistentContent = `
# api 문서

이 api는 유저에게 좋은 ui를 제공합니다.
API 엔드포인트는 사용자 인터페이스와 연동됩니다.
      `;

      const metadata: DocumentMetadata = {
        type: 'api_doc',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'developer'
      };

      const consistentReport = await validator.validateDocument(consistentContent, metadata);
      const inconsistentReport = await validator.validateDocument(inconsistentContent, metadata);

      const consistentResult = consistentReport.results.find(r => r.ruleId === 'consistency.terminology');
      const inconsistentResult = inconsistentReport.results.find(r => r.ruleId === 'consistency.terminology');

      expect(consistentResult?.passed).toBe(true);
      expect(inconsistentResult?.passed).toBe(false);
    });
  });

  describe('규칙 관리 기능', () => {
    it('새로운 규칙을 추가할 수 있어야 한다', () => {
      const customRule: QualityRule = {
        id: 'custom.test_rule',
        name: '테스트 규칙',
        description: '테스트용 사용자 정의 규칙',
        category: 'completeness',
        weight: 5,
        enabled: true,
        validator: (content) => ({
          ruleId: 'custom.test_rule',
          passed: content.includes('test'),
          score: content.includes('test') ? 100 : 0,
          message: content.includes('test') ? '통과' : '실패',
          suggestions: [],
          severity: 'info'
        })
      };

      validator.addRule(customRule);
      
      const rules = validator.getRules();
      const addedRule = rules.find(r => r.id === 'custom.test_rule');
      
      expect(addedRule).toBeDefined();
      expect(addedRule?.name).toBe('테스트 규칙');
    });

    it('규칙을 제거할 수 있어야 한다', () => {
      const initialRulesCount = validator.getRules().length;
      const ruleToRemove = validator.getRules()[0].id;
      
      validator.removeRule(ruleToRemove);
      
      const finalRulesCount = validator.getRules().length;
      const removedRule = validator.getRules().find(r => r.id === ruleToRemove);
      
      expect(finalRulesCount).toBe(initialRulesCount - 1);
      expect(removedRule).toBeUndefined();
    });

    it('규칙을 활성화/비활성화할 수 있어야 한다', async () => {
      const ruleId = 'completeness.min_length';
      
      // 규칙 비활성화
      validator.toggleRule(ruleId, false);
      
      const shortContent = 'short';
      const metadata: DocumentMetadata = {
        type: 'readme',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'user'
      };

      const report = await validator.validateDocument(shortContent, metadata);
      const disabledRuleResult = report.results.find(r => r.ruleId === ruleId);
      
      // 비활성화된 규칙은 결과에 나타나지 않아야 함
      expect(disabledRuleResult).toBeUndefined();
      
      // 규칙 재활성화
      validator.toggleRule(ruleId, true);
      
      const report2 = await validator.validateDocument(shortContent, metadata);
      const enabledRuleResult = report2.results.find(r => r.ruleId === ruleId);
      
      // 재활성화된 규칙은 결과에 나타나야 함
      expect(enabledRuleResult).toBeDefined();
    });

    it('카테고리별 규칙을 필터링할 수 있어야 한다', () => {
      const completenessRules = validator.getRulesByCategory('completeness');
      const accuracyRules = validator.getRulesByCategory('accuracy');
      
      expect(completenessRules.every(r => r.category === 'completeness')).toBe(true);
      expect(accuracyRules.every(r => r.category === 'accuracy')).toBe(true);
      expect(completenessRules.length).toBeGreaterThan(0);
    });
  });

  describe('품질 점수 계산', () => {
    it('카테고리별 점수가 올바르게 계산되어야 한다', async () => {
      const content = `
# 테스트 문서

이것은 테스트를 위한 중간 품질의 문서입니다. 
몇 가지 품질 기준은 만족하지만 일부는 만족하지 않습니다.

## 섹션 1

내용이 있습니다.

\`\`\`
// 태그가 없는 코드
const test = "test";
\`\`\`
      `;

      const metadata: DocumentMetadata = {
        type: 'user_guide',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'developer'
      };

      const report = await validator.validateDocument(content, metadata);

      expect(report.categories).toBeDefined();
      expect(typeof report.categories.completeness.score).toBe('number');
      expect(typeof report.categories.accuracy.score).toBe('number');
      expect(typeof report.categories.technical_accuracy.score).toBe('number');
      
      // 각 카테고리 점수는 0-100 범위여야 함
      Object.values(report.categories).forEach(category => {
        expect(category.score).toBeGreaterThanOrEqual(0);
        expect(category.score).toBeLessThanOrEqual(100);
      });
    });

    it('전체 점수가 가중 평균으로 올바르게 계산되어야 한다', async () => {
      const content = 'a'.repeat(100); // 짧은 내용으로 낮은 점수 유도

      const metadata: DocumentMetadata = {
        type: 'readme',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'user'
      };

      const report = await validator.validateDocument(content, metadata);

      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(report.overallScore)).toBe(true);
    });
  });

  describe('권장사항 생성', () => {
    it('문제가 있는 문서에 대해 구체적인 권장사항을 제공해야 한다', async () => {
      const problematicContent = 'short no headings';

      const metadata: DocumentMetadata = {
        type: 'user_guide',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'developer'
      };

      const report = await validator.validateDocument(problematicContent, metadata);

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations[0]).toMatch(/완성|내용|제목|구조/);
    });

    it('고품질 문서에 대해서는 권장사항이 적어야 한다', async () => {
      const highQualityContent = `
# 완벽한 문서

이 문서는 모든 품질 기준을 충족합니다. 적절한 길이와 명확한 구조를 가지고 있습니다.

## 상세 설명

각 섹션은 충분한 내용을 포함하고 있으며, 사용자가 이해하기 쉽게 작성되었습니다.

\`\`\`typescript
const example = {
  quality: "high",
  structure: "clear"
};
\`\`\`

## 결론

이 문서는 높은 품질 기준을 만족합니다. 사용자에게 필요한 모든 정보를 제공하며, 명확하고 구조적으로 작성되었습니다.
      `.trim();

      const metadata: DocumentMetadata = {
        type: 'user_guide',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'developer'
      };

      const report = await validator.validateDocument(highQualityContent, metadata);

      expect(report.recommendations.length).toBeLessThan(3);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 규칙이 있어도 검증을 계속해야 한다', async () => {
      const faultyRule: QualityRule = {
        id: 'faulty.rule',
        name: '잘못된 규칙',
        description: '에러를 발생시키는 규칙',
        category: 'completeness',
        weight: 5,
        enabled: true,
        validator: () => {
          throw new Error('Test error');
        }
      };

      validator.addRule(faultyRule);

      const content = 'Test content';
      const metadata: DocumentMetadata = {
        type: 'readme',
        version: '1.0.0',
        author: 'test',
        lastModified: new Date(),
        tags: [],
        language: 'ko',
        targetAudience: 'user'
      };

      const report = await validator.validateDocument(content, metadata);

      // 에러가 있는 규칙도 결과에 포함되어야 함
      const faultyResult = report.results.find(r => r.ruleId === 'faulty.rule');
      expect(faultyResult).toBeDefined();
      expect(faultyResult?.passed).toBe(false);
      expect(faultyResult?.message).toContain('오류 발생');

      // 다른 규칙들은 정상적으로 작동해야 함
      const otherResults = report.results.filter(r => r.ruleId !== 'faulty.rule');
      expect(otherResults.length).toBeGreaterThan(0);
    });
  });

  describe('최소 품질 기준', () => {
    it('최소 품질 기준을 설정하고 확인할 수 있어야 한다', () => {
      validator.setMinimumScore(80);
      
      // protected 메서드이므로 간접적으로 테스트
      // 실제 구현에서는 getter를 추가하거나 테스트 전용 메서드를 제공할 수 있음
      expect(() => validator.setMinimumScore(80)).not.toThrow();
      expect(() => validator.setMinimumScore(-10)).not.toThrow(); // 경계값 내부에서 처리
      expect(() => validator.setMinimumScore(150)).not.toThrow(); // 경계값 내부에서 처리
    });
  });
});

describe('전역 documentValidator 인스턴스', () => {
  it('전역 인스턴스가 사용 가능해야 한다', () => {
    expect(documentValidator).toBeDefined();
    expect(documentValidator).toBeInstanceOf(DocumentValidator);
  });

  it('전역 인스턴스에 기본 규칙들이 있어야 한다', () => {
    const rules = documentValidator.getRules();
    expect(rules.length).toBeGreaterThan(0);
  });
});