import type {
  Branch,
  EditorId,
  HotspotDetail,
  IdeResolution,
  IssueChangelogEntry,
  ProjectMeasures,
  ProjectsPage,
  PullRequest,
  QualityGateStatus,
  RuleDetail,
  ScmBlameLine,
  SecurityHotspotsData,
  SonarQubeSearchResponse,
} from '../../core/types';

export interface AppConfigInfo {
  url: string;
  organization?: string;
  hasToken: boolean;
  defaultProjectKey?: string;
  allowWrite: boolean;
  ide: { editor: EditorId; hasProjectRoots: boolean };
}

export interface IssueFilterFacets {
  tags: string[];
  rules: string[];
  assignees: string[];
}

export interface SourceLine {
  line: number;
  code: string;
}

export interface SystemStatusInfo {
  connected: boolean;
  url: string;
  serverVersion?: string;
  status: string;
}

interface IssueFacetSummary {
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
  newCode?: boolean;
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

export interface ViewArgs {
  ref: Ref;
  newCode?: boolean;
  force?: boolean;
}

function newCodeParam(newCode?: boolean): Record<string, string> {
  return newCode ? { newCode: '1' } : {};
}

/** POST JSON to a write endpoint; throws ApiError (incl. 403 write_disabled). */
async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localToken();
  if (token) headers['x-sq-local-token'] = token;
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    let code = 'error';
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      code = body.error ?? code;
      message = body.message ?? message;
    } catch {
      /* non-JSON */
    }
    throw new ApiError(res.status, code, message);
  }
  return (await res.json()) as T;
}

const enc = encodeURIComponent;

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
    request<BranchesResponse>(`/api/projects/${enc(projectKey)}/branches`, {
      ...(force && { force }),
    }),

  summary: (projectKey: string, { ref, newCode, force }: ViewArgs) =>
    request<ProjectSummary>(`/api/projects/${enc(projectKey)}/summary`, {
      params: { ...refParams(ref), ...newCodeParam(newCode) },
      ...(force && { force }),
    }),

  issues: (projectKey: string, { ref, newCode, force }: ViewArgs) =>
    request<SonarQubeSearchResponse>(`/api/projects/${enc(projectKey)}/issues`, {
      params: { ...refParams(ref), ...newCodeParam(newCode), pageSize: '500' },
      ...(force && { force }),
    }),

  measures: (projectKey: string, { ref, newCode, force }: ViewArgs) =>
    request<ProjectMeasures>(`/api/projects/${enc(projectKey)}/measures`, {
      params: { ...refParams(ref), ...newCodeParam(newCode) },
      ...(force && { force }),
    }),

  qualityGate: (projectKey: string, ref: Ref, force?: boolean) =>
    request<QualityGateStatus>(`/api/projects/${enc(projectKey)}/quality-gate`, {
      params: refParams(ref),
      ...(force && { force }),
    }),

  hotspots: (projectKey: string, ref: Ref, force?: boolean) =>
    request<SecurityHotspotsData>(`/api/projects/${enc(projectKey)}/hotspots`, {
      params: refParams(ref),
      ...(force && { force }),
    }),

  issueFacets: (projectKey: string, ref: Ref) =>
    request<IssueFilterFacets>(`/api/projects/${enc(projectKey)}/issue-facets`, {
      params: refParams(ref),
    }),

  rule: (ruleKey: string) => request<RuleDetail | null>(`/api/rules/${enc(ruleKey)}`),

  source: (component: string, ref: Ref, from: number, to: number) =>
    request<SourceLine[]>('/api/sources', {
      params: { component, ...refParams(ref), from: String(from), to: String(to) },
    }),

  scm: (component: string, ref: Ref, from: number, to: number) =>
    request<ScmBlameLine[]>('/api/scm', {
      params: { component, ...refParams(ref), from: String(from), to: String(to) },
    }),

  changelog: (issueKey: string) =>
    request<IssueChangelogEntry[]>(`/api/issues/${enc(issueKey)}/changelog`),

  hotspotDetail: (hotspotKey: string) =>
    request<HotspotDetail | null>(`/api/hotspots/${enc(hotspotKey)}`),

  ideResolve: (projectKey: string, component: string, ref: Ref, line: number) =>
    request<IdeResolution>('/api/ide/resolve', {
      params: { project: projectKey, component, ...refParams(ref), line: String(line) },
    }),

  // ── write actions (require `serve --allow-write`) ──────────────────────────
  issueTransition: (key: string, transition: string) =>
    postJson(`/api/issues/${enc(key)}/transition`, { transition }),
  issueAssign: (key: string, assignee?: string) =>
    postJson(`/api/issues/${enc(key)}/assign`, { assignee }),
  issueComment: (key: string, text: string) =>
    postJson(`/api/issues/${enc(key)}/comment`, { text }),
  issueSeverity: (key: string, severity: string) =>
    postJson(`/api/issues/${enc(key)}/severity`, { severity }),
  hotspotStatus: (key: string, status: string, resolution?: string, comment?: string) =>
    postJson(`/api/hotspots/${enc(key)}/status`, { status, resolution, comment }),

  /** Request a server-rendered PDF; returns the binary blob. */
  exportPdf: async (projectKey: string, ref: Ref, newCode?: boolean): Promise<Blob> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localToken();
    if (token) headers['x-sq-local-token'] = token;
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectKey, ...refParams(ref), ...newCodeParam(newCode) }),
    });
    if (!res.ok) {
      let code = 'error';
      let message = `PDF export failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string; message?: string };
        code = body.error ?? code;
        message = body.message ?? message;
      } catch {
        /* non-JSON */
      }
      throw new ApiError(res.status, code, message);
    }
    return res.blob();
  },
};

/** Build the print-route URL (used as a fallback when server PDF is unavailable). */
export function reportUrl(projectKey: string, ref: Ref): string {
  const params = new URLSearchParams({ project: projectKey, ...refParams(ref) });
  return `${window.location.origin}/report?${params.toString()}${window.location.hash}`;
}

/** Serialise a Ref into a stable cache-key fragment. */
export function refKey(ref: Ref): string {
  if (!ref) return '__main__';
  return `${ref.type}:${ref.value}`;
}
