// 📋 문서 자동화 시스템 - 템플릿 엔진
// Handlebars 기반 동적 문서 생성 시스템

import Handlebars from 'handlebars';
import { format, formatDistanceToNow, formatISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { 
  ProgressReportTemplate, 
  APIDocTemplate, 
  ComponentDocTemplate, 
  SchemaDocTemplate,
  ValidationResult
} from './types/documentation';

export class TemplateEngine {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.registerHelpers();
  }

  /**
   * Handlebars 헬퍼 함수들을 등록합니다
   */
  private registerHelpers(): void {
    // 날짜 포맷팅 헬퍼
    Handlebars.registerHelper('formatDate', (date: Date, formatStr = 'yyyy-MM-dd HH:mm') => {
      if (!date) return '';
      return format(new Date(date), formatStr, { locale: ko });
    });

    // 상대 날짜 헬퍼
    Handlebars.registerHelper('timeAgo', (date: Date) => {
      if (!date) return '';
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
    });

    // 퍼센트 헬퍼
    Handlebars.registerHelper('percent', (value: number, total: number) => {
      if (total === 0) return '0%';
      return Math.round((value / total) * 100) + '%';
    });

    // 진행률 바 헬퍼
    Handlebars.registerHelper('progressBar', (value: number, width = 20) => {
      const filled = Math.round((value / 100) * width);
      const empty = width - filled;
      return '█'.repeat(filled) + '░'.repeat(empty);
    });

    // 상태별 이모지 헬퍼
    Handlebars.registerHelper('statusEmoji', (status: string) => {
      const emojis = {
        'pending': '⏳',
        'in_progress': '🔄', 
        'completed': '✅',
        'blocked': '🚨',
        'delayed': '⚠️',
        'achieved': '🎯'
      };
      return emojis[status as keyof typeof emojis] || '❓';
    });

    // 우선순위 색상 헬퍼
    Handlebars.registerHelper('priorityColor', (priority: string) => {
      const colors = {
        'low': '🟢',
        'medium': '🟡',
        'high': '🟠',
        'urgent': '🔴',
        'critical': '🚨'
      };
      return colors[priority as keyof typeof colors] || '⚪';
    });

    // 복잡도 등급 헬퍼
    Handlebars.registerHelper('complexityGrade', (complexity: number) => {
      if (complexity <= 5) return '🟢 단순';
      if (complexity <= 10) return '🟡 보통';
      if (complexity <= 15) return '🟠 복잡';
      return '🔴 매우복잡';
    });

    // 품질 점수 헬퍼
    Handlebars.registerHelper('qualityGrade', (score: number) => {
      if (score >= 90) return '🟢 우수';
      if (score >= 70) return '🟡 양호';
      if (score >= 50) return '🟠 개선필요';
      return '🔴 불량';
    });

    // JSON 출력 헬퍼
    Handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2);
    });

    // 조건부 헬퍼
    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('ifGreater', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
    });
  }

  /**
   * 템플릿을 로드하고 컴파일합니다
   */
  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName)!;
    }

    try {
      // 실제 환경에서는 파일 시스템에서 템플릿을 로드
      const templateContent = await this.getTemplateContent(templateName);
      const compiled = Handlebars.compile(templateContent);
      this.templates.set(templateName, compiled);
      return compiled;
    } catch (error) {
      throw new Error(`템플릿 로드 실패: ${templateName} - ${error}`);
    }
  }

  /**
   * 템플릿 내용을 가져옵니다 (실제로는 파일에서 로드)
   */
  private async getTemplateContent(templateName: string): Promise<string> {
    const templates: Record<string, string> = {
      'progress-report': `
# 📊 PM System 2025 진행상황 보고서

**생성일**: {{formatDate generatedAt "yyyy년 MM월 dd일 HH:mm"}}
**보고 기간**: {{formatDate reportPeriod.from "MM/dd"}} ~ {{formatDate reportPeriod.to "MM/dd"}}

---

## 🎯 현재 상태

### 마스터플랜 진행률
- **현재 단계**: {{masterPlan.phase}}
- **현재 작업**: {{masterPlan.currentTask}}
- **전체 진행률**: {{percent masterPlan.completedTasks masterPlan.totalTasks}} ({{masterPlan.completedTasks}}/{{masterPlan.totalTasks}})
- **완료 예정**: {{formatDate masterPlan.estimatedCompletion "yyyy년 MM월 dd일"}}

{{#with currentMilestone}}
### 🏁 현재 마일스톤: {{title}}
- **상태**: {{statusEmoji status}} {{status}}
- **목표일**: {{formatDate targetDate "MM월 dd일"}}
- **진행률**: {{progressBar progress}} {{progress}}%
{{#if achievedDate}}
- **달성일**: {{formatDate achievedDate "MM월 dd일"}} 🎉
{{/if}}
{{/with}}

---

## 📋 완료된 작업들

{{#each completedTasks}}
### {{statusEmoji status}} {{title}} ({{taskId}})
- **완료일**: {{formatDate completedDate "MM월 dd일"}}
- **품질 점수**: {{qualityGrade qualityMetrics.overall}} ({{qualityMetrics.overall}}점)
- **복잡도**: {{complexityGrade qualityMetrics.complexity}}

{{#if qualityMetrics.coverage}}
**품질 메트릭**:
- 테스트 커버리지: {{qualityMetrics.coverage}}%
- 코드 복잡도: {{qualityMetrics.complexity}}
- 유지보수성: {{qualityMetrics.maintainability}}점
{{/if}}
{{/each}}

---

## 🚨 차단 요소 및 이슈

{{#if blockers}}
{{#each blockers}}
### {{priorityColor severity}} {{description}}
- **심각도**: {{severity}}
- **유형**: {{type}}
- **영향도**: {{impact}}
- **발생일**: {{formatDate createdAt "MM월 dd일"}}
{{#if resolution}}
- **해결방안**: {{resolution}}
{{/if}}
{{#if resolvedAt}}
- **해결일**: {{formatDate resolvedAt "MM월 dd일"}} ✅
{{/if}}

{{/each}}
{{else}}
현재 차단 요소가 없습니다. 🎉
{{/if}}

---

## 📈 성과 지표

### 코드 품질
- **복잡도**: {{complexityGrade metrics.codeQuality.complexity}} ({{metrics.codeQuality.complexity}})
- **테스트 커버리지**: {{metrics.codeQuality.coverage}}% {{progressBar metrics.codeQuality.coverage}}
- **유지보수성**: {{qualityGrade metrics.codeQuality.maintainability}} ({{metrics.codeQuality.maintainability}}점)
- **중복 코드**: {{metrics.codeQuality.duplicates}}%

### 성능
- **빌드 시간**: {{metrics.performance.buildTime}}초
- **번들 크기**: {{metrics.performance.bundleSize}}KB
- **Lighthouse 점수**: {{metrics.performance.lighthouseScore}}점 {{qualityGrade metrics.performance.lighthouseScore}}

### 보안
- **취약점 수**: {{metrics.security.vulnerabilities}}개
- **RLS 정책**: {{metrics.security.policies}}개
- **ISMS-P 준수율**: {{metrics.security.complianceScore}}%

---

## 🎯 다음 단계

{{#each nextSteps}}
### {{priorityColor priority}} {{title}}
- **담당자**: {{assignee}}
- **마감일**: {{formatDate dueDate "MM월 dd일"}}
- **우선순위**: {{priority}}
- **설명**: {{description}}
{{#if dependencies}}
- **선행조건**: {{#each dependencies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{/each}}

---

## 📅 일정 조정 사항

{{#with timeline}}
{{#ifGreater variance 0}}
⚠️ **일정 지연**: {{variance}}일
- **원래 예정**: {{formatDate originalEstimate "MM월 dd일"}}
- **수정 예정**: {{formatDate currentEstimate "MM월 dd일"}}
{{#if reason}}
- **사유**: {{reason}}
{{/if}}
{{#if impactedMilestones}}
- **영향받는 마일스톤**: {{#each impactedMilestones}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{else}}
✅ **일정 준수**: 계획대로 진행 중
{{/ifGreater}}
{{/with}}

---

*🤖 이 보고서는 PM System 2025 문서 자동화 시스템에 의해 생성되었습니다.*
      `,

      'api-docs': `
# 🔌 API 문서: {{endpoint}}

**메서드**: \`{{method.method}}\`
**엔드포인트**: \`{{endpoint}}\`
**최종 업데이트**: {{formatDate lastUpdated}}
**버전**: {{version}}

---

## 📝 설명

이 API는 {{generatedFrom}} 파일에서 자동 생성되었습니다.

---

## 📋 매개변수

{{#if parameters}}
{{#each parameters}}
### \`{{name}}\` {{#if required}}**(필수)**{{else}}(선택){{/if}}
- **타입**: \`{{type}}\`
- **설명**: {{description}}
{{#if example}}
- **예시**: \`{{json example}}\`
{{/if}}
{{#if validation}}
- **유효성 검사**: {{#each validation}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{/each}}
{{else}}
매개변수가 없습니다.
{{/if}}

---

## 📤 응답

{{#each responses}}
### {{status}} - {{description}}

{{#each schema}}
- **\`{{name}}\`** ({{type}}){{#if required}} *필수*{{/if}}: {{description}}
{{/each}}

{{#if examples}}
**예시 응답**:
{{#each examples}}
\`\`\`json
{{json this}}
\`\`\`
{{/each}}
{{/if}}

---
{{/each}}

## 💻 코드 예제

{{#each examples}}
### {{title}} ({{language}})

{{#if description}}
{{description}}
{{/if}}

\`\`\`{{language}}
{{code}}
\`\`\`

---
{{/each}}

*🤖 이 문서는 {{generatedFrom}}에서 자동 생성되었습니다.*
      `,

      'component-docs': `
# 🧩 컴포넌트: {{componentName}}

**파일 경로**: \`{{filePath}}\`
**최종 업데이트**: {{formatDate lastUpdated}}

---

## 📝 설명

이 컴포넌트는 {{generatedFrom}} 파일에서 자동 생성된 문서입니다.

---

## 🔧 Props

{{#if props}}
{{#each props}}
### \`{{name}}\` {{#if required}}**(필수)**{{else}}(선택){{/if}}
- **타입**: \`{{type}}\`
- **설명**: {{description}}
{{#if defaultValue}}
- **기본값**: \`{{json defaultValue}}\`
{{/if}}

**사용 예시**:
{{#each examples}}
\`\`\`tsx
{{this}}
\`\`\`
{{/each}}

---
{{/each}}
{{else}}
이 컴포넌트는 props가 없습니다.
{{/if}}

---

## 💻 사용 예제

{{#each examples}}
### {{title}}

{{description}}

\`\`\`tsx
{{code}}
\`\`\`

{{#if preview}}
**미리보기**: ![{{title}}]({{preview}})
{{/if}}

---
{{/each}}

---

## 📦 의존성

{{#if dependencies}}
{{#each dependencies}}
- \`{{this}}\`
{{/each}}
{{else}}
외부 의존성이 없습니다.
{{/if}}

---

## ♿ 접근성

{{#with accessibility}}
- **WCAG 레벨**: {{wcagLevel}}
- **테스트 완료**: {{#if tested}}✅{{else}}❌{{/if}}

{{#if requirements}}
**요구사항**:
{{#each requirements}}
- {{this}}
{{/each}}
{{/if}}

{{#if issues}}
**이슈**:
{{#each issues}}
- ⚠️ {{this}}
{{/each}}
{{/if}}
{{/with}}

---

## 🎨 디자인 시스템

{{#with designSystem}}
{{#if colors}}
**컬러**:
{{#each colors}}
- **{{@key}}**: {{this}}
{{/each}}
{{/if}}

{{#if spacing}}
**간격**:
{{#each spacing}}
- **{{@key}}**: {{this}}
{{/each}}
{{/if}}
{{/with}}

---

*🤖 이 문서는 {{generatedFrom}}에서 자동 생성되었습니다.*
      `,

      'schema-docs': `
# 🗄️ 데이터베이스 스키마: {{tableName}}

**설명**: {{description}}
**최종 업데이트**: {{formatDate lastUpdated}}
**소스**: {{generatedFrom}}

---

## 📊 컬럼 정의

| 컬럼명 | 타입 | Null 허용 | 기본값 | 제약조건 | 설명 |
|--------|------|-----------|---------|----------|------|
{{#each columns}}
| \`{{name}}\` | {{type}} | {{#if nullable}}✅{{else}}❌{{/if}} | {{#if default}}\`{{default}}\`{{else}}-{{/if}} | {{#each constraints}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} | {{description}} |
{{/each}}

---

## 🔗 관계 (Relationships)

{{#if relationships}}
{{#each relationships}}
### {{type}} → {{targetTable}}
- **외래 키**: \`{{foreignKey}}\`
- **설명**: {{description}}

{{/each}}
{{else}}
이 테이블은 다른 테이블과 관계가 없습니다.
{{/if}}

---

## 🛡️ RLS 정책

{{#if rlsPolicies}}
{{#each rlsPolicies}}
### {{name}} ({{action}})
- **조건**: \`{{condition}}\`
- **설명**: {{description}}

{{#if testCases}}
**테스트 케이스**:
{{#each testCases}}
- {{this}}
{{/each}}
{{/if}}

---
{{/each}}
{{else}}
RLS 정책이 설정되어 있지 않습니다. ⚠️
{{/if}}

---

## 🔍 인덱스

{{#if indexes}}
{{#each indexes}}
### {{name}} {{#if unique}}(UNIQUE){{/if}}
- **타입**: {{type}}
- **컬럼**: {{#each columns}}\`{{this}}\`{{#unless @last}}, {{/unless}}{{/each}}
- **설명**: {{description}}

{{/each}}
{{else}}
사용자 정의 인덱스가 없습니다.
{{/if}}

---

## 📈 마이그레이션 히스토리

{{#each migrations}}
### {{version}} - {{formatDate appliedAt "yyyy-MM-dd"}}
{{description}}

**변경사항**:
{{#each changes}}
- {{this}}
{{/each}}

{{#if rollbackAvailable}}
✅ 롤백 가능
{{else}}
❌ 롤백 불가능
{{/if}}

---
{{/each}}

---

*🤖 이 문서는 {{generatedFrom}}에서 자동 생성되었습니다.*
      `
    };

    return templates[templateName] || '';
  }

  /**
   * 진행상황 보고서를 생성합니다
   */
  async generateProgressReport(data: ProgressReportTemplate): Promise<string> {
    const template = await this.loadTemplate('progress-report');
    return template(data);
  }

  /**
   * API 문서를 생성합니다
   */
  async generateAPIDoc(data: APIDocTemplate): Promise<string> {
    const template = await this.loadTemplate('api-docs');
    return template(data);
  }

  /**
   * 컴포넌트 문서를 생성합니다
   */
  async generateComponentDoc(data: ComponentDocTemplate): Promise<string> {
    const template = await this.loadTemplate('component-docs');
    return template(data);
  }

  /**
   * 데이터베이스 스키마 문서를 생성합니다
   */
  async generateSchemaDoc(data: SchemaDocTemplate): Promise<string> {
    const template = await this.loadTemplate('schema-docs');
    return template(data);
  }

  /**
   * 품질 검증 결과 문서를 생성합니다
   */
  async generateValidationReport(data: ValidationResult): Promise<string> {
    const reportTemplate = `
# 🔍 품질 검증 보고서

**검증일**: {{formatDate (new Date) "yyyy년 MM월 dd일 HH:mm"}}
**결과**: {{#if passed}}✅ 통과{{else}}❌ 실패{{/if}}
**점수**: {{score}}/100점 {{qualityGrade score}}

---

## 📊 상세 결과

{{#with details}}
- **TypeScript**: {{#if typescript}}✅ 통과{{else}}❌ 실패{{/if}}
- **ESLint**: {{#if eslint}}✅ 통과{{else}}❌ 실패{{/if}}
- **테스트**: {{#if tests}}✅ 통과{{else}}❌ 실패{{/if}}
- **보안**: {{#if security}}✅ 통과{{else}}❌ 실패{{/if}}
- **성능**: {{#if performance}}✅ 통과{{else}}❌ 실패{{/if}}
{{/with}}

---

{{#if issues}}
## 🚨 발견된 이슈

{{#each issues}}
### {{priorityColor severity}} {{description}}
- **심각도**: {{severity}}
- **유형**: {{type}}
- **영향도**: {{impact}}
{{#if resolution}}
- **해결방안**: {{resolution}}
{{/if}}
{{/each}}
{{/if}}

{{#if recommendations}}
## 💡 개선 권장사항

{{#each recommendations}}
- {{this}}
{{/each}}
{{/if}}

---

*🤖 이 보고서는 PM System 2025 품질 검증 시스템에 의해 자동 생성되었습니다.*
    `;

    const template = Handlebars.compile(reportTemplate);
    return template(data);
  }

  /**
   * 커스텀 템플릿으로 문서를 생성합니다
   */
  async generateCustomDoc(templateContent: string, data: any): Promise<string> {
    const template = Handlebars.compile(templateContent);
    return template(data);
  }

  /**
   * 템플릿 캐시를 초기화합니다
   */
  clearCache(): void {
    this.templates.clear();
  }
}

// 싱글톤 인스턴스 생성
export const templateEngine = new TemplateEngine();

// Export types that are used by other modules
export type { ProgressReportTemplate } from './types/documentation';