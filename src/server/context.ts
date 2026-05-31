import type { AnalysisTarget, AppConfig, SonarQubeConnection } from '../core/types';
import { toConnection } from '../core/config';

/** Shared per-process state handed to every route. */
export interface ServerContext {
  config: AppConfig;
  conn: SonarQubeConnection;
  /** When set, `/api/*` requests must present this token (shared-machine protection). */
  authToken?: string;
  /** Resolved port the server is actually listening on. */
  port: number;
}

export function createServerContext(
  config: AppConfig,
  options: { authToken?: string; port: number },
): ServerContext {
  return {
    config,
    conn: toConnection(config),
    ...(options.authToken && { authToken: options.authToken }),
    port: options.port,
  };
}

/** Build an AnalysisTarget from a project key plus branch/PR query params. */
export function buildTarget(
  projectKey: string,
  branch?: string,
  pullRequest?: string,
): AnalysisTarget {
  return {
    projectKey,
    ...(branch && { branch }),
    ...(pullRequest && { pullRequest }),
  };
}
