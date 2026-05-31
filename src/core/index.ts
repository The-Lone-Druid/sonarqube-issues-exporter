// Public library surface for `sonarqube-issues-exporter`.
// Framework-agnostic domain: SonarQube client, config, metrics, formatting.

export { loadConfig, toConnection } from './config';
export { initLogger, logger } from './logger';
export {
  escapeHtml,
  extractFilename,
  extractPath,
  formatDate,
  formatRating,
  formatTechnicalDebt,
} from './format';
export { calculateMetrics, computeIssueMetrics } from './metrics';

export {
  apiRequest,
  fetchIssues,
  fetchAllIssues,
  getProjectMeasures,
  getQualityGateStatus,
  getIssueFacets,
  getSecurityHotspots,
  getSourceLines,
  SonarQubeApiError,
} from './sonarqube/client';
export type { IssueFacetSummary, SourceLine } from './sonarqube/client';

export {
  getProjectInfo,
  getSystemStatus,
  listBranches,
  listProjects,
  listPullRequests,
  validateConnection,
} from './sonarqube/projects';

export type * from './types';
