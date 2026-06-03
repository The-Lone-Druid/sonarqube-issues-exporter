#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as readline from 'node:readline';
import { loadConfig, toConnection } from './core/config';
import { initLogger, logger } from './core/logger';
import { getSystemStatus, listProjects } from './core/sonarqube/projects';
import type { DeepPartial, AppConfig } from './core/types';
import { openBrowser, startServer } from './server/server';
import { renderReportPdf } from './server/pdf/renderer';
import { PdfUnavailableError } from './server/pdf/install';
import { startScan, getScanState } from './server/scanner';

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  version: string;
};

interface ConnectionFlags {
  config?: string;
  url?: string;
  token?: string;
  project?: string;
  organization?: string;
  verbose?: boolean;
}

function buildOverrides(flags: ConnectionFlags): DeepPartial<AppConfig> | undefined {
  const sonarqube: DeepPartial<AppConfig['sonarqube']> = {};
  if (flags.url) sonarqube.url = flags.url;
  if (flags.token) sonarqube.token = flags.token;
  if (flags.organization) sonarqube.organization = flags.organization;
  if (flags.project) sonarqube.defaultProjectKey = flags.project;

  const overrides: DeepPartial<AppConfig> = {};
  if (Object.keys(sonarqube).length > 0) overrides.sonarqube = sonarqube;
  if (flags.verbose) overrides.logging = { level: 'debug' };
  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

function resolveConfig(flags: ConnectionFlags): AppConfig {
  const overrides = buildOverrides(flags);
  return loadConfig({
    ...(flags.config != null && { configPath: flags.config }),
    ...(overrides && { overrides }),
  });
}

const program = new Command();

program
  .name('sonarqube-exporter')
  .description('Run a local SonarQube dashboard and export PDF reports')
  .version(packageJson.version);

interface ServeFlags extends ConnectionFlags {
  port?: string;
  host?: string;
  open?: boolean;
  auth?: boolean;
  allowWrite?: boolean;
}

program
  .command('serve', { isDefault: true })
  .description('Start the local dashboard and open it in your browser')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--url <url>', 'SonarQube server URL')
  .option('--token <token>', 'SonarQube authentication token')
  .option('--project <key>', 'Project to pre-select on startup')
  .option('--organization <org>', 'SonarQube organization (for SonarCloud)')
  .option('-p, --port <number>', 'Preferred port (auto-increments if busy)')
  .option('--host <host>', 'Host to bind (default 127.0.0.1)')
  .option('--no-open', 'Do not open the browser automatically')
  .option('--auth', 'Require a local token for API access (shared machines)')
  .option('--allow-write', 'Enable in-app write actions (issue triage, hotspot status)')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (flags: ServeFlags) => {
    try {
      const config = resolveConfig(flags);
      if (flags.allowWrite) config.server.allowWrite = true;
      initLogger(config.logging);

      logger.info('Validating SonarQube connection...');
      const status = await getSystemStatus(toConnection(config)).catch(() => null);
      if (!status) {
        console.error(
          'Could not reach SonarQube. Check --url/--token or run `sonarqube-exporter setup`.',
        );
        process.exit(1);
      }

      const running = await startServer({
        config,
        ...(flags.port && { port: parseInt(flags.port, 10) }),
        ...(flags.host && { host: flags.host }),
        ...(flags.auth && { auth: true }),
      });

      console.log('\n  ◆ SonarQube dashboard running');
      console.log(`  ➜ Local:     ${running.url}`);
      console.log(`  ➜ Connected: ${config.sonarqube.url}`);
      if (running.authToken) console.log('  ➜ Auth:      local token required (see URL fragment)');
      console.log('\n  Press Ctrl+C to stop.\n');

      if (flags.open !== false) await openBrowser(running.url);

      const shutdown = async (): Promise<void> => {
        await running.close();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (error) {
      console.error('Failed to start server:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate the SonarQube connection and token access')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--url <url>', 'SonarQube server URL')
  .option('--token <token>', 'SonarQube authentication token')
  .option('--organization <org>', 'SonarQube organization (for SonarCloud)')
  .action(async (flags: ConnectionFlags) => {
    try {
      const config = resolveConfig(flags);
      initLogger(config.logging);
      const conn = toConnection(config);

      const status = await getSystemStatus(conn);
      logger.info(`Connected to SonarQube ${status.version ?? ''} (${status.status})`);

      const { projects } = await listProjects(conn, { pageSize: 5 });
      logger.info(
        `Token can access ${projects.length > 0 ? `${projects.length}+` : '0'} project(s)`,
      );
      if (projects.length === 0) {
        logger.warn('No projects visible — check token permissions or organization.');
      }
    } catch (error) {
      console.error('Validation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Create a configuration file interactively')
  .option(
    '--global',
    'Write config to ~/.sonarqube-exporter.json (token always goes to ~/.sonarqube-exporter.env)',
  )
  .action(async (options: { global?: boolean }) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (prompt: string): Promise<string> =>
      new Promise((resolve) => rl.question(prompt, resolve));

    /** Read a secret without echoing characters to the terminal. */
    const askSecret = (prompt: string): Promise<string> =>
      new Promise((resolve) => {
        process.stdout.write(prompt);
        let value = '';
        const onData = (char: Buffer): void => {
          const c = char.toString('utf8');
          if (c === '\r' || c === '\n') {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', onData);
            process.stdout.write('\n');
            resolve(value);
          } else if (c === '') {
            process.stdout.write('\n');
            process.exit(1);
          } else if (c === '') {
            if (value.length > 0) {
              value = value.slice(0, -1);
              process.stdout.write('\b \b');
            }
          } else {
            value += c;
            process.stdout.write('*');
          }
        };
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', onData);
      });

    try {
      console.log('\nSonarQube Dashboard — Setup\n');
      const url = (await ask('SonarQube Server URL (e.g. https://sonarcloud.io): ')).trim();
      const token = (await askSecret('SonarQube Token (hidden): ')).trim();
      const organization = (await ask('Organization (optional, SonarCloud): ')).trim();
      const defaultProjectKey = (await ask('Default project key (optional): ')).trim();

      const home = process.env['HOME'] || '.';
      const credPath = join(home, '.sonarqube-exporter.env');

      // Write token to the home-directory env file — never in the JSON config.
      const existingCreds = existsSync(credPath) ? readFileSync(credPath, 'utf-8') : '';
      const updatedCreds =
        existingCreds
          .split('\n')
          .filter((l) => !l.startsWith('SONARQUBE_TOKEN=') && !l.startsWith('SONARQUBE_URL='))
          .concat([`SONARQUBE_URL=${url}`, `SONARQUBE_TOKEN=${token}`])
          .join('\n')
          .trim() + '\n';
      writeFileSync(credPath, updatedCreds, { mode: 0o600 });

      // Write everything else (no token) to the JSON config.
      const configBody = {
        sonarqube: {
          ...(organization && { organization }),
          ...(defaultProjectKey && { defaultProjectKey }),
        },
        server: { port: 7010, host: '127.0.0.1', open: true, auth: false, allowWrite: false },
        logging: { level: 'info' },
      };

      const configPath = options.global
        ? join(home, '.sonarqube-exporter.json')
        : '.sonarqube-exporter.json';

      writeFileSync(configPath, JSON.stringify(configBody, null, 2));

      console.log('\n  ✓ Credentials saved to:  ' + credPath + '  (chmod 600, token not in JSON)');
      console.log('  ✓ Config saved to:        ' + configPath);
      console.log('\n  Next: run `sonarqube-exporter serve`\n');
    } catch (error) {
      console.error('Setup failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      rl.close();
    }
  });

interface ExportPdfFlags extends ConnectionFlags {
  project: string;
  branch?: string;
  pullRequest?: string;
  output?: string;
}

program
  .command('export-pdf')
  .description('Render a project report to a PDF file (headless — for CI)')
  .requiredOption('--project <key>', 'Project key')
  .option('--branch <name>', 'Branch name')
  .option('--pull-request <key>', 'Pull request key')
  .option('-o, --output <file>', 'Output PDF path')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--url <url>', 'SonarQube server URL')
  .option('--token <token>', 'SonarQube authentication token')
  .option('--organization <org>', 'SonarQube organization (for SonarCloud)')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (flags: ExportPdfFlags) => {
    let running: Awaited<ReturnType<typeof startServer>> | null = null;
    try {
      const config = resolveConfig(flags);
      initLogger(config.logging);

      const status = await getSystemStatus(toConnection(config)).catch(() => null);
      if (!status) {
        console.error('Could not reach SonarQube. Check --url/--token.');
        process.exit(1);
      }

      running = await startServer({ config });
      const pdf = await renderReportPdf({
        port: running.port,
        host: running.host,
        projectKey: flags.project,
        ...(flags.branch && { branch: flags.branch }),
        ...(flags.pullRequest && { pullRequest: flags.pullRequest }),
      });

      const output = flags.output ?? `${flags.project}-report.pdf`;
      writeFileSync(output, pdf);
      console.log(`PDF written to ${output}`);
    } catch (error) {
      if (error instanceof PdfUnavailableError) {
        console.error(error.message);
      } else {
        console.error('PDF export failed:', error instanceof Error ? error.message : error);
      }
      process.exitCode = 1;
    } finally {
      if (running) await running.close();
    }
  });

interface ScanFlags extends ConnectionFlags {
  project?: string;
  branch?: string;
}

program
  .command('scan')
  .description('Run a SonarQube scan on the current directory and wait for results to be processed')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--url <url>', 'SonarQube server URL')
  .option('--token <token>', 'SonarQube authentication token')
  .option('--organization <org>', 'SonarQube organization (for SonarCloud)')
  .option('--project <key>', 'Project key (defaults to configured defaultProjectKey)')
  .option('--branch <name>', 'Branch name (defaults to current git branch)')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (flags: ScanFlags) => {
    try {
      const config = resolveConfig(flags);
      initLogger(config.logging);

      const projectKey = flags.project ?? config.sonarqube.defaultProjectKey;
      if (!projectKey) {
        console.error(
          'No project key. Pass --project <key> or set defaultProjectKey in your config.',
        );
        process.exit(1);
      }

      console.log(`\n  ◆ Starting SonarQube scan`);
      console.log(`  ➜ Project: ${projectKey}`);
      console.log(`  ➜ Directory: ${process.cwd()}`);
      console.log('');

      await startScan({
        projectKey,
        cwd: process.cwd(),
        serverUrl: config.sonarqube.url,
        token: config.sonarqube.token,
        ...(flags.branch && { branch: flags.branch }),
      });

      // Poll until the scan finishes, printing new log lines as they arrive.
      let lastLen = 0;
      const poll = (): Promise<void> =>
        new Promise((resolve) => {
          const tick = (): void => {
            const state = getScanState();
            const newLines = state.logs.slice(lastLen);
            for (const line of newLines) process.stdout.write(line + '\n');
            lastLen = state.logs.length;

            if (state.phase === 'success' || state.phase === 'error') {
              process.exitCode = state.phase === 'error' ? 1 : 0;
              resolve();
            } else {
              setTimeout(tick, 800);
            }
          };
          tick();
        });

      await poll();
      console.log('');
    } catch (error) {
      console.error('Scan failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// The v3 `export` command was removed in v4 — guide users to the new workflow.
program
  .command('export', { hidden: true })
  .allowUnknownOption(true)
  .action(() => {
    console.error(
      'The `export` command was removed in v4.\n' +
        '  • For an interactive dashboard:  sonarqube-exporter serve\n' +
        '  • For a PDF report (CI/headless): sonarqube-exporter export-pdf --project <key>\n' +
        'See MIGRATION.md for details.',
    );
    process.exit(1);
  });

program.parse();
