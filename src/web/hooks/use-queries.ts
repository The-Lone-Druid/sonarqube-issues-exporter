import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api, type Ref } from '../lib/api-client';
import { qk } from '../lib/query-keys';
import { POLL } from '../lib/query-client';

export function useConfig() {
  return useQuery({ queryKey: qk.config(), queryFn: () => api.config(), staleTime: Infinity });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: qk.status(),
    queryFn: () => api.systemStatus(),
    refetchInterval: POLL.status,
  });
}

export function useProjects(q?: string) {
  return useQuery({
    queryKey: qk.projects(q),
    queryFn: () => api.projects(q),
    staleTime: 60_000,
  });
}

export function useBranches(project: string | null) {
  return useQuery({
    queryKey: qk.branches(project ?? ''),
    queryFn: () => api.branches(project as string),
    enabled: Boolean(project),
    staleTime: 30_000,
  });
}

export function useSummary(project: string | null, ref: Ref, newCode = false) {
  return useQuery({
    queryKey: qk.summary(project ?? '', ref, newCode),
    queryFn: () => api.summary(project as string, { ref, newCode }),
    enabled: Boolean(project),
    refetchInterval: POLL.summary,
    placeholderData: keepPreviousData,
  });
}

export function useIssues(project: string | null, ref: Ref, newCode = false) {
  return useQuery({
    queryKey: qk.issues(project ?? '', ref, newCode),
    queryFn: () => api.issues(project as string, { ref, newCode }),
    enabled: Boolean(project),
    refetchInterval: POLL.issues,
    placeholderData: keepPreviousData,
  });
}

export function useMeasures(project: string | null, ref: Ref, newCode = false) {
  return useQuery({
    queryKey: qk.measures(project ?? '', ref, newCode),
    queryFn: () => api.measures(project as string, { ref, newCode }),
    enabled: Boolean(project),
    refetchInterval: POLL.measures,
    placeholderData: keepPreviousData,
  });
}

export function useHotspots(project: string | null, ref: Ref) {
  return useQuery({
    queryKey: qk.hotspots(project ?? '', ref),
    queryFn: () => api.hotspots(project as string, ref),
    enabled: Boolean(project),
    refetchInterval: POLL.summary,
    placeholderData: keepPreviousData,
  });
}

export function useIssueFacets(project: string | null, ref: Ref) {
  return useQuery({
    queryKey: qk.issueFacets(project ?? '', ref),
    queryFn: () => api.issueFacets(project as string, ref),
    enabled: Boolean(project),
    staleTime: 60_000,
  });
}

export function useRule(ruleKey: string | null) {
  return useQuery({
    queryKey: qk.rule(ruleKey ?? ''),
    queryFn: () => api.rule(ruleKey as string),
    enabled: Boolean(ruleKey),
    staleTime: Infinity,
  });
}

export function useSource(component: string | null, ref: Ref, from: number, to: number) {
  return useQuery({
    queryKey: qk.source(component ?? '', ref, from, to),
    queryFn: () => api.source(component as string, ref, from, to),
    enabled: Boolean(component) && to >= from,
    staleTime: 300_000,
  });
}

export function useScm(component: string | null, ref: Ref, from: number, to: number) {
  return useQuery({
    queryKey: qk.scm(component ?? '', ref, from, to),
    queryFn: () => api.scm(component as string, ref, from, to),
    enabled: Boolean(component) && to >= from,
    staleTime: 300_000,
  });
}

export function useChangelog(issueKey: string | null) {
  return useQuery({
    queryKey: qk.changelog(issueKey ?? ''),
    queryFn: () => api.changelog(issueKey as string),
    enabled: Boolean(issueKey),
  });
}

export function useHotspotDetail(key: string | null) {
  return useQuery({
    queryKey: qk.hotspotDetail(key ?? ''),
    queryFn: () => api.hotspotDetail(key as string),
    enabled: Boolean(key),
  });
}

/** Invalidate every query for the active project so the dashboard refetches. */
export function useRefresh(project: string | null) {
  const client = useQueryClient();
  return useCallback(() => {
    client.invalidateQueries({
      predicate: (query) => !project || query.queryKey.includes(project),
    });
  }, [client, project]);
}

/** Invalidate everything (used after a write action mutates SonarQube). */
export function useInvalidateAll() {
  const client = useQueryClient();
  return useCallback(() => client.invalidateQueries(), [client]);
}
