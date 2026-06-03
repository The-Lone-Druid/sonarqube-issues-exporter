import { serve } from '@hono/node-server';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { createServer } from 'node:net';
import type { AppConfig } from '../core/types';
import { logger } from '../core/logger';
import { createApp } from './app';
import { createServerContext } from './context';
import { initDiskCache, warmFromDisk } from './cache';

export interface StartServerOptions {
  config: AppConfig;
  /** Override config.server.* for one run. */
  port?: number;
  host?: string;
  auth?: boolean;
}

export interface RunningServer {
  port: number;
  host: string;
  url: string;
  authToken?: string;
  close: () => Promise<void>;
}

/** Probe for a free TCP port starting at `preferred`, scanning upward. */
function findFreePort(preferred: number, host: string, attempts = 50): Promise<number> {
  return new Promise((resolvePort, rejectPort) => {
    const tryPort = (port: number, remaining: number): void => {
      const tester = createServer();
      tester.once('error', (err: NodeJS.ErrnoException) => {
        tester.close();
        if (err.code === 'EADDRINUSE' && remaining > 0) {
          tryPort(port + 1, remaining - 1);
        } else {
          rejectPort(err);
        }
      });
      tester.once('listening', () => {
        tester.close(() => resolvePort(port));
      });
      tester.listen(port, host);
    };
    tryPort(preferred, attempts);
  });
}

/** Start the local dashboard server. Resolves once it is listening. */
export async function startServer(options: StartServerOptions): Promise<RunningServer> {
  const { config } = options;
  const host = options.host ?? config.server.host;
  const useAuth = options.auth ?? config.server.auth;
  const port = await findFreePort(options.port ?? config.server.port, host);
  const authToken = useAuth ? randomBytes(16).toString('hex') : undefined;

  const cacheDir = join(process.env['HOME'] ?? '.', '.sq-exporter', 'cache');
  initDiskCache(cacheDir);
  warmFromDisk();

  const ctx = createServerContext(config, { port, ...(authToken && { authToken }) });
  const app = createApp(ctx);

  const server = serve({ fetch: app.fetch, port, hostname: host });

  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  const url = `http://${displayHost}:${port}${authToken ? `/#token=${authToken}` : '/'}`;

  return {
    port,
    host,
    url,
    ...(authToken && { authToken }),
    close: () =>
      new Promise<void>((resolveClose) => {
        server.close(() => resolveClose());
      }),
  };
}

/** Best-effort browser open; never throws. */
export async function openBrowser(url: string): Promise<void> {
  try {
    const open = (await import('open')).default;
    await open(url);
  } catch (error) {
    logger.debug(`Could not open browser automatically: ${String(error)}`);
  }
}
