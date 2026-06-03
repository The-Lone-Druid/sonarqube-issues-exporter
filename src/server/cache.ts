// Small in-memory TTL cache with single-flight + stale-while-revalidate.
// Decouples client poll frequency from upstream SonarQube calls.
// Optionally persists cache entries to disk so data survives server restarts.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Entry<T> {
  value: T;
  expires: number;
}

interface DiskEntry<T> {
  value: T;
  expires: number;
  savedAt: number;
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

let diskCacheDir: string | null = null;

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

/** Initialize disk-based cache persistence. Call once at server startup. */
export function initDiskCache(dir: string): void {
  try {
    mkdirSync(dir, { recursive: true });
    diskCacheDir = dir;
  } catch {
    /* silently skip if dir cannot be created */
  }
}

/** Convert a cache key to a safe filename (replaces non-alphanumeric chars). */
function keyToFilename(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 200) + '.json';
}

function saveToDisk<T>(key: string, value: T, expires: number): void {
  if (!diskCacheDir) return;
  try {
    const entry: DiskEntry<T> = { value, expires, savedAt: Date.now() };
    writeFileSync(join(diskCacheDir, keyToFilename(key)), JSON.stringify(entry), 'utf-8');
  } catch {
    /* ignore write errors */
  }
}

/** Load all disk cache entries into the in-memory store. Call once at startup, after initDiskCache. */
export function warmFromDisk(): void {
  if (!diskCacheDir || !existsSync(diskCacheDir)) return;
  const now = Date.now();
  try {
    const files = readdirSync(diskCacheDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw = readFileSync(join(diskCacheDir, file), 'utf-8');
        const entry = JSON.parse(raw) as DiskEntry<unknown>;
        if (entry.expires > now) {
          store.set(
            file.slice(0, -5).replace(/_/g, (_, i, s) => (s[i] === '_' ? '_' : '_')),
            {
              value: entry.value,
              expires: entry.expires,
            },
          );
        }
      } catch {
        /* skip malformed entries */
      }
    }
  } catch {
    /* ignore read errors */
  }
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
      const expires = Date.now() + ttlMs;
      store.set(key, { value, expires });
      saveToDisk(key, value, expires);
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

/** Clear the entire in-memory cache (used after write mutations). */
export function clearCache(): void {
  store.clear();
  inflight.clear();
}
