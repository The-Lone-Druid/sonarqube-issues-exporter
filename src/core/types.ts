// ── SonarQube API domain types ───────────────────────────────────────────────

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
  paging: SonarQubePaging;
  issues: SonarQubeIssue[];
}

// ── Quality gate ─────────────────────────────────────────────────────────────

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

// ── Project measures ─────────────────────────────────────────────────────────

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

// ── Security hotspots ────────────────────────────────────────────────────────

export interface SecurityHotspot {
  key: string;
  component: string;
  project: string;
  securityCategory: string;
  vulnerabilityProbability: string;
  status: string;
  resolution?: string;
  line?: number;
  hash?: string;
  textRange?: TextRange;
  flows?: Flow[];
  ruleKey: string;
  messageFormattings?: MessageFormatting[];
  creationDate: string;
  updateDate?: string;
  assignee?: string;
  message?: string;
}

export interface SecurityHotspotsData {
  total: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  hotspots: SecurityHotspot[];
}

// ── Projects / branches / pull requests ──────────────────────────────────────

export interface Project {
  key: string;
  name: string;
  qualifier?: string;
  visibility?: string;
  lastAnalysisDate?: string;
}

export interface ProjectsPage {
  projects: Project[];
  paging: SonarQubePaging;
}

export type BranchType = 'LONG' | 'SHORT' | 'BRANCH' | 'PULL_REQUEST';

export interface Branch {
  name: string;
  isMain: boolean;
  type: BranchType;
  qualityGateStatus?: string;
  analysisDate?: string;
}

export interface PullRequest {
  key: string;
  title: string;
  branch: string;
  base?: string;
  qualityGateStatus?: string;
  analysisDate?: string;
  url?: string;
}

export interface SystemStatus {
  id?: string;
  version?: string;
  status: string;
}

// ── Connection + analysis target ─────────────────────────────────────────────

/** Credentials + host for talking to a SonarQube/SonarCloud server. */
export interface SonarQubeConnection {
  url: string;
  token: string;
  organization?: string;
}

/** A specific project + (optionally) branch or pull request to analyse. */
export interface AnalysisTarget {
  projectKey: string;
  branch?: string;
  pullRequest?: string;
}

export interface IssueFilters {
  types?: string[];
  severities?: string[];
  statuses?: string[];
  resolutions?: string[];
  tags?: string[];
  rules?: string[];
  assignees?: string[];
  resolved?: boolean;
  /** Restrict to issues on new code (Clean as You Code). */
  inNewCodePeriod?: boolean;
  /** Free-text query passed to SonarQube. */
  q?: string;
}

export interface IssueQuery extends AnalysisTarget {
  page?: number;
  pageSize?: number;
  filters?: IssueFilters;
}

export interface FetchAllIssuesOptions {
  pageSize?: number;
  maxIssues?: number;
  excludeStatuses?: string[];
  includeResolvedIssues?: boolean;
  filters?: IssueFilters;
  onProgress?: (current: number, total: number) => void;
}

// ── Rule detail / fix guidance ───────────────────────────────────────────────

export interface RuleDescriptionSection {
  key: string;
  content: string;
}

export interface RuleDetail {
  key: string;
  name: string;
  severity?: string;
  type?: string;
  language?: string;
  tags: string[];
  /** Structured sections (root_cause, how_to_fix, resources, …) when available. */
  descriptionSections: RuleDescriptionSection[];
  /** Legacy single HTML blob, used when descriptionSections is empty. */
  htmlDescription?: string;
  remediationEffort?: string;
}

export interface ScmBlameLine {
  line: number;
  author?: string;
  date?: string;
  revision?: string;
}

export interface IssueChangelogEntry {
  user?: string;
  creationDate?: string;
  diffs: Array<{ key: string; oldValue?: string; newValue?: string }>;
}

export interface HotspotDetail {
  key: string;
  message: string;
  component: string;
  line?: number;
  status: string;
  resolution?: string;
  securityCategory?: string;
  vulnerabilityProbability?: string;
  ruleKey?: string;
  assignee?: string;
  creationDate?: string;
  textRange?: TextRange;
  /** SonarQube splits hotspot rule guidance into these HTML sections. */
  riskDescription?: string;
  vulnerabilityDescription?: string;
  fixRecommendations?: string;
  changelog: IssueChangelogEntry[];
}

export interface NewCodePeriod {
  type?: string;
  value?: string;
  effectiveValue?: string;
}

// ── Computed metrics (UI/report) ─────────────────────────────────────────────

export interface IssueMetrics {
  total: number;
  severities: Record<string, number>;
  types: Record<string, number>;
  statuses: Record<string, number>;
  components: Record<string, number>;
  rules: Record<string, number>;
}

// ── Configuration ────────────────────────────────────────────────────────────

export interface AppConfig {
  sonarqube: SonarQubeSettings;
  server: ServerConfig;
  logging: LoggingConfig;
}

export interface SonarQubeSettings {
  url: string;
  token: string;
  organization?: string;
  /** Project pre-selected in the UI on startup; users can switch freely. */
  defaultProjectKey?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  open: boolean;
  auth: boolean;
  /** Allow in-app write actions (issue transitions, assign, comment, etc.). */
  allowWrite: boolean;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  file?: string;
}

export interface ConfigLoadOptions {
  configPath?: string;
  overrides?: DeepPartial<AppConfig>;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
