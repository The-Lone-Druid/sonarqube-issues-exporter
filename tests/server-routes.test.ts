import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app';
import { createServerContext } from '../src/server/context';
import { clearCache } from '../src/server/cache';
import type { AppConfig } from '../src/core/types';

const config: AppConfig = {
  sonarqube: { url: 'https://sonar.example.com', token: 'tok' },
  server: { port: 7010, host: '127.0.0.1', open: false, auth: false, allowWrite: false },
  ide: { editor: 'vscode', projectRoots: { demo: '/Users/me/demo' } },
  logging: { level: 'error' },
};

const app = createApp(createServerContext(config, { port: 7010 }));
const writableApp = createApp(
  createServerContext(
    { ...config, server: { ...config.server, allowWrite: true } },
    { port: 7010 },
  ),
);

function mockUpstream(routes: Record<string, unknown>) {
  vi.stubGlobal('fetch', async (url: string) => {
    const path = new URL(url).pathname;
    const json = routes[path] ?? {};
    return { ok: true, status: 200, statusText: 'OK', json: async () => json } as Response;
  });
}

beforeEach(() => clearCache());
afterEach(() => vi.unstubAllGlobals());

describe('GET /api/projects/:key/summary', () => {
  it('aggregates quality gate, measures, hotspots and issue facets', async () => {
    mockUpstream({
      '/api/qualitygates/project_status': { projectStatus: { status: 'PASSED', conditions: [] } },
      '/api/measures/component': {
        component: { measures: [{ metric: 'coverage', value: '88.5' }] },
      },
      '/api/hotspots/search': {
        hotspots: [{ vulnerabilityProbability: 'HIGH', securityCategory: 'xss' }],
        paging: { total: 1 },
      },
      '/api/issues/search': {
        paging: { total: 3 },
        facets: [{ property: 'types', values: [{ val: 'BUG', count: 3 }] }],
      },
    });

    const res = await app.request('/api/projects/demo/summary?branch=main');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      qualityGate: { status: string };
      measures: { coverage: number };
      hotspots: { total: number };
      issues: { types: Record<string, number> };
    };
    expect(body.qualityGate.status).toBe('PASSED');
    expect(body.measures.coverage).toBe(88.5);
    expect(body.hotspots.total).toBe(1);
    expect(body.issues.types).toEqual({ BUG: 3 });
  });
});

describe('GET /api/projects/:key/branches', () => {
  it('returns branches and pull requests together', async () => {
    mockUpstream({
      '/api/project_branches/list': { branches: [{ name: 'main', isMain: true, type: 'LONG' }] },
      '/api/project_pull_requests/list': {
        pullRequests: [{ key: '7', title: 'Fix', branch: 'fix' }],
      },
    });
    const res = await app.request('/api/projects/demo/branches');
    const body = (await res.json()) as {
      branches: Array<{ name: string }>;
      pullRequests: Array<{ key: string }>;
    };
    expect(body.branches[0]?.name).toBe('main');
    expect(body.pullRequests[0]?.key).toBe('7');
  });
});

describe('error mapping', () => {
  it('maps upstream 401 to 502 with an auth discriminator', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        ({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({}),
        }) as Response,
    );
    const res = await app.request('/api/projects/demo/issues');
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('auth');
  });
});

describe('POST /api/export/pdf validation', () => {
  it('rejects a missing projectKey with 400', async () => {
    const res = await app.request('/api/export/pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/rules/:key', () => {
  it('returns rule guidance, preferring descriptionSections', async () => {
    mockUpstream({
      '/api/rules/show': {
        rule: {
          key: 'java:S1234',
          name: 'Avoid X',
          severity: 'MAJOR',
          descriptionSections: [
            { key: 'root_cause', content: '<p>why</p>' },
            { key: 'how_to_fix', content: '<p>fix</p>' },
          ],
        },
      },
    });
    const res = await app.request('/api/rules/java:S1234');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { key: string; descriptionSections: Array<{ key: string }> };
    expect(body.key).toBe('java:S1234');
    expect(body.descriptionSections.map((s) => s.key)).toContain('how_to_fix');
  });
});

describe('GET /api/ide/resolve', () => {
  it('maps a component to a local path + editor URLs using projectRoots', async () => {
    const res = await app.request(
      '/api/ide/resolve?project=demo&component=demo:src/Auth.ts&line=42',
    );
    const body = (await res.json()) as {
      absPath: string;
      line: number;
      urls: { vscode: string };
      jetbrainsRest: string;
    };
    expect(body.absPath).toBe('/Users/me/demo/src/Auth.ts');
    expect(body.line).toBe(42);
    expect(body.urls.vscode).toBe('vscode://file//Users/me/demo/src/Auth.ts:42:1');
    expect(body.jetbrainsRest).toContain('localhost:63342');
  });
});

describe('write actions guard', () => {
  it('rejects writes with 403 when allowWrite is false', async () => {
    const res = await app.request('/api/issues/ABC/transition', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ transition: 'resolve' }),
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: string }).error).toBe('write_disabled');
  });

  it('validates transition and performs it when allowWrite is true', async () => {
    mockUpstream({ '/api/issues/do_transition': {} });
    const bad = await writableApp.request('/api/issues/ABC/transition', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ transition: 'nonsense' }),
    });
    expect(bad.status).toBe(400);

    const okRes = await writableApp.request('/api/issues/ABC/transition', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ transition: 'resolve' }),
    });
    expect(okRes.status).toBe(200);
    expect(((await okRes.json()) as { ok: boolean }).ok).toBe(true);
  });
});
