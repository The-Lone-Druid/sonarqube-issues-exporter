import { AppConfig } from './types/config';

export { SonarQubeService } from './services';
export { HtmlExporter } from './exporters';
export { loadConfig, AppConfig } from './config';
export { initLogger, getLogger } from './utils';
export * from './types';

// Main export function for programmatic use
export async function exportSonarQubeIssues(config: AppConfig) {
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

    // Validate connection
    const isConnected = await sonarQubeService.validateConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to SonarQube');
    }

    // Fetch issues
    const issues = await sonarQubeService.fetchAllIssues({
      maxIssues: config.export.maxIssues,
      excludeStatuses: config.export.excludeStatuses,
      includeResolvedIssues: config.export.includeResolvedIssues,
    });

    // Export to HTML
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
    const result = await exportSonarQubeIssues(config);

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
