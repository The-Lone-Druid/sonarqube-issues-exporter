// Orchestrates a SonarQube scan from within the running server.
// Uses @sonarqube/scanner programmatically — no separate install required.
// Only one scan may run at a time (local single-user tool).

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

type ScanPhase = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export interface ScanState {
  phase: ScanPhase;
  logs: string[];
  startedAt?: number;
  endedAt?: number;
}

export interface ScanOptions {
  projectKey: string;
  branch?: string;
  /** Absolute path to the project root (defaults to process.cwd()). */
  cwd: string;
  serverUrl: string;
  token: string;
  /** Required for SonarCloud; optional for self-hosted SonarQube. */
  organization?: string;
}

const MAX_LOGS = 400;

let _state: ScanState = { phase: 'idle', logs: [] };

export function getScanState(): ScanState {
  return { ..._state, logs: [..._state.logs] };
}

function push(line: string): void {
  _state.logs.push(line);
  if (_state.logs.length > MAX_LOGS) _state.logs.splice(0, _state.logs.length - MAX_LOGS);
}

function getGitBranch(cwd: string): string | undefined {
  try {
    const b = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
    }).trim();
    return b && b !== 'HEAD' ? b : undefined;
  } catch {
    return undefined;
  }
}

/** Start a scan asynchronously. Resolves immediately; poll getScanState() for progress. */
export async function startScan(options: ScanOptions): Promise<void> {
  if (_state.phase === 'scanning' || _state.phase === 'processing') {
    throw new Error('A scan is already in progress');
  }

  const branch = options.branch ?? getGitBranch(options.cwd);
  _state = { phase: 'scanning', logs: [], startedAt: Date.now() };
  push(`[info] Scanning: ${options.cwd}`);
  push(`[info] Project:  ${options.projectKey}${branch ? `  |  Branch: ${branch}` : ''}`);
  push('');

  void doScan(options, branch);
}

async function doScan(options: ScanOptions, branch?: string): Promise<void> {
  try {
    await runScanner(options, branch);
    _state.phase = 'processing';
    push('');
    push('[info] Analysis submitted — waiting for Compute Engine...');
    await pollCeTask(options);
    _state.phase = 'success';
    _state.endedAt = Date.now();
    push('[info] ✓ Complete. Refresh the dashboard to see updated results.');
  } catch (err) {
    _state.phase = 'error';
    _state.endedAt = Date.now();
    push('');
    push(`[error] ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function runScanner(options: ScanOptions, branch?: string): Promise<void> {
  // Dynamic import so the heavy package is only loaded when a scan is triggered.
  let scannerMod: { scan?: unknown; customScanner?: unknown };
  try {
    scannerMod = (await import('sonarqube-scanner')) as typeof scannerMod;
  } catch {
    throw new Error(
      'sonarqube-scanner is not available. Make sure sonarqube-issues-exporter is installed correctly.',
    );
  }

  const scanFn =
    typeof scannerMod.scan === 'function'
      ? (scannerMod.scan as (o: unknown) => Promise<void>)
      : null;

  if (!scanFn) {
    throw new Error('Could not find scan() in sonarqube-scanner. Try reinstalling the package.');
  }

  const hasProps = existsSync(join(options.cwd, 'sonar-project.properties'));
  if (hasProps) {
    push('[info] Found sonar-project.properties — project settings loaded from file');
  }

  const sonarOptions: Record<string, string> = {
    'sonar.host.url': options.serverUrl,
    'sonar.token': options.token,
    'sonar.projectBaseDir': options.cwd,
  };

  if (options.organization) sonarOptions['sonar.organization'] = options.organization;

  if (!hasProps) {
    sonarOptions['sonar.projectKey'] = options.projectKey;
    sonarOptions['sonar.sources'] = '.';
    sonarOptions['sonar.exclusions'] =
      'node_modules/**,dist/**,coverage/**,build/**,.next/**,out/**,*.min.js,*.map';
  }

  if (branch) sonarOptions['sonar.branch.name'] = branch;

  push('[info] On first run the scanner may download binaries (~200 MB) — this can take a minute.');

  // Temporarily capture console output so scanner logs appear in our log panel.
  const capture = (...args: unknown[]): void => {
    const line = args.map(String).join(' ').trim();
    if (line) push(line);
  };
  const saved = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  console.log = capture;
  console.info = capture;
  console.warn = capture;
  console.error = capture;

  try {
    await scanFn({ serverUrl: options.serverUrl, token: options.token, options: sonarOptions });
  } catch (err) {
    // If JRE provisioning failed, the error message will reference missing CLI.
    // Surface a clearer message so users know what to do.
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('not found in PATH') || msg.includes('SonarScanner CLI')) {
      throw new Error(
        `${msg}\n\nFix: install sonar-scanner CLI (https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/scanners/sonarscanner/) or ensure your SonarQube server supports JRE provisioning (SonarQube 9.7+).`,
      );
    }
    throw err;
  } finally {
    console.log = saved.log;
    console.info = saved.info;
    console.warn = saved.warn;
    console.error = saved.error;
  }
}

async function pollCeTask(options: ScanOptions): Promise<void> {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    await sleep(4000);
    try {
      const url =
        `${options.serverUrl}/api/ce/activity` +
        `?component=${encodeURIComponent(options.projectKey)}&status=IN_PROGRESS&ps=1`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${options.token}` },
      });
      if (res.ok) {
        const body = (await res.json()) as { tasks?: unknown[] };
        if (!body.tasks || body.tasks.length === 0) return;
        push('[info] Still processing...');
      }
    } catch {
      // Network error during polling — non-fatal, keep waiting.
    }
  }
  // Timed out; results may still be available.
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
