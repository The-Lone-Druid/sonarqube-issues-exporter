import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { logger } from '../../core/logger';

/** Thrown when PDF export can't run because Chromium isn't available. */
export class PdfUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfUnavailableError';
  }
}

// Minimal shape of the parts of playwright-core's `chromium` we use.
export interface ChromiumLike {
  executablePath: () => string;
  launch: (options?: { headless?: boolean }) => Promise<BrowserLike>;
}

export interface BrowserLike {
  newPage: () => Promise<PageLike>;
  close: () => Promise<void>;
}

export interface PageLike {
  goto: (url: string, opts?: { waitUntil?: string; timeout?: number }) => Promise<unknown>;
  waitForFunction: (
    fn: string | ((...args: unknown[]) => boolean),
    arg?: unknown,
    opts?: { timeout?: number },
  ) => Promise<unknown>;
  waitForSelector: (selector: string, opts?: { timeout?: number }) => Promise<unknown>;
  pdf: (opts?: Record<string, unknown>) => Promise<Buffer>;
}

/** Dynamically load playwright-core's chromium (optional dependency). */
export async function loadChromium(): Promise<ChromiumLike> {
  try {
    const pw = (await import('playwright-core')) as unknown as { chromium: ChromiumLike };
    return pw.chromium;
  } catch {
    throw new PdfUnavailableError(
      'PDF export requires the optional "playwright-core" dependency, which is not installed.',
    );
  }
}

/** Ensure a Chromium binary exists, installing it once on first use if allowed. */
export async function ensureChromium(chromium: ChromiumLike): Promise<void> {
  let path = '';
  try {
    path = chromium.executablePath();
  } catch {
    path = '';
  }
  if (path && existsSync(path)) return;

  if (process.env['SQ_AUTO_INSTALL_BROWSER'] === 'false') {
    throw new PdfUnavailableError(
      'Chromium is not installed and auto-install is disabled. Run `npx playwright-core install chromium`.',
    );
  }

  logger.info('Chromium not found — installing once (~150MB). This may take a moment...');
  await runInstall();
}

function runInstall(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright-core', 'install', 'chromium'], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', () =>
      reject(new PdfUnavailableError('Failed to launch the Chromium installer.')),
    );
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(
            new PdfUnavailableError(
              'Chromium install failed. Try `npx playwright-core install chromium` manually.',
            ),
          ),
    );
  });
}
