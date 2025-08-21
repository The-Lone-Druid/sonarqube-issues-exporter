import { AppConfig } from './types/config';
import type { ExporterResult } from './types/report';
import type { ProgressCallback, ExportOptions } from './types/core';

export { SonarQubeService } from './services';
export { HtmlExporter } from './exporters';
export { loadConfig, AppConfig } from './config';
export { initLogger, getLogger } from './utils';
export * from './types';

// Re-export core types for convenience
export type { ProgressCallback, ExportOptions };

// Core export function for programmatic use
export async function exportSonarQubeIssues(
  config: AppConfig,
  options: ExportOptions = {}
): Promise<ExporterResult> {
  const { SonarQubeService } = await import('./services');
  const { HtmlExporter } = await import('./exporters');
  const { initLogger, getLogger } = await import('./utils');

  // Initialize logger
  initLogger(config.logging);
  const logger = getLogger();

  try {
    // Initialize services
    const sonarQubeService = new SonarQubeService(config.sonarqube);
    const htmlExporter = new HtmlExporter(config);

    // Validate connection if requested (default: true)
    if (options.validateConnection !== false) {
      logger.info('Validating SonarQube connection...');
      const isConnected = await sonarQubeService.validateConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to SonarQube. Please check your configuration.');
      }
    }

    // Fetch and log project info if requested
    if (options.logProjectInfo) {
      const projectInfo = await sonarQubeService.getProjectInfo();
      if (projectInfo) {
        logger.info(`Project found: ${projectInfo.name}`);
      }
    }

    // Fetch issues with optional progress reporting
    logger.info('Fetching issues from SonarQube...');
    const fetchOptions: any = {
      maxIssues: config.export.maxIssues,
      excludeStatuses: config.export.excludeStatuses,
      includeResolvedIssues: config.export.includeResolvedIssues,
    };

    // Only add onProgress if it's defined
    if (options.onProgress) {
      fetchOptions.onProgress = options.onProgress;
    }

    const issues = await sonarQubeService.fetchAllIssues(fetchOptions);

    if (issues.length === 0) {
      logger.warn('No issues found. Check your project key or run a new analysis.');
      return {
        success: true,
        issuesCount: 0,
        outputPath: '',
        metrics: {
          total: 0,
          severities: {},
          types: {},
          statuses: {},
          components: {},
          rules: {},
        },
      };
    }

    // Export to HTML
    logger.info('Generating HTML report...');
    const result = await htmlExporter.export(issues, {
      outputPath: config.export.outputPath,
      filename: config.export.filename,
      template: config.export.template,
    });

    return result;
  } catch (error) {
    logger.error('Export failed:', error);
    throw error;
  }
}

// Validation function for checking SonarQube connection and configuration
export async function validateSonarQubeConnection(config: AppConfig): Promise<boolean> {
  const { SonarQubeService } = await import('./services');
  const { initLogger, getLogger } = await import('./utils');

  initLogger(config.logging);
  const logger = getLogger();

  try {
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
      return true;
    } else {
      logger.error('❌ SonarQube connection failed');
      return false;
    }
  } catch (error) {
    logger.error('❌ Validation failed:', error);
    return false;
  }
}

// Development mode - run a demo export if executed directly
async function runDevelopmentDemo() {
  const { loadConfig } = await import('./config');
  const { initLogger, getLogger } = await import('./utils');

  console.log('🚀 SonarQube Issues Exporter - Development Mode');
  console.log('================================================');

  try {
    // Load configuration
    const config = loadConfig();

    // Initialize logger
    initLogger(config.logging);
    const logger = getLogger();

    logger.info('🔧 Development mode started');
    logger.info('📋 Configuration loaded successfully');
    logger.info(`🔗 SonarQube URL: ${config.sonarqube.url}`);
    logger.info(`📦 Project Key: ${config.sonarqube.projectKey}`);
    logger.info(`📄 Output: ${config.export.outputPath}/${config.export.filename}`);

    // Check if we have minimum required configuration
    if (!config.sonarqube.token) {
      logger.warn('⚠️  No SonarQube token found. Set SONARQUBE_TOKEN environment variable.');
      logger.info('💡 Example: export SONARQUBE_TOKEN=your_token_here');
      return;
    }

    if (!config.sonarqube.projectKey) {
      logger.warn('⚠️  No project key found. Set SONARQUBE_PROJECT_KEY environment variable.');
      logger.info('💡 Example: export SONARQUBE_PROJECT_KEY=my-project');
      return;
    }

    logger.info('🎯 Starting demo export...');

    // Use the library function with progress reporting
    const result = await exportSonarQubeIssues(config, {
      onProgress: (current, total) => {
        const percentage = Math.round((current / total) * 100);
        if (percentage % 25 === 0 || percentage === 100) {
          logger.info(`📊 Progress: ${current}/${total} issues (${percentage}%)`);
        }
      },
      validateConnection: true,
      logProjectInfo: true,
    });

    if (result.success) {
      logger.info('✅ Demo export completed successfully!');
      logger.info(`📊 Exported ${result.issuesCount} issues`);
      logger.info(`📁 Report saved to: ${result.outputPath}`);
    } else {
      logger.error('❌ Demo export failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Development demo failed:', error);
    console.log('\n💡 Tips:');
    console.log('  - Make sure your SonarQube server is running');
    console.log(
      '  - Check your environment variables (SONARQUBE_URL, SONARQUBE_TOKEN, SONARQUBE_PROJECT_KEY)'
    );
    console.log('  - Use "npm run export -- --help" for CLI options');
  }
}

// Check if this file is being run directly (not imported)
if (require.main === module) {
  runDevelopmentDemo().catch(console.error);
}
