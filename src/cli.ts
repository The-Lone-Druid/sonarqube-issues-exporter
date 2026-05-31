#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as readline from 'node:readline';
import { loadConfig, toConnection } from './core/config';
import { initLogger, logger } from './core/logger';
import { getSystemStatus, listProjects } from './core/sonarqube/projects';
import type { DeepPartial, AppConfig } from './core/types';
import { openBrowser, startServer } from './server/server';

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
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (flags: ServeFlags) => {
    try {
      const config = resolveConfig(flags);
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
  .option('--global', 'Write to ~/.sonarqube-exporter.json')
  .action(async (options: { global?: boolean }) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (prompt: string): Promise<string> =>
      new Promise((resolve) => rl.question(prompt, resolve));

    try {
      console.log('\nSonarQube Dashboard — Setup\n');
      const url = (await ask('SonarQube Server URL (e.g. https://sonarcloud.io): ')).trim();
      const token = (await ask('SonarQube Token: ')).trim();
      const organization = (await ask('Organization (optional, SonarCloud): ')).trim();
      const defaultProjectKey = (await ask('Default project key (optional): ')).trim();

      const config = {
        sonarqube: {
          url,
          token,
          ...(organization && { organization }),
          ...(defaultProjectKey && { defaultProjectKey }),
        },
        server: { port: 7010, host: '127.0.0.1', open: true, auth: false },
        logging: { level: 'info' },
      };

      const configPath = options.global
        ? join(process.env['HOME'] || '.', '.sonarqube-exporter.json')
        : '.sonarqube-exporter.json';

      writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`\nConfiguration saved to: ${configPath}`);
      console.log('\nNext: run `sonarqube-exporter serve`');
    } catch (error) {
      console.error('Setup failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      rl.close();
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
