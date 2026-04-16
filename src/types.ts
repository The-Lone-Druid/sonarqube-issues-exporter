// ── SonarQube API Types ──────────────────────────────────────────────────────

export interface SonarQubeIssue {
  key: string;
  rule: string;
  severity: IssueSeverity;
  component: string;
  project: string;
  line?: number;
  hash?: string;
  textRange?: TextRange;
  flows: Flow[];
  status: IssueStatus;
  message: string;
  effort?: string;
  debt?: string;
  assignee?: string;
  author?: string;
  tags: string[];
  transitions?: string[];
  actions?: string[];
  comments?: Comment[];
  creationDate: string;
  updateDate?: string;
  type: IssueType;
  scope?: string;
  quickFixAvailable?: boolean;
  messageFormattings?: MessageFormatting[];
}

export type IssueSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
export type IssueStatus = 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';
export type IssueType = 'BUG' | 'VULNERABILITY' | 'CODE_SMELL' | 'SECURITY_HOTSPOT';

export interface TextRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

export interface Flow {
  locations?: FlowLocation[];
}

export interface FlowLocation {
  component: string;
  textRange?: TextRange;
  msg?: string;
}

export interface Comment {
  key: string;
  login: string;
  htmlText: string;
  markdown: string;
  updatable: boolean;
  createdAt: string;
}

export interface MessageFormatting {
  start: number;
  end: number;
  type: string;
}

export interface SonarQubePaging {
  pageIndex: number;
  pageSize: number;
  total: number;
}

export interface SonarQubeSearchResponse {
  total: number;
  p: number;
  ps: number;
  paging: SonarQubePaging;
  issues: SonarQubeIssue[];
}

// ── Quality Gate Types ───────────────────────────────────────────────────────

export interface QualityGateCondition {
  metric: string;
  operator: string;
  value?: string;
  errorThreshold?: string;
  warningThreshold?: string;
  actualValue?: string;
  status: 'OK' | 'WARN' | 'ERROR';
}

export interface QualityGateStatus {
  status: 'PASSED' | 'FAILED' | 'NONE';
  conditions: QualityGateCondition[];
}

// ── Project Measures Types ───────────────────────────────────────────────────

export interface ProjectMeasures {
  coverage?: number;
  duplicatedLinesDensity?: number;
  linesOfCode?: number;
  technicalDebt?: string;
  maintainabilityRating?: string;
  reliabilityRating?: string;
  securityRating?: string;
  complexity?: number;
}

// ── Security Hotspot Types ───────────────────────────────────────────────────

export interface SecurityHotspot {
  key: string;
  component: string;
  project: string;
  securityCategory: string;
  vulnerabilityProbability: string;
  status: string;
  resolution?: string;
  line?: number;
  hash: string;
  textRange?: TextRange;
  flows: Flow[];
  ruleKey: string;
  messageFormattings: MessageFormatting[];
  creationDate: string;
  updateDate: string;
  assignee?: string;
}

export interface SecurityHotspotsData {
  total: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  hotspots: SecurityHotspot[];
}

// ── Configuration Types ──────────────────────────────────────────────────────

export interface AppConfig {
  sonarqube: SonarQubeConfig;
  export: ExportConfig;
  logging: LoggingConfig;
}

export interface SonarQubeConfig {
  url: string;
  token: string;
  projectKey: string;
  organization?: string;
}

export interface ExportConfig {
  outputPath: string;
  filename: string;
  excludeStatuses: string[];
  includeResolvedIssues: boolean;
  maxIssues: number;
  template: string;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  file?: string;
}

export interface ConfigLoadOptions {
  configPath?: string;
  overrides?: Partial<AppConfig>;
}

// ── Report Types ─────────────────────────────────────────────────────────────

export interface ProcessedIssue {
  key: string;
  file: string;
  line: number | string;
  message: string;
  severity: string;
  status: string;
  type: string;
  rule: string;
  component: string;
  creationDate: string;
  updateDate?: string;
  assignee?: string;
  author?: string;
  tags: string[];
  effort?: string;
  debt?: string;
}

export interface ReportMetrics {
  total: number;
  severities: Record<string, number>;
  types: Record<string, number>;
  statuses: Record<string, number>;
  components: Record<string, number>;
  rules: Record<string, number>;
}

export interface ReportMetadata {
  generatedAt: string;
  projectKey: string;
  sonarQubeUrl: string;
  totalIssues: number;
  reportVersion: string;
  filters: {
    excludedStatuses: string[];
    includeResolvedIssues: boolean;
  };
}

export interface EnhancedTemplateData {
  issues: ProcessedIssue[];
  metrics: ReportMetrics;
  metadata: ReportMetadata;
  qualityGate: QualityGateStatus;
  projectMeasures: ProjectMeasures;
  securityHotspots: SecurityHotspotsData;
}

export interface ExporterResult {
  success: boolean;
  outputPath: string;
  issuesCount: number;
  metrics: ReportMetrics;
  error?: string;
}

export interface HtmlExporterOptions {
  outputPath?: string;
  filename?: string;
  template?: string;
}

// ── Service Types ────────────────────────────────────────────────────────────

export interface FetchIssuesOptions {
  pageSize?: number;
  maxIssues?: number;
  excludeStatuses?: string[];
  includeResolvedIssues?: boolean;
  onProgress?: (current: number, total: number) => void;
}

// ── CLI Types ────────────────────────────────────────────────────────────────

export interface ExportCommandOptions {
  config?: string;
  url?: string;
  token?: string;
  project?: string;
  organization?: string;
  output?: string;
  filename?: string;
  template?: string;
  maxIssues: string;
  includeResolved?: boolean;
  excludeStatuses: string;
  verbose?: boolean;
}

export interface ValidateCommandOptions {
  config?: string;
  url?: string;
  token?: string;
  project?: string;
  organization?: string;
}

// ── Core Types ───────────────────────────────────────────────────────────────

export type ProgressCallback = (current: number, total: number, message?: string) => void;

export interface ExportOptions {
  onProgress?: ProgressCallback;
  validateConnection?: boolean;
  logProjectInfo?: boolean;
}
