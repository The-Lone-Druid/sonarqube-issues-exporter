// Small in-memory TTL cache with single-flight + stale-while-revalidate.
// Decouples client poll frequency from upstream SonarQube calls.

interface Entry<T> {
  value: T;
  expires: number;
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** Default TTLs (ms) per logical resource. */
export const TTL = {
  status: 10_000,
  projects: 60_000,
  branches: 30_000,
  qualityGate: 30_000,
  measures: 60_000,
  hotspots: 30_000,
  issues: 15_000,
  sources: 300_000,
} as const;

export interface CacheOptions {
  /** Bypass any cached value and refresh from source. */
  force?: boolean;
}

/**
 * Return a cached value for `key`, computing it via `fn` on miss.
 * - Single-flight: concurrent identical calls share one in-flight promise.
 * - Stale-while-revalidate: a stale value is returned immediately while a
 *   background refresh runs (unless `force` is set).
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as Entry<T> | undefined;

  if (!options.force && entry && entry.expires > now) {
    return entry.value;
  }

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) {
    if (!options.force && entry) return entry.value;
    return existing;
  }

  const promise = (async () => {
    try {
      const value = await fn();
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);

  // Serve stale immediately while the refresh continues in the background.
  if (!options.force && entry) {
    promise.catch(() => undefined);
    return entry.value;
  }

  return promise;
}

/** Clear the entire cache (used by tests). */
export function clearCache(): void {
  store.clear();
  inflight.clear();
}
