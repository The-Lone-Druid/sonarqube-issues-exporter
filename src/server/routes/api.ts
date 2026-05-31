import { join } from 'node:path';
import { Hono } from 'hono';
import type { Context } from 'hono';
import type { IdeResolution, IssueFilters } from '../../core/types';
import { extractPath } from '../../core/format';
import {
  assignIssue,
  changeHotspotStatus,
  commentIssue,
  fetchIssues,
  getIssueChangelog,
  getIssueFacets,
  getIssueFilterFacets,
  getProjectMeasures,
  getQualityGateStatus,
  getScmBlame,
  getSecurityHotspots,
  getSourceLines,
  setIssueSeverity,
  setIssueTags,
  transitionIssue,
  type IssueTransition,
} from '../../core/sonarqube/client';
import { getHotspotDetail, getRule } from '../../core/sonarqube/rules';
import {
  getSystemStatus,
  listBranches,
  listProjects,
  listPullRequests,
} from '../../core/sonarqube/projects';
import type { ServerContext } from '../context';
import { buildTarget } from '../context';
import { cached, clearCache, TTL } from '../cache';
import { handle } from '../errors';
import { renderReportPdf } from '../pdf/renderer';
import { PdfUnavailableError } from '../pdf/install';

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

  // "New code" (Clean as You Code) focus toggle.
  const isNewCode = (c: { req: { query: (k: string) => string | undefined } }): boolean => {
    const v = c.req.query('newCode');
    return v === '1' || v === 'true';
  };

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
      allowWrite: ctx.config.server.allowWrite,
      ide: {
        editor: ctx.config.ide.editor,
        hasProjectRoots: Boolean(
          ctx.config.ide.projectRoots && Object.keys(ctx.config.ide.projectRoots).length > 0,
        ),
      },
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
      const rules = parseList(c.req.query('rules'));
      const assignees = parseList(c.req.query('assignees'));
      const resolutions = parseList(c.req.query('resolutions'));
      if (types) filters.types = types;
      if (severities) filters.severities = severities;
      if (statuses) filters.statuses = statuses;
      if (tags) filters.tags = tags;
      if (rules) filters.rules = rules;
      if (assignees) filters.assignees = assignees;
      if (resolutions) filters.resolutions = resolutions;
      if (q) filters.q = q;
      if (resolved != null) filters.resolved = resolved === 'true';
      if (isNewCode(c)) filters.inNewCodePeriod = true;
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
      const newCode = isNewCode(c);
      return cached(
        `measures:${key}:${refKey(branch, pullRequest)}:${newCode ? 'new' : 'all'}`,
        TTL.measures,
        () => getProjectMeasures(conn, buildTarget(key, branch, pullRequest), { newCode }),
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
      const newCode = isNewCode(c);
      const suffix = newCode ? 'new' : 'all';

      const [qualityGate, measures, hotspots, issues] = await Promise.all([
        cached(`qg:${key}:${ref}`, TTL.qualityGate, () => getQualityGateStatus(conn, target), {
          force,
        }),
        cached(
          `measures:${key}:${ref}:${suffix}`,
          TTL.measures,
          () => getProjectMeasures(conn, target, { newCode }),
          { force },
        ),
        cached(`hotspots:${key}:${ref}`, TTL.hotspots, () => getSecurityHotspots(conn, target), {
          force,
        }),
        cached(
          `facets:${key}:${ref}:${suffix}`,
          TTL.issues,
          () => getIssueFacets(conn, target, { inNewCodePeriod: newCode }),
          { force },
        ),
      ]);

      return { projectKey: key, qualityGate, measures, hotspots, issues, newCode };
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

  api.get('/scm', (c) =>
    handle(c, () => {
      const component = c.req.query('component');
      if (!component) throw new Error('Missing required query param: component');
      const branch = c.req.query('branch');
      const pullRequest = c.req.query('pullRequest');
      const from = Number(c.req.query('from') ?? '1');
      const to = Number(c.req.query('to') ?? String(from + 10));
      return cached(
        `scm:${component}:${refKey(branch, pullRequest)}:${from}:${to}`,
        TTL.sources,
        () =>
          getScmBlame(
            conn,
            { ...(branch && { branch }), ...(pullRequest && { pullRequest }) },
            component,
            from,
            to,
          ),
      );
    }),
  );

  // Rule definition + "how to fix" guidance (rarely changes → long TTL).
  api.get('/rules/:key{.+}', (c) =>
    handle(c, () => {
      const key = c.req.param('key');
      return cached(`rule:${key}`, TTL.projects, () => getRule(conn, key));
    }),
  );

  api.get('/issues/:key/changelog', (c) =>
    handle(c, () => {
      const key = c.req.param('key');
      return cached(`changelog:${key}`, TTL.issues, () => getIssueChangelog(conn, key));
    }),
  );

  api.get('/hotspots/:key', (c) =>
    handle(c, () => {
      const key = c.req.param('key');
      return cached(`hotspot:${key}`, TTL.hotspots, () => getHotspotDetail(conn, key));
    }),
  );

  // Facet values to populate the issues filter controls.
  api.get('/projects/:key/issue-facets', (c) =>
    handle(c, () => {
      const key = c.req.param('key');
      const branch = c.req.query('branch');
      const pullRequest = c.req.query('pullRequest');
      return cached(`issue-facets:${key}:${refKey(branch, pullRequest)}`, TTL.issues, () =>
        getIssueFilterFacets(conn, buildTarget(key, branch, pullRequest)),
      );
    }),
  );

  // Map a SonarQube component to a local absolute path (cwd default + override).
  const resolveAbsPath = (project: string | undefined, component: string): string => {
    const roots = ctx.config.ide.projectRoots ?? {};
    const root = (project && roots[project]) || process.cwd();
    return join(root, extractPath(component));
  };

  // Resolve a SonarQube component to a local file + editor deep-links.
  api.get('/ide/resolve', (c) =>
    handle(c, async () => {
      const project = c.req.query('project');
      const component = c.req.query('component');
      if (!component) throw new Error('Missing required query param: component');
      const line = Math.max(1, Number(c.req.query('line') ?? '1'));

      const absPath = resolveAbsPath(project, component);
      const fileEnc = encodeURIComponent(absPath);

      const resolution: IdeResolution = {
        absPath,
        line,
        urls: {
          vscode: `vscode://file/${absPath}:${line}:1`,
          cursor: `cursor://file/${absPath}:${line}:1`,
          windsurf: `windsurf://file/${absPath}:${line}:1`,
          idea: `idea://open?file=${fileEnc}&line=${line}`,
        },
        jetbrainsRest: `http://localhost:63342/api/file?file=${fileEnc}&line=${line}`,
      };
      return resolution;
    }),
  );

  // Open a file with the OS default application (no editor configuration needed).
  api.post('/ide/open', async (c) => {
    let body: { project?: string; component?: string } = {};
    try {
      body = await c.req.json();
    } catch {
      /* empty */
    }
    if (!body.component) {
      return c.json({ error: 'bad_request', message: 'component is required' }, 400);
    }
    const absPath = resolveAbsPath(body.project, body.component);
    try {
      const open = (await import('open')).default;
      await open(absPath);
      return c.json({ ok: true, absPath });
    } catch (error) {
      return c.json(
        { error: 'open_failed', message: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  });

  registerWriteRoutes(api, ctx);

  // Render the current view to a PDF via headless Chromium (lazy-installed).
  api.post('/export/pdf', async (c) => {
    let body: { projectKey?: string; branch?: string; pullRequest?: string } = {};
    try {
      body = await c.req.json();
    } catch {
      /* empty body */
    }
    if (!body.projectKey) {
      return c.json({ error: 'bad_request', message: 'projectKey is required' }, 400);
    }
    try {
      const pdf = await renderReportPdf({
        port: ctx.port,
        host: ctx.config.server.host,
        projectKey: body.projectKey,
        ...(body.branch && { branch: body.branch }),
        ...(body.pullRequest && { pullRequest: body.pullRequest }),
        ...(ctx.authToken && { authToken: ctx.authToken }),
      });
      return new Response(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${body.projectKey}-report.pdf"`,
        },
      });
    } catch (error) {
      if (error instanceof PdfUnavailableError) {
        return c.json({ error: 'pdf_unavailable', message: error.message }, 422);
      }
      return c.json(
        { error: 'pdf_failed', message: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  });

  return api;
}

const VALID_TRANSITIONS: IssueTransition[] = [
  'confirm',
  'unconfirm',
  'reopen',
  'resolve',
  'falsepositive',
  'wontfix',
  'accept',
];

/** Guarded write actions — only allowed when `serve --allow-write` is set. */
function registerWriteRoutes(api: Hono, ctx: ServerContext): void {
  const { conn } = ctx;

  // Returns a 403 response when writes are disabled, else null to proceed.
  const denyIfReadOnly = (c: Context): Response | null =>
    ctx.config.server.allowWrite
      ? null
      : c.json(
          {
            error: 'write_disabled',
            message: 'Write actions are disabled. Start with --allow-write.',
          },
          403,
        );

  const body = async (c: Context): Promise<Record<string, unknown>> => {
    try {
      return (await c.req.json()) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  const fail = (c: Context, error: unknown): Response => {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: 'write_failed', message }, 502);
  };

  api.post('/issues/:key/transition', async (c) => {
    const denied = denyIfReadOnly(c);
    if (denied) return denied;
    const key = c.req.param('key');
    const { transition } = await body(c);
    if (
      typeof transition !== 'string' ||
      !VALID_TRANSITIONS.includes(transition as IssueTransition)
    ) {
      return c.json({ error: 'bad_request', message: 'Invalid transition' }, 400);
    }
    try {
      await transitionIssue(conn, key, transition as IssueTransition);
      clearCache();
      return c.json({ ok: true });
    } catch (e) {
      return fail(c, e);
    }
  });

  api.post('/issues/:key/assign', async (c) => {
    const denied = denyIfReadOnly(c);
    if (denied) return denied;
    const key = c.req.param('key');
    const { assignee } = await body(c);
    try {
      await assignIssue(conn, key, typeof assignee === 'string' ? assignee : undefined);
      clearCache();
      return c.json({ ok: true });
    } catch (e) {
      return fail(c, e);
    }
  });

  api.post('/issues/:key/comment', async (c) => {
    const denied = denyIfReadOnly(c);
    if (denied) return denied;
    const key = c.req.param('key');
    const { text } = await body(c);
    if (typeof text !== 'string' || !text.trim()) {
      return c.json({ error: 'bad_request', message: 'Comment text is required' }, 400);
    }
    try {
      await commentIssue(conn, key, text);
      clearCache();
      return c.json({ ok: true });
    } catch (e) {
      return fail(c, e);
    }
  });

  api.post('/issues/:key/severity', async (c) => {
    const denied = denyIfReadOnly(c);
    if (denied) return denied;
    const key = c.req.param('key');
    const { severity } = await body(c);
    if (typeof severity !== 'string') {
      return c.json({ error: 'bad_request', message: 'severity is required' }, 400);
    }
    try {
      await setIssueSeverity(conn, key, severity);
      clearCache();
      return c.json({ ok: true });
    } catch (e) {
      return fail(c, e);
    }
  });

  api.post('/issues/:key/tags', async (c) => {
    const denied = denyIfReadOnly(c);
    if (denied) return denied;
    const key = c.req.param('key');
    const { tags } = await body(c);
    const list = Array.isArray(tags) ? tags.filter((t): t is string => typeof t === 'string') : [];
    try {
      await setIssueTags(conn, key, list);
      clearCache();
      return c.json({ ok: true });
    } catch (e) {
      return fail(c, e);
    }
  });

  api.post('/hotspots/:key/status', async (c) => {
    const denied = denyIfReadOnly(c);
    if (denied) return denied;
    const key = c.req.param('key');
    const { status, resolution, comment } = await body(c);
    if (typeof status !== 'string') {
      return c.json({ error: 'bad_request', message: 'status is required' }, 400);
    }
    try {
      await changeHotspotStatus(
        conn,
        key,
        status,
        typeof resolution === 'string' ? resolution : undefined,
        typeof comment === 'string' ? comment : undefined,
      );
      clearCache();
      return c.json({ ok: true });
    } catch (e) {
      return fail(c, e);
    }
  });
}
