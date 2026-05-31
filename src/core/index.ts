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
  assignIssue,
  changeHotspotStatus,
  commentIssue,
  fetchIssues,
  fetchAllIssues,
  getIssueChangelog,
  getIssueFacets,
  getIssueFilterFacets,
  getProjectMeasures,
  getQualityGateStatus,
  getScmBlame,
  getSecurityHotspots,
  getSourceLines,
  postForm,
  setIssueSeverity,
  setIssueTags,
  transitionIssue,
  SonarQubeApiError,
} from './sonarqube/client';
export type {
  IssueFacetSummary,
  IssueFilterFacets,
  IssueTransition,
  SourceLine,
} from './sonarqube/client';
export { getHotspotDetail, getRule } from './sonarqube/rules';

export {
  getNewCodePeriod,
  getProjectInfo,
  getSystemStatus,
  listBranches,
  listProjects,
  listPullRequests,
  validateConnection,
} from './sonarqube/projects';

export type * from './types';
