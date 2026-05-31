import { Hono } from 'hono';
import type { IssueFilters } from '../../core/types';
import {
  fetchIssues,
  getIssueFacets,
  getProjectMeasures,
  getQualityGateStatus,
  getSecurityHotspots,
  getSourceLines,
} from '../../core/sonarqube/client';
import {
  getSystemStatus,
  listBranches,
  listProjects,
  listPullRequests,
} from '../../core/sonarqube/projects';
import type { ServerContext } from '../context';
import { buildTarget } from '../context';
import { cached, TTL } from '../cache';
import { handle } from '../errors';

function parseList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function refKey(branch?: string, pullRequest?: string): string {
  if (pullRequest) return `pr:${pullRequest}`;
  if (branch) return `branch:${branch}`;
  return '__main__';
}

/** Build a Hono sub-app exposing the SonarQube proxy under /api. */
export function createApiRoutes(ctx: ServerContext): Hono {
  const api = new Hono();
  const { conn } = ctx;

  // Honour a forced refresh from the client's manual "Refresh" button.
  const isForced = (c: { req: { header: (k: string) => string | undefined } }): boolean =>
    (c.req.header('cache-control') ?? '').includes('no-cache');

  api.get('/system/status', (c) =>
    handle(c, async () => {
      const status = await cached('status', TTL.status, () => getSystemStatus(conn), {
        force: isForced(c),
      });
      return {
        connected: true,
        url: conn.url,
        serverVersion: status.version,
        status: status.status,
      };
    }),
  );

  api.get('/config', (c) =>
    c.json({
      url: ctx.config.sonarqube.url,
      ...(ctx.config.sonarqube.organization && {
        organization: ctx.config.sonarqube.organization,
      }),
      hasToken: Boolean(ctx.config.sonarqube.token),
      ...(ctx.config.sonarqube.defaultProjectKey && {
        defaultProjectKey: ctx.config.sonarqube.defaultProjectKey,
      }),
    }),
  );

  api.get('/projects', (c) =>
    handle(c, () => {
      const q = c.req.query('q');
      const page = Number(c.req.query('page') ?? '1');
      const pageSize = Number(c.req.query('pageSize') ?? '100');
      return cached(
        `projects:${q ?? ''}:${page}:${pageSize}`,
        TTL.projects,
        () => listProjects(conn, { ...(q && { q }), page, pageSize }),
        { force: isForced(c) },
      );
    }),
  );

  api.get('/projects/:key/branches', (c) =>
    handle(c, async () => {
      const key = c.req.param('key');
      const [branches, pullRequests] = await Promise.all([
        cached(`branches:${key}`, TTL.branches, () => listBranches(conn, key), {
          force: isForced(c),
        }),
        cached(`prs:${key}`, TTL.branches, () => listPullRequests(conn, key), {
          force: isForced(c),
        }),
      ]);
      return { branches, pullRequests };
    }),
  );

  api.get('/projects/:key/issues', (c) =>
    handle(c, () => {
      const key = c.req.param('key');
      const branch = c.req.query('branch');
      const pullRequest = c.req.query('pullRequest');
      const page = Number(c.req.query('page') ?? '1');
      const pageSize = Math.min(Number(c.req.query('pageSize') ?? '500'), 500);

      const filters: IssueFilters = {};
      const types = parseList(c.req.query('types'));
      const severities = parseList(c.req.query('severities'));
      const statuses = parseList(c.req.query('statuses'));
      const tags = parseList(c.req.query('tags'));
      const q = c.req.query('q');
      const resolved = c.req.query('resolved');
      if (types) filters.types = types;
      if (severities) filters.severities = severities;
      if (statuses) filters.statuses = statuses;
      if (tags) filters.tags = tags;
      if (q) filters.q = q;
      if (resolved != null) filters.resolved = resolved === 'true';
      const target = buildTarget(key, branch, pullRequest);
      const cacheKey = `issues:${key}:${refKey(branch, pullRequest)}:${page}:${pageSize}:${JSON.stringify(filters)}`;
      return cached(
        cacheKey,
        TTL.issues,
        () => fetchIssues(conn, { ...target, page, pageSize, filters }),
        { force: isForced(c) },
      );
    }),
  );

  api.get('/projects/:key/quality-gate', (c) =>
    handle(c, () => {
      const key = c.req.param('key');
      const branch = c.req.query('branch');
      const pullRequest = c.req.query('pullRequest');
      return cached(
        `qg:${key}:${refKey(branch, pullRequest)}`,
        TTL.qualityGate,
        () => getQualityGateStatus(conn, buildTarget(key, branch, pullRequest)),
        { force: isForced(c) },
      );
    }),
  );

  api.get('/projects/:key/measures', (c) =>
    handle(c, () => {
      const key = c.req.param('key');
      const branch = c.req.query('branch');
      const pullRequest = c.req.query('pullRequest');
      return cached(
        `measures:${key}:${refKey(branch, pullRequest)}`,
        TTL.measures,
        () => getProjectMeasures(conn, buildTarget(key, branch, pullRequest)),
        { force: isForced(c) },
      );
    }),
  );

  api.get('/projects/:key/hotspots', (c) =>
    handle(c, () => {
      const key = c.req.param('key');
      const branch = c.req.query('branch');
      const pullRequest = c.req.query('pullRequest');
      return cached(
        `hotspots:${key}:${refKey(branch, pullRequest)}`,
        TTL.hotspots,
        () => getSecurityHotspots(conn, buildTarget(key, branch, pullRequest)),
        { force: isForced(c) },
      );
    }),
  );

  // Convenience aggregate for the dashboard's first paint.
  api.get('/projects/:key/summary', (c) =>
    handle(c, async () => {
      const key = c.req.param('key');
      const branch = c.req.query('branch');
      const pullRequest = c.req.query('pullRequest');
      const target = buildTarget(key, branch, pullRequest);
      const ref = refKey(branch, pullRequest);
      const force = isForced(c);

      const [qualityGate, measures, hotspots, issues] = await Promise.all([
        cached(`qg:${key}:${ref}`, TTL.qualityGate, () => getQualityGateStatus(conn, target), {
          force,
        }),
        cached(`measures:${key}:${ref}`, TTL.measures, () => getProjectMeasures(conn, target), {
          force,
        }),
        cached(`hotspots:${key}:${ref}`, TTL.hotspots, () => getSecurityHotspots(conn, target), {
          force,
        }),
        cached(`facets:${key}:${ref}`, TTL.issues, () => getIssueFacets(conn, target), { force }),
      ]);

      return { projectKey: key, qualityGate, measures, hotspots, issues };
    }),
  );

  api.get('/sources', (c) =>
    handle(c, () => {
      const component = c.req.query('component');
      if (!component) throw new Error('Missing required query param: component');
      const branch = c.req.query('branch');
      const pullRequest = c.req.query('pullRequest');
      const from = Number(c.req.query('from') ?? '1');
      const to = Number(c.req.query('to') ?? String(from + 10));
      return cached(
        `sources:${component}:${refKey(branch, pullRequest)}:${from}:${to}`,
        TTL.sources,
        () =>
          getSourceLines(
            conn,
            { ...(branch && { branch }), ...(pullRequest && { pullRequest }) },
            component,
            from,
            to,
          ),
      );
    }),
  );

  return api;
}
