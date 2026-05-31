import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: false,
    },
  },
});

/** Default polling intervals (ms). Pollers pause when the tab is hidden. */
export const POLL = {
  status: 30_000,
  summary: 60_000,
  issues: 60_000,
  measures: 120_000,
} as const;
