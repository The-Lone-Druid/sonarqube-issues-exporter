import type {
  Branch,
  Project,
  ProjectsPage,
  PullRequest,
  SonarQubeConnection,
  SystemStatus,
} from '../types';
import { logger } from '../logger';
import { apiRequest } from './client';

/** Fetch the SonarQube/SonarCloud server status + version. */
export async function getSystemStatus(conn: SonarQubeConnection): Promise<SystemStatus> {
  return apiRequest<SystemStatus>(conn, '/api/system/status');
}

/** Return true if the connection is usable (status reachable). */
export async function validateConnection(conn: SonarQubeConnection): Promise<boolean> {
  try {
    await getSystemStatus(conn);
    logger.info('SonarQube connection validated');
    return true;
  } catch (error) {
    logger.error('Connection validation failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

/** List projects the token can access (paginated). */
export async function listProjects(
  conn: SonarQubeConnection,
  options: { q?: string; page?: number; pageSize?: number } = {},
): Promise<ProjectsPage> {
  const { q, page = 1, pageSize = 100 } = options;
  // SonarCloud requires the search endpoint; SonarQube also supports it for admins.
  // `components/search` with qualifier TRK works broadly for non-admin tokens too.
  const data = await apiRequest<{
    components: Array<{
      key: string;
      name: string;
      qualifier?: string;
      visibility?: string;
      lastAnalysisDate?: string;
    }>;
    paging: { pageIndex: number; pageSize: number; total: number };
  }>(conn, '/api/components/search', {
    qualifiers: 'TRK',
    ...(conn.organization ? { organization: conn.organization } : {}),
    ...(q ? { q } : {}),
    ps: String(pageSize),
    p: String(page),
  });

  const projects: Project[] = data.components.map((c) => ({
    key: c.key,
    name: c.name,
    ...(c.qualifier != null && { qualifier: c.qualifier }),
    ...(c.visibility != null && { visibility: c.visibility }),
    ...(c.lastAnalysisDate != null && { lastAnalysisDate: c.lastAnalysisDate }),
  }));

  return { projects, paging: data.paging };
}

/** Look up a single project's display info. */
export async function getProjectInfo(
  conn: SonarQubeConnection,
  projectKey: string,
): Promise<Project | null> {
  try {
    const data = await apiRequest<{
      components: Array<{ name: string; key: string; qualifier?: string }>;
    }>(conn, '/api/components/show', {
      component: projectKey,
      ...(conn.organization ? { organization: conn.organization } : {}),
    });
    const c = data.components?.[0];
    if (!c) return null;
    return { key: c.key, name: c.name, ...(c.qualifier != null && { qualifier: c.qualifier }) };
  } catch (error) {
    logger.error('Failed to fetch project info:', error instanceof Error ? error.message : error);
    return null;
  }
}

/** List analysed branches for a project. */
export async function listBranches(
  conn: SonarQubeConnection,
  projectKey: string,
): Promise<Branch[]> {
  try {
    const data = await apiRequest<{
      branches: Array<{
        name: string;
        isMain: boolean;
        type: string;
        status?: { qualityGateStatus?: string };
        analysisDate?: string;
      }>;
    }>(conn, '/api/project_branches/list', {
      project: projectKey,
      ...(conn.organization ? { organization: conn.organization } : {}),
    });
    return data.branches.map((b) => ({
      name: b.name,
      isMain: b.isMain,
      type: b.type as Branch['type'],
      ...(b.status?.qualityGateStatus != null && {
        qualityGateStatus: b.status.qualityGateStatus,
      }),
      ...(b.analysisDate != null && { analysisDate: b.analysisDate }),
    }));
  } catch (error) {
    logger.warn('Failed to fetch branches:', error instanceof Error ? error.message : error);
    return [];
  }
}

/** List open pull requests with analysis for a project. */
export async function listPullRequests(
  conn: SonarQubeConnection,
  projectKey: string,
): Promise<PullRequest[]> {
  try {
    const data = await apiRequest<{
      pullRequests: Array<{
        key: string;
        title: string;
        branch: string;
        base?: string;
        status?: { qualityGateStatus?: string };
        analysisDate?: string;
        url?: string;
      }>;
    }>(conn, '/api/project_pull_requests/list', {
      project: projectKey,
      ...(conn.organization ? { organization: conn.organization } : {}),
    });
    return data.pullRequests.map((p) => ({
      key: p.key,
      title: p.title,
      branch: p.branch,
      ...(p.base != null && { base: p.base }),
      ...(p.status?.qualityGateStatus != null && {
        qualityGateStatus: p.status.qualityGateStatus,
      }),
      ...(p.analysisDate != null && { analysisDate: p.analysisDate }),
      ...(p.url != null && { url: p.url }),
    }));
  } catch (error) {
    logger.warn('Failed to fetch pull requests:', error instanceof Error ? error.message : error);
    return [];
  }
}
