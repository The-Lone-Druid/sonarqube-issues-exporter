import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAllIssues,
  fetchIssues,
  getIssueFacets,
  getProjectMeasures,
  getQualityGateStatus,
  getSecurityHotspots,
  getSourceLines,
  SonarQubeApiError,
} from '../src/core/sonarqube/client';
import { listBranches, listProjects } from '../src/core/sonarqube/projects';
import type { SonarQubeConnection } from '../src/core/types';

const conn: SonarQubeConnection = {
  url: 'https://sonar.example.com',
  token: 'tok',
  organization: 'org',
};

interface MockResponse {
  status?: number;
  json: unknown;
}

let lastUrl = '';
let handler: (url: string) => MockResponse;

beforeEach(() => {
  lastUrl = '';
  vi.stubGlobal('fetch', async (url: string) => {
    lastUrl = url;
    const { status = 200, json } = handler(url);
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: `HTTP ${status}`,
      json: async () => json,
    } as Response;
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('apiRequest / fetchIssues', () => {
  it('builds the issues URL with org, ref and filter params', async () => {
    handler = () => ({ json: { paging: { pageIndex: 1, pageSize: 100, total: 0 }, issues: [] } });
    await fetchIssues(conn, {
      projectKey: 'proj',
      branch: 'develop',
      page: 2,
      pageSize: 50,
      filters: { severities: ['MAJOR', 'BLOCKER'], types: ['BUG'] },
    });
    const u = new URL(lastUrl);
    expect(u.pathname).toBe('/api/issues/search');
    expect(u.searchParams.get('componentKeys')).toBe('proj');
    expect(u.searchParams.get('organization')).toBe('org');
    expect(u.searchParams.get('branch')).toBe('develop');
    expect(u.searchParams.get('severities')).toBe('MAJOR,BLOCKER');
    expect(u.searchParams.get('p')).toBe('2');
    expect(u.searchParams.get('ps')).toBe('50');
  });

  it('prefers pullRequest over branch (XOR)', async () => {
    handler = () => ({ json: { paging: { pageIndex: 1, pageSize: 100, total: 0 }, issues: [] } });
    await fetchIssues(conn, { projectKey: 'p', branch: 'b', pullRequest: '42' });
    const u = new URL(lastUrl);
    expect(u.searchParams.get('pullRequest')).toBe('42');
    expect(u.searchParams.has('branch')).toBe(false);
  });

  it('throws SonarQubeApiError with status on 401', async () => {
    handler = () => ({ status: 401, json: {} });
    await expect(fetchIssues(conn, { projectKey: 'p' })).rejects.toMatchObject({
      name: 'SonarQubeApiError',
      status: 401,
    });
    await expect(fetchIssues(conn, { projectKey: 'p' })).rejects.toBeInstanceOf(SonarQubeApiError);
  });
});

describe('fetchAllIssues pagination', () => {
  it('pages until total is reached and filters excluded statuses', async () => {
    const make = (n: number, status = 'OPEN') =>
      Array.from({ length: n }, (_, i) => ({ key: `k${i}`, status }) as never);
    let call = 0;
    handler = () => {
      call += 1;
      // total 700: page1 500 OPEN, page2 200 (with 1 CLOSED filtered out)
      if (call === 1)
        return { json: { paging: { pageIndex: 1, pageSize: 500, total: 700 }, issues: make(500) } };
      return {
        json: {
          paging: { pageIndex: 2, pageSize: 500, total: 700 },
          issues: [...make(199), { key: 'closed', status: 'CLOSED' } as never],
        },
      };
    };
    const issues = await fetchAllIssues(conn, { projectKey: 'p' });
    expect(issues).toHaveLength(699); // CLOSED filtered out
    expect(call).toBe(2);
  });
});

describe('getQualityGateStatus mapping', () => {
  it('maps conditions and degrades gracefully on error', async () => {
    handler = () => ({
      json: {
        projectStatus: {
          status: 'FAILED',
          conditions: [
            {
              metricKey: 'coverage',
              comparator: 'LT',
              actualValue: '50',
              errorThreshold: '80',
              status: 'ERROR',
            },
          ],
        },
      },
    });
    const qg = await getQualityGateStatus(conn, { projectKey: 'p' });
    expect(qg.status).toBe('FAILED');
    expect(qg.conditions[0]).toMatchObject({
      metric: 'coverage',
      actualValue: '50',
      status: 'ERROR',
    });

    handler = () => ({ status: 500, json: {} });
    const fallback = await getQualityGateStatus(conn, { projectKey: 'p' });
    expect(fallback).toEqual({ status: 'NONE', conditions: [] });
  });
});

describe('getIssueFacets', () => {
  it('reduces facets into severity/type/status records', async () => {
    handler = () => ({
      json: {
        paging: { total: 12 },
        facets: [
          {
            property: 'severities',
            values: [
              { val: 'MAJOR', count: 8 },
              { val: 'MINOR', count: 4 },
            ],
          },
          { property: 'types', values: [{ val: 'BUG', count: 5 }] },
          { property: 'statuses', values: [{ val: 'OPEN', count: 12 }] },
        ],
      },
    });
    const f = await getIssueFacets(conn, { projectKey: 'p' });
    expect(f.total).toBe(12);
    expect(f.severities).toEqual({ MAJOR: 8, MINOR: 4 });
    expect(f.types).toEqual({ BUG: 5 });
  });
});

describe('getProjectMeasures', () => {
  it('parses and formats measures (debt, ratings)', async () => {
    handler = () => ({
      json: {
        component: {
          measures: [
            { metric: 'coverage', value: '75.4' },
            { metric: 'duplicated_lines_density', value: '3.2' },
            { metric: 'ncloc', value: '12000' },
            { metric: 'sqale_index', value: '60' },
            { metric: 'sqale_rating', value: '1' },
            { metric: 'reliability_rating', value: '3' },
            { metric: 'security_rating', value: '2' },
            { metric: 'complexity', value: '900' },
          ],
        },
      },
    });
    const m = await getProjectMeasures(conn, { projectKey: 'p' });
    expect(m).toMatchObject({
      coverage: 75.4,
      duplicatedLinesDensity: 3.2,
      linesOfCode: 12000,
      technicalDebt: '1h',
      maintainabilityRating: 'A',
      reliabilityRating: 'C',
      securityRating: 'B',
      complexity: 900,
    });
  });

  it('returns {} on error', async () => {
    handler = () => ({ status: 500, json: {} });
    expect(await getProjectMeasures(conn, { projectKey: 'p' })).toEqual({});
  });
});

describe('getSecurityHotspots', () => {
  it('groups hotspots by priority and category', async () => {
    handler = () => ({
      json: {
        hotspots: [
          { vulnerabilityProbability: 'HIGH', securityCategory: 'xss' },
          { vulnerabilityProbability: 'HIGH', securityCategory: 'sql' },
          { vulnerabilityProbability: 'LOW', securityCategory: 'xss' },
        ],
        paging: { total: 3 },
      },
    });
    const h = await getSecurityHotspots(conn, { projectKey: 'p' });
    expect(h.total).toBe(3);
    expect(h.byPriority).toEqual({ HIGH: 2, LOW: 1 });
    expect(h.byCategory).toEqual({ xss: 2, sql: 1 });
  });
});

describe('getSourceLines', () => {
  it('strips HTML from returned source lines', async () => {
    handler = () => ({
      json: { sources: [{ line: 10, code: '<span class="k">const</span> x = 1;' }] },
    });
    const lines = await getSourceLines(conn, { branch: 'main' }, 'proj:a.ts', 9, 11);
    expect(lines).toEqual([{ line: 10, code: 'const x = 1;' }]);
    expect(new URL(lastUrl).searchParams.get('branch')).toBe('main');
  });

  it('returns [] on error', async () => {
    handler = () => ({ status: 404, json: {} });
    expect(await getSourceLines(conn, {}, 'c', 1, 2)).toEqual([]);
  });
});

describe('projects/branches', () => {
  it('lists projects via components/search', async () => {
    handler = () => ({
      json: {
        components: [{ key: 'a', name: 'A', qualifier: 'TRK' }],
        paging: { pageIndex: 1, pageSize: 100, total: 1 },
      },
    });
    const page = await listProjects(conn, { q: 'a' });
    expect(new URL(lastUrl).pathname).toBe('/api/components/search');
    expect(page.projects[0]).toMatchObject({ key: 'a', name: 'A' });
  });

  it('returns [] on branch errors (graceful)', async () => {
    handler = () => ({ status: 404, json: {} });
    expect(await listBranches(conn, 'p')).toEqual([]);
  });
});
