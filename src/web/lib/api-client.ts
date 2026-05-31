import type {
  Branch,
  ProjectMeasures,
  ProjectsPage,
  PullRequest,
  QualityGateStatus,
  SecurityHotspotsData,
  SonarQubeSearchResponse,
} from '../../core/types';

export interface AppConfigInfo {
  url: string;
  organization?: string;
  hasToken: boolean;
  defaultProjectKey?: string;
}

export interface SystemStatusInfo {
  connected: boolean;
  url: string;
  serverVersion?: string;
  status: string;
}

export interface IssueFacetSummary {
  total: number;
  severities: Record<string, number>;
  types: Record<string, number>;
  statuses: Record<string, number>;
}

export interface ProjectSummary {
  projectKey: string;
  qualityGate: QualityGateStatus;
  measures: ProjectMeasures;
  hotspots: SecurityHotspotsData;
  issues: IssueFacetSummary;
}

export interface BranchesResponse {
  branches: Branch[];
  pullRequests: PullRequest[];
}

/** A branch or pull-request selection; undefined = main branch. */
export type Ref = { type: 'branch'; value: string } | { type: 'pr'; value: string } | undefined;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Local-server auth token, if the server was started with --auth (#token=...). */
function localToken(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/token=([0-9a-f]+)/i);
  return match?.[1] ?? null;
}

function refParams(ref: Ref): Record<string, string> {
  if (!ref) return {};
  return ref.type === 'pr' ? { pullRequest: ref.value } : { branch: ref.value };
}

interface RequestOptions {
  params?: Record<string, string | undefined>;
  /** Force the server to bypass its cache (manual refresh). */
  force?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, window.location.origin);
  for (const [k, v] of Object.entries(options.params ?? {})) {
    if (v != null && v !== '') url.searchParams.set(k, v);
  }

  const headers: Record<string, string> = {};
  const token = localToken();
  if (token) headers['x-sq-local-token'] = token;
  if (options.force) headers['cache-control'] = 'no-cache';

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    let code = 'error';
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      code = body.error ?? code;
      message = body.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, code, message);
  }
  return (await res.json()) as T;
}

export interface IssueQueryArgs {
  projectKey: string;
  ref: Ref;
  pageSize?: number;
  force?: boolean;
}

export const api = {
  config: () => request<AppConfigInfo>('/api/config'),

  systemStatus: (force?: boolean) =>
    request<SystemStatusInfo>('/api/system/status', { ...(force && { force }) }),

  projects: (q?: string, force?: boolean) =>
    request<ProjectsPage>('/api/projects', {
      params: { ...(q && { q }), pageSize: '200' },
      ...(force && { force }),
    }),

  branches: (projectKey: string, force?: boolean) =>
    request<BranchesResponse>(`/api/projects/${encodeURIComponent(projectKey)}/branches`, {
      ...(force && { force }),
    }),

  summary: (projectKey: string, ref: Ref, force?: boolean) =>
    request<ProjectSummary>(`/api/projects/${encodeURIComponent(projectKey)}/summary`, {
      params: refParams(ref),
      ...(force && { force }),
    }),

  issues: ({ projectKey, ref, pageSize = 500, force }: IssueQueryArgs) =>
    request<SonarQubeSearchResponse>(`/api/projects/${encodeURIComponent(projectKey)}/issues`, {
      params: { ...refParams(ref), pageSize: String(pageSize) },
      ...(force && { force }),
    }),

  qualityGate: (projectKey: string, ref: Ref, force?: boolean) =>
    request<QualityGateStatus>(`/api/projects/${encodeURIComponent(projectKey)}/quality-gate`, {
      params: refParams(ref),
      ...(force && { force }),
    }),

  measures: (projectKey: string, ref: Ref, force?: boolean) =>
    request<ProjectMeasures>(`/api/projects/${encodeURIComponent(projectKey)}/measures`, {
      params: refParams(ref),
      ...(force && { force }),
    }),

  hotspots: (projectKey: string, ref: Ref, force?: boolean) =>
    request<SecurityHotspotsData>(`/api/projects/${encodeURIComponent(projectKey)}/hotspots`, {
      params: refParams(ref),
      ...(force && { force }),
    }),
};

/** Serialise a Ref into a stable cache-key fragment. */
export function refKey(ref: Ref): string {
  if (!ref) return '__main__';
  return `${ref.type}:${ref.value}`;
}
