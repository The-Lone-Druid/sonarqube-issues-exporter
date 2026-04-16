import type {
  SonarQubeConfig,
  SonarQubeIssue,
  SonarQubeSearchResponse,
  FetchIssuesOptions,
  QualityGateStatus,
  ProjectMeasures,
  SecurityHotspotsData,
  SecurityHotspot,
} from '../types';
import { logger } from '../utils/logger';

async function apiRequest<T>(
  config: SonarQubeConfig,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(path, config.url);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
  }

  const credentials = Buffer.from(`${config.token}:`).toString('base64');
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Basic ${credentials}` },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed (401) — invalid or expired token');
    } else if (response.status === 403) {
      throw new Error('Access forbidden (403) — insufficient permissions');
    } else if (response.status === 404) {
      throw new Error(`Not found (404) — project key '${config.projectKey}' may be incorrect`);
    }
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchAllIssues(
  config: SonarQubeConfig,
  options: FetchIssuesOptions = {},
): Promise<SonarQubeIssue[]> {
  const {
    pageSize = 500,
    maxIssues = 10000,
    excludeStatuses = ['CLOSED'],
    includeResolvedIssues = false,
    onProgress,
  } = options;

  const allIssues: SonarQubeIssue[] = [];
  let page = 1;

  logger.info(`Fetching issues for project: ${config.projectKey}`);

  while (allIssues.length < maxIssues) {
    const data = await apiRequest<SonarQubeSearchResponse>(config, '/api/issues/search', {
      componentKeys: config.projectKey,
      ...(config.organization && { organization: config.organization }),
      ps: String(Math.min(pageSize, maxIssues - allIssues.length)),
      p: String(page),
      ...(!includeResolvedIssues && { statuses: 'OPEN,CONFIRMED,REOPENED' }),
    });

    const filtered = data.issues.filter((issue) => !excludeStatuses.includes(issue.status));
    allIssues.push(...filtered);

    logger.debug(`Page ${page}: ${filtered.length} issues (total: ${allIssues.length})`);

    if (onProgress) {
      onProgress(allIssues.length, Math.min(data.paging.total, maxIssues));
    }

    if (page * pageSize >= data.paging.total || data.issues.length === 0) break;
    page++;
  }

  logger.info(`Fetched ${allIssues.length} issues`);
  return allIssues;
}

export async function validateConnection(config: SonarQubeConfig): Promise<boolean> {
  try {
    await apiRequest(config, '/api/system/status');
    logger.info('SonarQube connection validated');
    return true;
  } catch (error) {
    logger.error('Connection validation failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function getProjectInfo(
  config: SonarQubeConfig,
): Promise<{ name: string; key: string } | null> {
  try {
    const data = await apiRequest<{ components: Array<{ name: string; key: string }> }>(
      config,
      '/api/projects/search',
      {
        projects: config.projectKey,
        ...(config.organization && { organization: config.organization }),
      },
    );
    return data.components[0] ?? null;
  } catch (error) {
    logger.error('Failed to fetch project info:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getQualityGateStatus(config: SonarQubeConfig): Promise<QualityGateStatus> {
  try {
    logger.info('Fetching quality gate status...');
    const data = await apiRequest<{
      projectStatus: {
        status: string;
        conditions?: Array<{
          metricKey: string;
          comparator: string;
          periodValue?: string;
          value?: string;
          errorThreshold?: string;
          warningThreshold?: string;
          actualValue?: string;
          status: string;
        }>;
      };
    }>(config, '/api/qualitygates/project_status', {
      projectKey: config.projectKey,
      ...(config.organization && { organization: config.organization }),
    });

    return {
      status: data.projectStatus.status as 'PASSED' | 'FAILED' | 'NONE',
      conditions:
        data.projectStatus.conditions?.map((c) => {
          const value = c.periodValue || c.value;
          return {
            metric: c.metricKey,
            operator: c.comparator,
            ...(value != null && { value }),
            ...(c.errorThreshold != null && { errorThreshold: c.errorThreshold }),
            ...(c.warningThreshold != null && { warningThreshold: c.warningThreshold }),
            ...(c.actualValue != null && { actualValue: c.actualValue }),
            status: c.status as 'OK' | 'WARN' | 'ERROR',
          };
        }) ?? [],
    };
  } catch (error) {
    logger.warn(
      'Failed to fetch quality gate status:',
      error instanceof Error ? error.message : error,
    );
    return { status: 'NONE', conditions: [] };
  }
}

export async function getProjectMeasures(config: SonarQubeConfig): Promise<ProjectMeasures> {
  try {
    logger.info('Fetching project measures...');
    const metrics = [
      'coverage',
      'duplicated_lines_density',
      'ncloc',
      'sqale_index',
      'sqale_rating',
      'reliability_rating',
      'security_rating',
      'complexity',
    ];

    const data = await apiRequest<{
      component: { measures: Array<{ metric: string; value?: string }> };
    }>(config, '/api/measures/component', {
      component: config.projectKey,
      ...(config.organization && { organization: config.organization }),
      metricKeys: metrics.join(','),
    });

    const result: ProjectMeasures = {};
    for (const m of data.component.measures) {
      switch (m.metric) {
        case 'coverage':
          result.coverage = parseFloat(m.value || '0');
          break;
        case 'duplicated_lines_density':
          result.duplicatedLinesDensity = parseFloat(m.value || '0');
          break;
        case 'ncloc':
          result.linesOfCode = parseInt(m.value || '0', 10);
          break;
        case 'sqale_index':
          result.technicalDebt = formatTechnicalDebt(parseInt(m.value || '0', 10));
          break;
        case 'sqale_rating':
          result.maintainabilityRating = formatRating(m.value);
          break;
        case 'reliability_rating':
          result.reliabilityRating = formatRating(m.value);
          break;
        case 'security_rating':
          result.securityRating = formatRating(m.value);
          break;
        case 'complexity':
          result.complexity = parseInt(m.value || '0', 10);
          break;
      }
    }
    return result;
  } catch (error) {
    logger.warn(
      'Failed to fetch project measures:',
      error instanceof Error ? error.message : error,
    );
    return {};
  }
}

export async function getSecurityHotspots(config: SonarQubeConfig): Promise<SecurityHotspotsData> {
  try {
    logger.info('Fetching security hotspots...');
    const data = await apiRequest<{
      hotspots: SecurityHotspot[];
      paging?: { total: number };
    }>(config, '/api/hotspots/search', {
      projectKey: config.projectKey,
      ...(config.organization && { organization: config.organization }),
      ps: '500',
      status: 'TO_REVIEW',
    });

    const hotspots = data.hotspots || [];
    const total = data.paging?.total || 0;
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const h of hotspots) {
      const priority = h.vulnerabilityProbability || 'UNKNOWN';
      const category = h.securityCategory || 'UNKNOWN';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    return { total, byPriority, byCategory, hotspots: hotspots.slice(0, 100) };
  } catch (error) {
    logger.warn(
      'Failed to fetch security hotspots:',
      error instanceof Error ? error.message : error,
    );
    return { total: 0, byPriority: {}, byCategory: {}, hotspots: [] };
  }
}

function formatTechnicalDebt(minutes: number): string {
  if (minutes === 0) return '0min';
  const days = Math.floor(minutes / (8 * 60));
  const hours = Math.floor((minutes % (8 * 60)) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 && days === 0) parts.push(`${mins}min`);
  return parts.join(' ') || '0min';
}

function formatRating(value?: string): string {
  if (!value) return 'N/A';
  const ratings = ['A', 'B', 'C', 'D', 'E'];
  return ratings[parseInt(value, 10) - 1] || 'N/A';
}
