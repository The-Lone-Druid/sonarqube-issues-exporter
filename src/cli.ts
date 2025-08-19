#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from './config';
import { initLogger, getLogger } from './utils';
import { SonarQubeService } from './services';
import { HtmlExporter } from './exporters';
import type { ExportCommandOptions, ValidateCommandOptions } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read package version
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Helper function to build configuration overrides
function buildConfigOverrides(options: ExportCommandOptions): any {
  const configOverrides: any = {};

  if (
    options.output ||
    options.filename ||
    options.template !== 'default' ||
    options.includeResolved !== undefined ||
    options.excludeStatuses !== 'CLOSED' ||
    parseInt(options.maxIssues, 10) !== 10000
  ) {
    configOverrides.export = {};
    if (options.output) configOverrides.export.outputPath = options.output;
    if (options.filename) configOverrides.export.filename = options.filename;
    if (options.template !== 'default') configOverrides.export.template = options.template;
    if (parseInt(options.maxIssues, 10) !== 10000)
      configOverrides.export.maxIssues = parseInt(options.maxIssues, 10);
    if (options.includeResolved)
      configOverrides.export.includeResolvedIssues = options.includeResolved;
    if (options.excludeStatuses !== 'CLOSED') {
      configOverrides.export.excludeStatuses = options.excludeStatuses.split(',');
    }
  }

  if (options.verbose) {
    configOverrides.logging = { level: 'debug' };
  }

  return Object.keys(configOverrides).length > 0 ? configOverrides : undefined;
}

// Helper function to log export results
function logExportResults(logger: any, result: any): void {
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
  .option('-o, --output <path>', 'Output directory path')
  .option('-f, --filename <name>', 'Output filename')
  .option('--template <name>', 'Template name to use', 'default')
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
        overrides: configOverrides,
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
  .action(async (options: ValidateCommandOptions) => {
    try {
      const config = loadConfig(options.config ? { configPath: options.config } : {});
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

// Parse command line arguments
if (process.argv.length === 2) {
  program.help();
} else {
  program.parse();
}
