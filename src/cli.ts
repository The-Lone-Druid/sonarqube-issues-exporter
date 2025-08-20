#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from './config';
import { initLogger, getLogger } from './utils';
import { SonarQubeService } from './services';
import { HtmlExporter } from './exporters';
import type { ExportCommandOptions, ValidateCommandOptions } from './types';
import type { AppConfig, SonarQubeConfig, ExportConfig } from './types/config';
import type { ExporterResult } from './types/report';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

// Read package version
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Helper function to build configuration overrides for validate command
function buildValidateConfigOverrides(
  options: ValidateCommandOptions
): Partial<AppConfig> | undefined {
  const sonarQubeOverrides = buildSonarQubeOverrides(options);
  return Object.keys(sonarQubeOverrides).length > 0
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { sonarqube: sonarQubeOverrides as any }
    : undefined;
}

// Helper function to create configuration file content
function createConfigFileContent(sonarQubeConfig: SonarQubeConfig): string {
  return JSON.stringify(
    {
      sonarqube: {
        url: sonarQubeConfig.url,
        token: sonarQubeConfig.token,
        projectKey: sonarQubeConfig.projectKey,
        ...(sonarQubeConfig.organization && { organization: sonarQubeConfig.organization }),
      },
      export: {
        outputPath: './reports',
        filename: 'sonarqube-issues-report.html',
        excludeStatuses: ['CLOSED'],
        includeResolvedIssues: false,
        maxIssues: 10000,
        template: 'default',
      },
      logging: {
        level: 'info',
      },
    },
    null,
    2
  );
}
// Helper function to build SonarQube configuration overrides
function buildSonarQubeOverrides(
  options: ExportCommandOptions | ValidateCommandOptions
): Partial<SonarQubeConfig> {
  if (!options.url && !options.token && !options.project && !options.organization) {
    return {};
  }

  const sonarQubeOverrides: Partial<SonarQubeConfig> = {};
  if (options.url) sonarQubeOverrides.url = options.url;
  if (options.token) sonarQubeOverrides.token = options.token;
  if (options.project) sonarQubeOverrides.projectKey = options.project;
  if (options.organization) sonarQubeOverrides.organization = options.organization;

  return sonarQubeOverrides;
}

// Helper function to build export configuration overrides
function buildExportOverrides(options: ExportCommandOptions): Partial<ExportConfig> {
  const hasExportOptions =
    options.output ||
    options.filename ||
    options.template ||
    options.includeResolved !== undefined ||
    options.excludeStatuses !== 'CLOSED' ||
    parseInt(options.maxIssues, 10) !== 10000;

  if (!hasExportOptions) {
    return {};
  }

  const exportOverrides: Partial<ExportConfig> = {};
  if (options.output) exportOverrides.outputPath = options.output;
  if (options.filename) exportOverrides.filename = options.filename;
  if (options.template) exportOverrides.template = options.template;
  if (parseInt(options.maxIssues, 10) !== 10000) {
    exportOverrides.maxIssues = parseInt(options.maxIssues, 10);
  }
  if (options.includeResolved) {
    exportOverrides.includeResolvedIssues = options.includeResolved;
  }
  if (options.excludeStatuses !== 'CLOSED') {
    exportOverrides.excludeStatuses = options.excludeStatuses.split(',');
  }

  return exportOverrides;
}

// Helper function to build configuration overrides
function buildConfigOverrides(options: ExportCommandOptions): Partial<AppConfig> | undefined {
  const sonarQubeOverrides = buildSonarQubeOverrides(options);
  const exportOverrides = buildExportOverrides(options);

  const configOverrides: Partial<AppConfig> = {};

  if (Object.keys(sonarQubeOverrides).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configOverrides.sonarqube = sonarQubeOverrides as any;
  }

  if (Object.keys(exportOverrides).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configOverrides.export = exportOverrides as any;
  }

  if (options.verbose) {
    configOverrides.logging = { level: 'debug' as const };
  }

  return Object.keys(configOverrides).length > 0 ? configOverrides : undefined;
}

