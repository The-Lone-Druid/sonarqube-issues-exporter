import type { Context } from 'hono';
import { SonarQubeApiError } from '../core/sonarqube/client';
import { logger } from '../core/logger';

interface MappedError {
  status: 400 | 404 | 500 | 502 | 504;
  body: { error: string; message: string };
}

/** Map a thrown error to a stable HTTP status + JSON body for the SPA. */
export function mapError(error: unknown): MappedError {
  if (error instanceof SonarQubeApiError) {
    if (error.status === 401 || error.status === 403) {
      // Upstream auth/permission problem — this is a server-config issue, not a
      // browser auth failure, so surface as 502 with an `auth` discriminator.
      return { status: 502, body: { error: 'auth', message: error.message } };
    }
    if (error.status === 404) {
      return { status: 404, body: { error: 'not_found', message: error.message } };
    }
    return { status: 502, body: { error: 'upstream', message: error.message } };
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { status: 504, body: { error: 'timeout', message: 'SonarQube request timed out' } };
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return { status: 504, body: { error: 'timeout', message: 'SonarQube request timed out' } };
  }

  const message = error instanceof Error ? error.message : String(error);
  return { status: 500, body: { error: 'internal', message } };
}

/** Run a route handler, returning JSON on success or a mapped error response. */
export async function handle<T>(c: Context, fn: () => Promise<T>): Promise<Response> {
  try {
    return c.json((await fn()) as object);
  } catch (error) {
    const mapped = mapError(error);
    logger.debug(`Request failed (${mapped.status}): ${mapped.body.message}`);
    return c.json(mapped.body, mapped.status);
  }
}
