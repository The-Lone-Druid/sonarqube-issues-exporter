import { refKey, type Ref } from './api-client';

const nc = (newCode?: boolean): string => (newCode ? 'new' : 'all');

/** Selection-scoped query keys so switching project/branch/new-code swaps cache cleanly. */
export const qk = {
  config: () => ['config'] as const,
  status: () => ['status'] as const,
  projects: (q?: string) => ['projects', q ?? ''] as const,
  branches: (project: string) => ['branches', project] as const,
  summary: (project: string, ref: Ref, newCode?: boolean) =>
    ['summary', project, refKey(ref), nc(newCode)] as const,
  issues: (project: string, ref: Ref, newCode?: boolean) =>
    ['issues', project, refKey(ref), nc(newCode)] as const,
  qualityGate: (project: string, ref: Ref) => ['quality-gate', project, refKey(ref)] as const,
  measures: (project: string, ref: Ref, newCode?: boolean) =>
    ['measures', project, refKey(ref), nc(newCode)] as const,
  hotspots: (project: string, ref: Ref) => ['hotspots', project, refKey(ref)] as const,
  issueFacets: (project: string, ref: Ref) => ['issue-facets', project, refKey(ref)] as const,
  rule: (ruleKey: string) => ['rule', ruleKey] as const,
  source: (component: string, ref: Ref, from: number, to: number) =>
    ['source', component, refKey(ref), from, to] as const,
  scm: (component: string, ref: Ref, from: number, to: number) =>
    ['scm', component, refKey(ref), from, to] as const,
  changelog: (issueKey: string) => ['changelog', issueKey] as const,
  hotspotDetail: (key: string) => ['hotspot-detail', key] as const,
};
