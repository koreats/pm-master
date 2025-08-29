// 🔍 코드 분석 및 메트릭 수집기
// TypeScript 파일 분석을 통한 API/컴포넌트 문서 자동 생성

import * as ts from 'typescript';
import { promises as fs } from 'fs';
import path from 'path';
import type { 
  APIDocTemplate,
  ComponentDocTemplate,
  PropDefinition,
  TypeDefinition,
  CodeExample
} from '../types/documentation';

export class CodeAnalysisCollector {
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;

  constructor() {
    this.initializeTypeScriptProgram();
  }

  /**
   * TypeScript 컴파일러 프로그램을 초기화합니다
   */
  private initializeTypeScriptProgram(): void {
    try {
      const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
      if (!configPath) {
        console.warn('tsconfig.json을 찾을 수 없습니다.');
        return;
      }

      const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
      const { options, fileNames } = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        path.dirname(configPath)
      );

      this.program = ts.createProgram(fileNames, options);
      this.checker = this.program.getTypeChecker();
    } catch (error) {
      console.error('TypeScript 프로그램 초기화 실패:', error);
    }
  }

  /**
   * React 컴포넌트 파일을 분석합니다
   */
  async analyzeReactComponent(filePath: string): Promise<ComponentDocTemplate | null> {
    if (!this.program || !this.checker) {
      throw new Error('TypeScript 프로그램이 초기화되지 않았습니다');
    }

    try {
      const sourceFile = this.program.getSourceFile(filePath);
      if (!sourceFile) {
        throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
      }

      const componentInfo = this.extractComponentInfo(sourceFile);
      if (!componentInfo) {
        return null;
      }

      const props = await this.extractProps(sourceFile, componentInfo.name);
      const examples = await this.generateComponentExamples(componentInfo.name, props);
      const dependencies = this.extractDependencies(sourceFile);

      return {
        componentName: componentInfo.name,
        filePath,
        props,
        examples: examples.map(e => ({ ...e, description: e.description || '' })),
        dependencies,
        accessibility: {
          wcagLevel: 'AA',
          requirements: [
            '키보드 내비게이션 지원',
            '스크린 리더 호환',
            '적절한 색상 대비'
          ],
          tested: false,
          issues: []
        },
        designSystem: {
          colors: {},
          spacing: {},
          typography: {},
          components: {}
        },
        generatedFrom: filePath,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`컴포넌트 분석 실패 (${filePath}):`, error);
      return null;
    }
  }

  /**
   * API 라우트 파일을 분석합니다
   */
  async analyzeAPIRoute(filePath: string): Promise<APIDocTemplate | null> {
    if (!this.program || !this.checker) {
      throw new Error('TypeScript 프로그램이 초기화되지 않았습니다');
    }

    try {
      const sourceFile = this.program.getSourceFile(filePath);
      if (!sourceFile) {
        throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
      }

      const apiInfo = this.extractAPIInfo(sourceFile, filePath);
      if (!apiInfo) {
        return null;
      }

      return {
        endpoint: apiInfo.endpoint,
        method: apiInfo.method,
        parameters: apiInfo.parameters,
        responses: apiInfo.responses,
        examples: await this.generateAPIExamples(apiInfo),
        generatedFrom: filePath,
        lastUpdated: new Date(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error(`API 라우트 분석 실패 (${filePath}):`, error);
      return null;
    }
  }

  /**
   * 컴포넌트 정보를 추출합니다
   */
  private extractComponentInfo(sourceFile: ts.SourceFile): { name: string; node: ts.Node } | null {
    let componentInfo: { name: string; node: ts.Node } | null = null;

    const visit = (node: ts.Node) => {
      // 함수 컴포넌트 (function declaration)
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        if (this.isReactComponent(name)) {
          componentInfo = { name, node };
          return;
        }
      }

      // 화살표 함수 컴포넌트 (variable declaration)
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach(decl => {
          if (ts.isIdentifier(decl.name) && decl.initializer) {
            const name = decl.name.text;
            if (this.isReactComponent(name)) {
              componentInfo = { name, node: decl };
              return;
            }
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return componentInfo;
  }

  /**
   * React 컴포넌트인지 확인합니다
   */
  private isReactComponent(name: string): boolean {
    // 컴포넌트는 대문자로 시작
    return /^[A-Z][a-zA-Z0-9]*/.test(name);
  }

  /**
   * 컴포넌트의 props를 추출합니다
   */
  private async extractProps(sourceFile: ts.SourceFile, componentName: string): Promise<PropDefinition[]> {
    if (!this.checker) return [];

    const props: PropDefinition[] = [];

    const visit = (node: ts.Node) => {
      // Props 인터페이스 찾기
      if (ts.isInterfaceDeclaration(node)) {
        const interfaceName = node.name.text;
        if (interfaceName.includes('Props') || interfaceName.includes(componentName)) {
          node.members.forEach(member => {
            if (ts.isPropertySignature(member) && member.name) {
              const prop = this.extractPropDefinition(member);
              if (prop) {
                props.push(prop);
              }
            }
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return props;
  }

  /**
   * 개별 prop 정의를 추출합니다
   */
  private extractPropDefinition(member: ts.PropertySignature): PropDefinition | null {
    if (!member.name || !this.checker) return null;

    const name = member.name.getText();
    const type = member.type ? member.type.getText() : 'any';
    const required = !member.questionToken;
    
    // JSDoc 코멘트에서 설명 추출
    const jsDocTags = ts.getJSDocTags(member);
    const description = jsDocTags
      .filter(tag => !tag.tagName || tag.tagName.text === 'description')
      .map(tag => tag.comment || '')
      .join(' ') || '설명이 없습니다.';

    return {
      name,
      type,
      required,
      description,
      examples: [`<MyComponent ${name}={${this.generateExampleValue(type)}} />`]
    };
  }

  /**
   * 타입에 따른 예시 값을 생성합니다
   */
  private generateExampleValue(type: string): string {
    const typeMap: Record<string, string> = {
      'string': '"example"',
      'number': '42',
      'boolean': 'true',
      'Date': 'new Date()',
      'ReactNode': '<span>내용</span>'
    };

    return typeMap[type] || '/* 값 */';
  }

  /**
   * 의존성을 추출합니다
   */
  private extractDependencies(sourceFile: ts.SourceFile): string[] {
    const dependencies: string[] = [];

    sourceFile.statements.forEach(statement => {
      if (ts.isImportDeclaration(statement)) {
        const moduleSpecifier = statement.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const moduleName = moduleSpecifier.text;
          if (!moduleName.startsWith('.')) { // 외부 패키지만
            dependencies.push(moduleName);
          }
        }
      }
    });

    return [...new Set(dependencies)];
  }

  /**
   * API 정보를 추출합니다
   */
  private extractAPIInfo(sourceFile: ts.SourceFile, filePath: string) {
    const endpoint = this.convertFilePathToEndpoint(filePath);
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    let detectedMethod = 'GET';
    let parameters: TypeDefinition[] = [];
    let responses: any[] = [];

    // 파일 내용에서 HTTP 메서드 감지
    const fileContent = sourceFile.getFullText();
    for (const method of httpMethods) {
      if (fileContent.includes(`export async function ${method}`) || 
          fileContent.includes(`export const ${method}`)) {
        detectedMethod = method;
        break;
      }
    }

    // Request/Response 타입 추출 시도
    sourceFile.statements.forEach(statement => {
      if (ts.isInterfaceDeclaration(statement)) {
        const interfaceName = statement.name.text;
        if (interfaceName.includes('Request') || interfaceName.includes('Body')) {
          parameters = this.extractTypeDefinitions(statement);
        }
        if (interfaceName.includes('Response')) {
          responses = [{
            status: 200,
            description: '성공',
            schema: this.extractTypeDefinitions(statement),
            examples: []
          }];
        }
      }
    });

    return {
      endpoint,
      method: { method: detectedMethod as any },
      parameters,
      responses
    };
  }

  /**
   * 파일 경로를 API 엔드포인트로 변환합니다
   */
  private convertFilePathToEndpoint(filePath: string): string {
    // app/api/users/[id]/route.ts -> /api/users/[id]
    return filePath
      .replace(/^app/, '')
      .replace(/\/route\.(ts|js)$/, '')
      .replace(/\[([^\]]+)\]/g, '{$1}');
  }

  /**
   * 인터페이스에서 타입 정의를 추출합니다
   */
  private extractTypeDefinitions(interfaceDecl: ts.InterfaceDeclaration): TypeDefinition[] {
    const types: TypeDefinition[] = [];

    interfaceDecl.members.forEach(member => {
      if (ts.isPropertySignature(member) && member.name) {
        const name = member.name.getText();
        const type = member.type ? member.type.getText() : 'any';
        const required = !member.questionToken;

        types.push({
          name,
          type,
          description: '자동 생성된 설명',
          required,
          example: this.generateExampleValue(type)
        });
      }
    });

    return types;
  }

  /**
   * 컴포넌트 사용 예제를 생성합니다
   */
  private async generateComponentExamples(componentName: string, props: PropDefinition[]): Promise<CodeExample[]> {
    const examples: CodeExample[] = [
      {
        language: 'typescript',
        title: '기본 사용법',
        code: `import { ${componentName} } from './components/${componentName}';

export default function ExamplePage() {
  return (
    <div>
      <${componentName}${props.length > 0 ? ' ' + props.map(p => `${p.name}={${p.examples[0]}}`).join(' ') : ''} />
    </div>
  );
}`,
        description: `${componentName} 컴포넌트의 기본적인 사용법입니다.`
      }
    ];

    return examples;
  }

  /**
   * API 사용 예제를 생성합니다
   */
  private async generateAPIExamples(apiInfo: any): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];

    // TypeScript fetch 예제
    examples.push({
      language: 'typescript',
      title: 'TypeScript로 API 호출',
      code: `const response = await fetch('${apiInfo.endpoint}', {
  method: '${apiInfo.method.method}',
  headers: {
    'Content-Type': 'application/json',
  },${apiInfo.parameters.length > 0 ? `
  body: JSON.stringify({
${apiInfo.parameters.map((p: any) => `    ${p.name}: ${p.example}`).join(',\n')}
  }),` : ''}
});

const data = await response.json();
console.log(data);`,
      description: `${apiInfo.method.method} 메서드로 API를 호출하는 예제입니다.`
    });

    // cURL 예제
    examples.push({
      language: 'curl',
      title: 'cURL로 API 호출',
      code: `curl -X ${apiInfo.method.method} \\
  -H "Content-Type: application/json" \\${apiInfo.parameters.length > 0 ? `
  -d '{${apiInfo.parameters.map((p: any) => `"${p.name}": ${JSON.stringify(p.example)}`).join(', ')}}' \\` : ''}
  ${apiInfo.endpoint}`,
      description: 'cURL을 사용한 API 호출 예제입니다.'
    });

    return examples;
  }

  /**
   * 프로젝트의 모든 컴포넌트를 스캔합니다
   */
  async scanAllComponents(): Promise<ComponentDocTemplate[]> {
    const componentDocs: ComponentDocTemplate[] = [];
    const componentsDir = path.join(process.cwd(), 'components');

    try {
      const scan = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            const doc = await this.analyzeReactComponent(fullPath);
            if (doc) {
              componentDocs.push(doc);
            }
          }
        }
      };

      await scan(componentsDir);
    } catch (error) {
      console.warn('컴포넌트 스캔 중 오류:', error);
    }

    return componentDocs;
  }

  /**
   * 프로젝트의 모든 API 라우트를 스캔합니다  
   */
  async scanAllAPIRoutes(): Promise<APIDocTemplate[]> {
    const apiDocs: APIDocTemplate[] = [];
    const apiDir = path.join(process.cwd(), 'app', 'api');

    try {
      const scan = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
            const doc = await this.analyzeAPIRoute(fullPath);
            if (doc) {
              apiDocs.push(doc);
            }
          }
        }
      };

      if (await fs.access(apiDir).then(() => true).catch(() => false)) {
        await scan(apiDir);
      }
    } catch (error) {
      console.warn('API 라우트 스캔 중 오류:', error);
    }

    return apiDocs;
  }

  /**
   * 코드 품질 메트릭을 수집합니다
   */
  async getCodeQualityMetrics() {
    if (!this.program) {
      return {
        complexity: 0,
        coverage: 0,
        maintainability: 0,
        issues: []
      };
    }

    const sourceFiles = this.program.getSourceFiles()
      .filter(sf => !sf.fileName.includes('node_modules'));

    let totalComplexity = 0;
    let fileCount = 0;

    for (const sourceFile of sourceFiles) {
      const complexity = this.calculateCyclomaticComplexity(sourceFile);
      totalComplexity += complexity;
      fileCount++;
    }

    return {
      complexity: fileCount > 0 ? Math.round(totalComplexity / fileCount) : 0,
      coverage: 85, // Jest에서 가져와야 함
      maintainability: 90, // SonarQube 등에서 가져와야 함
      issues: [] // ESLint 결과에서 가져와야 함
    };
  }

  /**
   * 순환 복잡도를 계산합니다
   */
  private calculateCyclomaticComplexity(sourceFile: ts.SourceFile): number {
    let complexity = 1; // 기본 복잡도

    const visit = (node: ts.Node) => {
      // 조건문, 반복문, switch case 등에 대해 복잡도 증가
      if (ts.isIfStatement(node) || 
          ts.isWhileStatement(node) || 
          ts.isForStatement(node) ||
          ts.isDoStatement(node) ||
          ts.isForInStatement(node) ||
          ts.isForOfStatement(node) ||
          ts.isCaseClause(node) ||
          ts.isCatchClause(node)) {
        complexity++;
      }

      // 논리 연산자 (&&, ||)에 대해서도 복잡도 증가
      if (ts.isBinaryExpression(node)) {
        if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
          complexity++;
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return complexity;
  }
}