import { refKey, type Ref } from './api-client';

/** Selection-scoped query keys so switching project/branch swaps cache cleanly. */
export const qk = {
  config: () => ['config'] as const,
  status: () => ['status'] as const,
  projects: (q?: string) => ['projects', q ?? ''] as const,
  branches: (project: string) => ['branches', project] as const,
  summary: (project: string, ref: Ref) => ['summary', project, refKey(ref)] as const,
  issues: (project: string, ref: Ref) => ['issues', project, refKey(ref)] as const,
  qualityGate: (project: string, ref: Ref) => ['quality-gate', project, refKey(ref)] as const,
  measures: (project: string, ref: Ref) => ['measures', project, refKey(ref)] as const,
  hotspots: (project: string, ref: Ref) => ['hotspots', project, refKey(ref)] as const,
};
