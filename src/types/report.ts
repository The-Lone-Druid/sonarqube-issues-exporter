// Import enhanced types from sonarqube types
import { QualityGateStatus, ProjectMeasures, SecurityHotspotsData } from './sonarqube';

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
  updateDate?: string | undefined;
  assignee?: string | undefined;
  author?: string | undefined;
  tags: string[];
  effort?: string | undefined;
  debt?: string | undefined;
}

export interface EnhancedTemplateData {
  issues: ProcessedIssue[];
  metrics: ReportMetrics;
  metadata: ReportMetadata;
  qualityGate: QualityGateStatus;
  projectMeasures: ProjectMeasures;
  securityHotspots: SecurityHotspotsData;
}

// Keep backward compatibility
export interface TemplateData {
  issues: ProcessedIssue[];
  metrics: ReportMetrics;
  metadata: ReportMetadata;
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

export interface ReportMetrics {
  total: number;
  severities: Record<string, number>;
  types: Record<string, number>;
  statuses: Record<string, number>;
  components: Record<string, number>;
  rules: Record<string, number>;
}

export interface ExporterResult {
  success: boolean;
  outputPath: string;
  issuesCount: number;
  metrics: ReportMetrics;
  error?: string;
}
