// 📋 문서 자동화 시스템 - 타입 정의
// PM System 2025 프로젝트 진행상황 자동 추적 및 문서화

export interface MasterPlanReference {
  phase: 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4';
  currentTask: string; // T-001 ~ T-012
  totalTasks: number;
  completedTasks: number;
  estimatedCompletion: Date;
}

export interface TaskSummary {
  taskId: string; // T-001, T-002, etc.
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  progress: number; // 0-100
  dependencies: string[];
  assignee?: string;
  startDate?: Date;
  completedDate?: Date;
  blockers: Issue[];
  qualityMetrics: QualityMetrics;
}

export interface Milestone {
  id: 'M1' | 'M2' | 'M3' | 'M4';
  title: string;
  targetDate: Date;
  achievedDate?: Date;
  status: 'pending' | 'achieved' | 'delayed';
  criteria: string[];
  progress: number;
}

export interface Issue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'technical' | 'dependency' | 'resource' | 'external';
  description: string;
  impact: string;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  dependencies: string[];
  status: 'todo' | 'in_progress' | 'done';
}

export interface ProgressMetrics {
  codeQuality: {
    complexity: number; // 순환 복잡도
    coverage: number; // 테스트 커버리지
    maintainability: number; // 유지보수 지수
    duplicates: number; // 중복 코드 비율
  };
  performance: {
    buildTime: number; // 빌드 시간 (초)
    bundleSize: number; // 번들 크기 (KB)
    lighthouseScore: number; // Lighthouse 점수
  };
  security: {
    vulnerabilities: number; // 보안 취약점 수
    policies: number; // RLS 정책 수
    complianceScore: number; // ISMS-P 준수율
  };
}

export interface TimelineUpdate {
  originalEstimate: Date;
  currentEstimate: Date;
  variance: number; // 일수 차이
  reason?: string;
  impactedMilestones: string[];
}

// API 문서 생성용 타입들
export interface TypeDefinition {
  name: string;
  type: string;
  description: string;
  required: boolean;
  example?: any;
  validation?: string[];
}

export interface ResponseSchema {
  status: number;
  description: string;
  schema: TypeDefinition[];
  examples: any[];
}

export interface CodeExample {
  language: 'typescript' | 'javascript' | 'curl' | 'python';
  title: string;
  code: string;
  description?: string;
}

export interface HTTPMethod {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

// React 컴포넌트 문서용 타입들
export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description: string;
  examples: string[];
}

export interface ReactExample {
  title: string;
  description: string;
  code: string;
  preview?: string; // 스크린샷 URL
}

export interface A11yRequirements {
  wcagLevel: 'A' | 'AA' | 'AAA';
  requirements: string[];
  tested: boolean;
  issues: string[];
}

export interface DesignTokens {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, string>;
  components: Record<string, any>;
}

// 데이터베이스 스키마 문서용 타입들
export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  description: string;
  constraints: string[];
}

export interface Relationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  targetTable: string;
  foreignKey: string;
  description: string;
}

export interface RLSPolicy {
  name: string;
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  condition: string;
  description: string;
  testCases: string[];
}

export interface MigrationHistory {
  version: string;
  description: string;
  appliedAt: Date;
  rollbackAvailable: boolean;
  changes: string[];
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  type: 'btree' | 'gin' | 'gist' | 'hash';
  unique: boolean;
  description: string;
}

// 문서 생성 템플릿 인터페이스들
export interface ProgressReportTemplate {
  masterPlan: MasterPlanReference;
  completedTasks: TaskSummary[];
  currentMilestone: Milestone;
  blockers: Issue[];
  nextSteps: ActionItem[];
  metrics: ProgressMetrics;
  timeline: TimelineUpdate;
  generatedAt: Date;
  reportPeriod: {
    from: Date;
    to: Date;
  };
}

export interface APIDocTemplate {
  endpoint: string;
  method: HTTPMethod;
  parameters: TypeDefinition[];
  responses: ResponseSchema[];
  examples: CodeExample[];
  generatedFrom: string;
  lastUpdated: Date;
  version: string;
}

export interface ComponentDocTemplate {
  componentName: string;
  filePath: string;
  props: PropDefinition[];
  examples: ReactExample[];
  dependencies: string[];
  accessibility: A11yRequirements;
  designSystem: DesignTokens;
  generatedFrom: string;
  lastUpdated: Date;
}

export interface SchemaDocTemplate {
  tableName: string;
  description: string;
  columns: ColumnDefinition[];
  relationships: Relationship[];
  rlsPolicies: RLSPolicy[];
  migrations: MigrationHistory[];
  indexes: IndexDefinition[];
  generatedFrom: string;
  lastUpdated: Date;
}

// 문서 이벤트 타입들
export interface DocumentationEvent {
  id: string;
  type: 'progress_update' | 'milestone_reached' | 'task_completed' | 'blocker_added' | 'quality_alert';
  payload: any;
  createdAt: Date;
  source: 'git' | 'supabase' | 'manual' | 'ci' | 'quality_gate' | 'file_watcher' | 'sync_manager';
}

export interface DocumentCache {
  id: string;
  documentType: 'progress' | 'api' | 'component' | 'schema';
  content: string;
  metadata: any;
  lastUpdated: Date;
  version: string;
}

// 품질 검증 관련 타입들
export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  details: {
    typescript: boolean;
    eslint: boolean;
    tests: boolean;
    security: boolean;
    performance: boolean;
  };
  issues: Issue[];
  recommendations: string[];
}

export interface QualityMetrics {
  complexity: number;
  coverage: number;
  maintainability: number;
  security: number;
  performance: number;
  overall: number;
}

// 알림 시스템 타입들
export interface NotificationConfig {
  type: 'milestone' | 'blocker' | 'quality' | 'deadline';
  channels: ('dashboard' | 'email' | 'slack' | 'github')[];
  threshold?: number;
  recipients: string[];
}