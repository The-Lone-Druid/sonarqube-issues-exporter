#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';
import { loadConfig } from './config';
import { initLogger, logger } from './utils';
import { exportSonarQubeIssues, validateSonarQubeConnection } from './index';
import type {
  AppConfig,
  SonarQubeConfig,
  ExportConfig,
  ExportCommandOptions,
  ValidateCommandOptions,
} from './types';

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

function buildSonarQubeOverrides(
  options: ExportCommandOptions | ValidateCommandOptions,
): Partial<SonarQubeConfig> {
  const overrides: Partial<SonarQubeConfig> = {};
  if (options.url) overrides.url = options.url;
  if (options.token) overrides.token = options.token;
  if (options.project) overrides.projectKey = options.project;
  if (options.organization) overrides.organization = options.organization;
  return overrides;
}

function buildExportOverrides(options: ExportCommandOptions): Partial<ExportConfig> {
  const overrides: Partial<ExportConfig> = {};
  if (options.output) overrides.outputPath = options.output;
  if (options.filename) overrides.filename = options.filename;
  if (options.template) overrides.template = options.template;
  if (parseInt(options.maxIssues, 10) !== 10000) {
    overrides.maxIssues = parseInt(options.maxIssues, 10);
  }
  if (options.includeResolved) overrides.includeResolvedIssues = options.includeResolved;
  if (options.excludeStatuses !== 'CLOSED') {
    overrides.excludeStatuses = options.excludeStatuses.split(',');
  }
  return overrides;
}

function buildConfigOverrides(options: ExportCommandOptions): Partial<AppConfig> | undefined {
  const sonarqube = buildSonarQubeOverrides(options);
  const exportOv = buildExportOverrides(options);
  const overrides: Partial<AppConfig> = {};

  if (Object.keys(sonarqube).length > 0) overrides.sonarqube = sonarqube as SonarQubeConfig;
  if (Object.keys(exportOv).length > 0) overrides.export = exportOv as ExportConfig;
  if (options.verbose) overrides.logging = { level: 'debug' as const };

  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

const program = new Command();

program
  .name('sonarqube-exporter')
  .description('Export SonarQube issues to HTML reports')
  .version(packageJson.version);

program
  .command('export')
  .description('Export SonarQube issues to HTML report')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--url <url>', 'SonarQube server URL')
  .option('--token <token>', 'SonarQube authentication token')
  .option('--project <key>', 'SonarQube project key')
  .option('--organization <org>', 'SonarQube organization (for SonarCloud)')
  .option('-o, --output <path>', 'Output directory path')
  .option('-f, --filename <name>', 'Output filename')
  .option('--template <name>', 'Template: "default" or "enhanced"', 'default')
  .option('--max-issues <number>', 'Maximum number of issues to fetch', '10000')
  .option('--include-resolved', 'Include resolved issues in the report')
  .option('--exclude-statuses <statuses>', 'Comma-separated statuses to exclude', 'CLOSED')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options: ExportCommandOptions) => {
    try {
      const configOverrides = buildConfigOverrides(options);
      const config = loadConfig({
        ...(options.config != null && { configPath: options.config }),
        ...(configOverrides && { overrides: configOverrides }),
      });

      initLogger(config.logging);
      logger.info('Starting SonarQube issues export...');

      let lastLoggedPercentage = 0;
      const result = await exportSonarQubeIssues(config, {
        onProgress: (current, total) => {
          const pct = Math.round((current / total) * 100);
          if (pct >= lastLoggedPercentage + 10 || pct === 100) {
            logger.info(`Progress: ${current}/${total} issues (${pct}%)`);
            lastLoggedPercentage = pct;
          }
        },
        validateConnection: true,
        logProjectInfo: true,
      });

      if (result.success) {
        logger.info('Report generated successfully!');
      } else {
        logger.error(`Failed to generate report: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Export failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate SonarQube connection and configuration')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--url <url>', 'SonarQube server URL')
  .option('--token <token>', 'SonarQube authentication token')
  .option('--project <key>', 'SonarQube project key')
  .option('--organization <org>', 'SonarQube organization (for SonarCloud)')
  .action(async (options: ValidateCommandOptions) => {
    try {
      const sonarqube = buildSonarQubeOverrides(options);
      const overrides =
        Object.keys(sonarqube).length > 0 ? { sonarqube: sonarqube as SonarQubeConfig } : undefined;

      const config = loadConfig({
        ...(options.config != null && { configPath: options.config }),
        ...(overrides && { overrides }),
      });

      initLogger(config.logging);
      const isValid = await validateSonarQubeConnection(config);

      if (!isValid) process.exit(1);
    } catch (error) {
      console.error('Validation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Setup configuration interactively')
  .option('--global', 'Create global configuration file')
  .action(async (options: { global?: boolean }) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (prompt: string): Promise<string> =>
      new Promise((resolve) => rl.question(prompt, resolve));

    try {
      console.log('\nSonarQube Issues Exporter Setup\n');

      const url = (await ask('SonarQube Server URL (e.g., https://sonarcloud.io): ')).trim();
      const token = (await ask('SonarQube Token: ')).trim();
      const projectKey = (await ask('Project Key: ')).trim();
      const organization = (await ask('Organization (optional, for SonarCloud): ')).trim();

      const configContent = JSON.stringify(
        {
          sonarqube: {
            url,
            token,
            projectKey,
            ...(organization && { organization }),
          },
          export: {
            outputPath: './reports',
            filename: 'sonarqube-issues-report.html',
            excludeStatuses: ['CLOSED'],
            includeResolvedIssues: false,
            maxIssues: 10000,
            template: 'default',
          },
          logging: { level: 'info' },
        },
        null,
        2,
      );

      const configPath = options.global
        ? join(process.env['HOME'] || '.', '.sonarqube-exporter.json')
        : '.sonarqube-exporter.json';

      writeFileSync(configPath, configContent);
      console.log(`\nConfiguration saved to: ${configPath}`);
      console.log('\nYou can now run:');
      console.log('  sonarqube-exporter export');
      console.log('  sonarqube-exporter validate');
    } catch (error) {
      console.error('Setup failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      rl.close();
    }
  });

if (process.argv.length === 2) {
  program.help();
} else {
  program.parse();
}
