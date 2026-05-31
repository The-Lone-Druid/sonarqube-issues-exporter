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

export function useSummary(project: string | null, ref: Ref) {
  return useQuery({
    queryKey: qk.summary(project ?? '', ref),
    queryFn: () => api.summary(project as string, ref),
    enabled: Boolean(project),
    refetchInterval: POLL.summary,
    placeholderData: keepPreviousData,
  });
}

export function useIssues(project: string | null, ref: Ref) {
  return useQuery({
    queryKey: qk.issues(project ?? '', ref),
    queryFn: () => api.issues({ projectKey: project as string, ref }),
    enabled: Boolean(project),
    refetchInterval: POLL.issues,
    placeholderData: keepPreviousData,
  });
}

export function useMeasures(project: string | null, ref: Ref) {
  return useQuery({
    queryKey: qk.measures(project ?? '', ref),
    queryFn: () => api.measures(project as string, ref),
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

/** Invalidate every query for the active project so the dashboard refetches. */
export function useRefresh(project: string | null) {
  const client = useQueryClient();
  return useCallback(() => {
    client.invalidateQueries({
      predicate: (query) => !project || query.queryKey.includes(project),
    });
  }, [client, project]);
}
