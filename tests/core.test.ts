import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  escapeHtml,
  extractFilename,
  extractPath,
  formatRating,
  formatTechnicalDebt,
} from '../src/core/format';
import { calculateMetrics, computeIssueMetrics } from '../src/core/metrics';
import { loadConfig, toConnection } from '../src/core/config';
import type { SonarQubeIssue } from '../src/core/types';

describe('format', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#039;&amp;&#039;&lt;/a&gt;',
    );
  });

  it('extracts the filename from a component key', () => {
    expect(extractFilename('proj:src/main/Foo.java')).toBe('Foo.java');
    expect(extractFilename('Bar.ts')).toBe('Bar.ts');
  });

  it('extracts the path without the project prefix', () => {
    expect(extractPath('proj:src/main/Foo.java')).toBe('src/main/Foo.java');
    expect(extractPath('Bar.ts')).toBe('Bar.ts');
  });

  it('formats technical debt minutes into a human string', () => {
    expect(formatTechnicalDebt(0)).toBe('0min');
    expect(formatTechnicalDebt(30)).toBe('30min');
    expect(formatTechnicalDebt(8 * 60)).toBe('1d');
    expect(formatTechnicalDebt(8 * 60 + 60)).toBe('1d 1h');
  });

  it('maps numeric ratings to letter grades', () => {
    expect(formatRating('1')).toBe('A');
    expect(formatRating('5')).toBe('E');
    expect(formatRating(undefined)).toBe('N/A');
    expect(formatRating('9')).toBe('N/A');
  });
});

describe('metrics', () => {
  const issues = [
    { severity: 'MAJOR', type: 'BUG', status: 'OPEN', component: 'p:a/A.ts', rule: 'r1' },
    { severity: 'MAJOR', type: 'CODE_SMELL', status: 'OPEN', component: 'p:a/A.ts', rule: 'r2' },
    { severity: 'MINOR', type: 'BUG', status: 'CONFIRMED', component: 'p:b/B.ts', rule: 'r1' },
  ] as unknown as SonarQubeIssue[];

  it('groups items by extractor', () => {
    const grouped = calculateMetrics(issues, { sev: (i) => i.severity });
    expect(grouped['sev']).toEqual({ MAJOR: 2, MINOR: 1 });
  });

  it('computes issue metrics breakdown', () => {
    const m = computeIssueMetrics(issues);
    expect(m.total).toBe(3);
    expect(m.severities).toEqual({ MAJOR: 2, MINOR: 1 });
    expect(m.types).toEqual({ BUG: 2, CODE_SMELL: 1 });
    expect(m.statuses).toEqual({ OPEN: 2, CONFIRMED: 1 });
    expect(m.components).toEqual({ 'A.ts': 2, 'B.ts': 1 });
    expect(m.rules).toEqual({ r1: 2, r2: 1 });
  });
});

describe('config', () => {
  const ENV_KEYS = [
    'SONARQUBE_URL',
    'SONARQUBE_TOKEN',
    'SONARQUBE_ORGANIZATION',
    'SONARQUBE_PROJECT_KEY',
    'SQ_PORT',
  ];
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('builds config from overrides and maps project to defaultProjectKey', () => {
    const config = loadConfig({
      overrides: {
        sonarqube: {
          url: 'https://sonar.example.com',
          token: 't0ken',
          defaultProjectKey: 'my-proj',
        },
      },
    });
    expect(config.sonarqube.url).toBe('https://sonar.example.com');
    expect(config.sonarqube.defaultProjectKey).toBe('my-proj');
    expect(config.server.port).toBe(7010);
    expect(config.server.host).toBe('127.0.0.1');
  });

  it('reads connection-only fields via toConnection', () => {
    const config = loadConfig({
      overrides: { sonarqube: { url: 'https://s', token: 'tk', organization: 'org' } },
    });
    expect(toConnection(config)).toEqual({ url: 'https://s', token: 'tk', organization: 'org' });
  });

  it('throws when token is missing', () => {
    expect(() => loadConfig({ overrides: { sonarqube: { url: 'https://s', token: '' } } })).toThrow(
      /token is required/,
    );
  });

  it('throws on invalid url', () => {
    expect(() =>
      loadConfig({ overrides: { sonarqube: { url: 'not a url', token: 'tk' } } }),
    ).toThrow(/Invalid SonarQube URL/);
  });

  it('throws on out-of-range port', () => {
    expect(() =>
      loadConfig({
        overrides: { sonarqube: { url: 'https://s', token: 'tk' }, server: { port: 99999 } },
      }),
    ).toThrow(/port must be between/);
  });
});
