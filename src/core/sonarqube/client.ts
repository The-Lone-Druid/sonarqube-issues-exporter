import type {
  AnalysisTarget,
  FetchAllIssuesOptions,
  IssueFilters,
  IssueQuery,
  ProjectMeasures,
  QualityGateStatus,
  SecurityHotspot,
  SecurityHotspotsData,
  SonarQubeConnection,
  SonarQubeIssue,
  SonarQubeSearchResponse,
} from '../types';
import { formatRating, formatTechnicalDebt } from '../format';
import { logger } from '../logger';

const DEFAULT_TIMEOUT_MS = 30_000;

/** Error thrown for non-2xx SonarQube responses; carries the HTTP status. */
export class SonarQubeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly statusText?: string,
  ) {
    super(message);
    this.name = 'SonarQubeApiError';
  }
}

type QueryParams = Record<string, string | undefined>;

export async function apiRequest<T>(
  conn: SonarQubeConnection,
  path: string,
  params?: QueryParams,
): Promise<T> {
  const url = new URL(path, conn.url);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
  }

  const credentials = Buffer.from(`${conn.token}:`).toString('base64');
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Basic ${credentials}` },
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new SonarQubeApiError(
        'Authentication failed (401) — invalid or expired token',
        401,
        response.statusText,
      );
    } else if (response.status === 403) {
      throw new SonarQubeApiError(
        'Access forbidden (403) — insufficient permissions',
        403,
        response.statusText,
      );
    } else if (response.status === 404) {
      throw new SonarQubeApiError(
        'Not found (404) — the project, branch, or resource does not exist',
        404,
        response.statusText,
      );
    }
    throw new SonarQubeApiError(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      response.statusText,
    );
  }

  return (await response.json()) as T;
}

/** Build the org param if present on the connection. */
function orgParam(conn: SonarQubeConnection): QueryParams {
  return conn.organization ? { organization: conn.organization } : {};
}

/** Branch XOR pullRequest, matching the SonarQube API contract. */
function refParams(target: Pick<AnalysisTarget, 'branch' | 'pullRequest'>): QueryParams {
  if (target.pullRequest) return { pullRequest: target.pullRequest };
  if (target.branch) return { branch: target.branch };
  return {};
}

function filterParams(filters?: IssueFilters): QueryParams {
  if (!filters) return {};
  const params: QueryParams = {};
  if (filters.types?.length) params['types'] = filters.types.join(',');
  if (filters.severities?.length) params['severities'] = filters.severities.join(',');
  if (filters.statuses?.length) params['statuses'] = filters.statuses.join(',');
  if (filters.tags?.length) params['tags'] = filters.tags.join(',');
  if (filters.rules?.length) params['rules'] = filters.rules.join(',');
  if (filters.assignees?.length) params['assignees'] = filters.assignees.join(',');
  if (filters.resolved !== undefined) params['resolved'] = String(filters.resolved);
  if (filters.q) params['s'] = 'FILE_LINE'; // keep deterministic ordering; q applied below
  if (filters.q) params['q'] = filters.q;
  return params;
}

/** Fetch a single page of issues (server-side pagination friendly). */
export async function fetchIssues(
  conn: SonarQubeConnection,
  query: IssueQuery,
): Promise<SonarQubeSearchResponse> {
  const { projectKey, page = 1, pageSize = 100, filters } = query;
  return apiRequest<SonarQubeSearchResponse>(conn, '/api/issues/search', {
    componentKeys: projectKey,
    ...orgParam(conn),
    ...refParams(query),
    ...filterParams(filters),
    ps: String(pageSize),
    p: String(page),
  });
}

/** Fetch all issues for a target by paging through the API. */
export async function fetchAllIssues(
  conn: SonarQubeConnection,
  target: AnalysisTarget,
  options: FetchAllIssuesOptions = {},
): Promise<SonarQubeIssue[]> {
  const {
    pageSize = 500,
    maxIssues = 10_000,
    excludeStatuses = ['CLOSED'],
    includeResolvedIssues = false,
    filters,
    onProgress,
  } = options;

  const allIssues: SonarQubeIssue[] = [];
  let page = 1;

  logger.info(`Fetching issues for project: ${target.projectKey}`);

  const effectiveFilters: IssueFilters = {
    ...filters,
    ...(!includeResolvedIssues && !filters?.statuses?.length
      ? { statuses: ['OPEN', 'CONFIRMED', 'REOPENED'] }
      : {}),
  };

  while (allIssues.length < maxIssues) {
    const data = await fetchIssues(conn, {
      ...target,
      page,
      pageSize: Math.min(pageSize, maxIssues - allIssues.length),
      filters: effectiveFilters,
    });

    const filtered = data.issues.filter((issue) => !excludeStatuses.includes(issue.status));
    allIssues.push(...filtered);

    logger.debug(`Page ${page}: ${filtered.length} issues (total: ${allIssues.length})`);
    onProgress?.(allIssues.length, Math.min(data.paging.total, maxIssues));

    if (page * pageSize >= data.paging.total || data.issues.length === 0) break;
    page++;
  }

  logger.info(`Fetched ${allIssues.length} issues`);
  return allIssues;
}

export async function getQualityGateStatus(
  conn: SonarQubeConnection,
  target: AnalysisTarget,
): Promise<QualityGateStatus> {
  try {
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
    }>(conn, '/api/qualitygates/project_status', {
      projectKey: target.projectKey,
      ...orgParam(conn),
      ...refParams(target),
    });

    return {
      status: data.projectStatus.status as QualityGateStatus['status'],
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
    logger.warn('Failed to fetch quality gate status:', toMessage(error));
    return { status: 'NONE', conditions: [] };
  }
}

const MEASURE_METRICS = [
  'coverage',
  'duplicated_lines_density',
  'ncloc',
  'sqale_index',
  'sqale_rating',
  'reliability_rating',
  'security_rating',
  'complexity',
] as const;

export async function getProjectMeasures(
  conn: SonarQubeConnection,
  target: AnalysisTarget,
): Promise<ProjectMeasures> {
  try {
    const data = await apiRequest<{
      component: { measures: Array<{ metric: string; value?: string }> };
    }>(conn, '/api/measures/component', {
      component: target.projectKey,
      ...orgParam(conn),
      ...refParams(target),
      metricKeys: MEASURE_METRICS.join(','),
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
    logger.warn('Failed to fetch project measures:', toMessage(error));
    return {};
  }
}

export async function getSecurityHotspots(
  conn: SonarQubeConnection,
  target: AnalysisTarget,
): Promise<SecurityHotspotsData> {
  try {
    const data = await apiRequest<{
      hotspots: SecurityHotspot[];
      paging?: { total: number };
    }>(conn, '/api/hotspots/search', {
      projectKey: target.projectKey,
      ...orgParam(conn),
      ...refParams(target),
      ps: '500',
      status: 'TO_REVIEW',
    });

    const hotspots = data.hotspots || [];
    const total = data.paging?.total || hotspots.length;
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const h of hotspots) {
      const priority = h.vulnerabilityProbability || 'UNKNOWN';
      const category = h.securityCategory || 'UNKNOWN';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    return { total, byPriority, byCategory, hotspots };
  } catch (error) {
    logger.warn('Failed to fetch security hotspots:', toMessage(error));
    return { total: 0, byPriority: {}, byCategory: {}, hotspots: [] };
  }
}

export interface IssueFacetSummary {
  total: number;
  severities: Record<string, number>;
  types: Record<string, number>;
  statuses: Record<string, number>;
}

/** Fetch issue breakdown counts via facets (cheap — one page, no issue bodies). */
export async function getIssueFacets(
  conn: SonarQubeConnection,
  target: AnalysisTarget,
  options: { includeResolvedIssues?: boolean } = {},
): Promise<IssueFacetSummary> {
  const data = await apiRequest<{
    paging: { total: number };
    facets?: Array<{ property: string; values: Array<{ val: string; count: number }> }>;
  }>(conn, '/api/issues/search', {
    componentKeys: target.projectKey,
    ...orgParam(conn),
    ...refParams(target),
    ps: '1',
    facets: 'severities,types,statuses',
    ...(!options.includeResolvedIssues && { statuses: 'OPEN,CONFIRMED,REOPENED' }),
  });

  const toRecord = (property: string): Record<string, number> => {
    const facet = data.facets?.find((f) => f.property === property);
    const record: Record<string, number> = {};
    for (const v of facet?.values ?? []) record[v.val] = v.count;
    return record;
  };

  return {
    total: data.paging.total,
    severities: toRecord('severities'),
    types: toRecord('types'),
    statuses: toRecord('statuses'),
  };
}

export interface SourceLine {
  line: number;
  code: string;
}

/** Fetch source lines around an issue location for the drill-down snippet. */
export async function getSourceLines(
  conn: SonarQubeConnection,
  target: Pick<AnalysisTarget, 'branch' | 'pullRequest'>,
  component: string,
  from: number,
  to: number,
): Promise<SourceLine[]> {
  try {
    const data = await apiRequest<{
      sources: Array<{ line: number; code: string }>;
    }>(conn, '/api/sources/lines', {
      key: component,
      ...orgParam(conn),
      ...refParams(target),
      from: String(Math.max(1, from)),
      to: String(to),
    });
    return data.sources.map((s) => ({ line: s.line, code: stripHtml(s.code) }));
  } catch (error) {
    logger.warn('Failed to fetch source lines:', toMessage(error));
    return [];
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