// Helper function to log export results
function logExportResults(logger: ReturnType<typeof getLogger>, result: ExporterResult): void {
  if (result.success) {
    logger.info(`✅ Report generated successfully!`);
    logger.info(`📄 File: ${result.outputPath}`);
    logger.info(`🔢 Issues: ${result.issuesCount}`);
    logger.info(
      `📊 Critical: ${(result.metrics.severities.BLOCKER || 0) + (result.metrics.severities.CRITICAL || 0)}`
    );
    logger.info(`🐛 Bugs: ${result.metrics.types.BUG || 0}`);
    logger.info(`🔓 Vulnerabilities: ${result.metrics.types.VULNERABILITY || 0}`);
  } else {
    logger.error(`❌ Failed to generate report: ${result.error}`);
    process.exit(1);
  }
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
  .option(
    '--template <name>',
    'Template: "default" (classic table view) or "enhanced" (interactive dashboard with charts)',
    'default'
  )
  .option('--max-issues <number>', 'Maximum number of issues to fetch', '10000')
  .option('--include-resolved', 'Include resolved issues in the report')
  .option('--exclude-statuses <statuses>', 'Comma-separated list of statuses to exclude', 'CLOSED')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options: ExportCommandOptions) => {
    try {
      // Load configuration
      const configOverrides = buildConfigOverrides(options);
      const config = loadConfig({
        configPath: options.config,
        ...(configOverrides && { overrides: configOverrides }),
      });

      // Initialize logger
      initLogger(config.logging);
      const logger = getLogger();

      logger.info('Starting SonarQube issues export...');
      logger.debug('Configuration:', config);

      // Initialize services
      const sonarQubeService = new SonarQubeService(config.sonarqube);
      const htmlExporter = new HtmlExporter(config);

      // Validate connection
      logger.info('Validating SonarQube connection...');
      const isConnected = await sonarQubeService.validateConnection();
      if (!isConnected) {
        logger.error('Failed to connect to SonarQube. Please check your configuration.');
        process.exit(1);
      }

      // Fetch project info
      const projectInfo = await sonarQubeService.getProjectInfo();
      if (projectInfo) {
        logger.info(`Project found: ${projectInfo.name}`);
      }

      // Fetch issues with progress reporting
      logger.info('Fetching issues from SonarQube...');
      const issues = await sonarQubeService.fetchAllIssues({
        maxIssues: config.export.maxIssues,
        excludeStatuses: config.export.excludeStatuses,
        includeResolvedIssues: config.export.includeResolvedIssues,
        onProgress: (current, total) => {
          const percentage = Math.round((current / total) * 100);
          logger.info(`Progress: ${current}/${total} issues (${percentage}%)`);
        },
      });

      if (issues.length === 0) {
        logger.warn('No issues found. Check your project key or run a new analysis.');
        return;
      }

      // Export to HTML
      logger.info('Generating HTML report...');
      const result = await htmlExporter.export(issues, {
        outputPath: config.export.outputPath,
        filename: config.export.filename,
        template: config.export.template,
      });

      // Log results
      logExportResults(logger, result);
    } catch (error) {
      console.error('❌ Export failed:', error);
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
      const configOverrides = buildValidateConfigOverrides(options);
      const config = loadConfig({
        configPath: options.config,
        ...(configOverrides && { overrides: configOverrides }),
      });
      initLogger(config.logging);
      const logger = getLogger();

      logger.info('Validating configuration...');

      const sonarQubeService = new SonarQubeService(config.sonarqube);

      logger.info('Testing SonarQube connection...');
      const isConnected = await sonarQubeService.validateConnection();

      if (isConnected) {
        logger.info('✅ SonarQube connection successful');

        const projectInfo = await sonarQubeService.getProjectInfo();
        if (projectInfo) {
          logger.info(`✅ Project found: ${projectInfo.name} (${projectInfo.key})`);
        } else {
          logger.warn('⚠️  Project not found or no access');
        }
      } else {
        logger.error('❌ SonarQube connection failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Setup configuration interactively')
  .option('--global', 'Create global configuration file')
  .action(async (options: { global?: boolean }) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    function question(prompt: string): Promise<string> {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    }

    try {
      console.log('\n🛠️  SonarQube Issues Exporter Setup\n');
      console.log('This will help you create a configuration file.\n');

      const url = await question('SonarQube Server URL (e.g., https://sonarcloud.io): ');
      const token = await question('SonarQube Token: ');
      const projectKey = await question('Project Key: ');
      const organization = await question('Organization (optional, for SonarCloud): ');

      const configContent = createConfigFileContent({
        url: url.trim(),
        token: token.trim(),
        projectKey: projectKey.trim(),
        ...(organization.trim() && { organization: organization.trim() }),
      });

      const configPath = options.global
        ? join(process.env.HOME || process.env.USERPROFILE || '.', '.sonarqube-exporter.json')
        : '.sonarqube-exporter.json';

      writeFileSync(configPath, configContent);

      console.log(`\n✅ Configuration saved to: ${configPath}`);
      console.log('\nYou can now run:');
      console.log('  sonarqube-exporter export');
      console.log('  sonarqube-exporter validate');
      console.log(
        '\n💡 You can also override settings using environment variables or CLI options.'
      );
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    } finally {
      rl.close();
    }
  });

// Parse command line arguments
if (process.argv.length === 2) {
  program.help();
} else {
  program.parse();
}
