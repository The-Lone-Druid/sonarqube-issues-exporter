import type { AppConfig, ExportOptions, ExporterResult, FetchIssuesOptions } from './types';
import { fetchAllIssues, validateConnection, getProjectInfo } from './services';
import { exportToHtml } from './exporters';
import { initLogger, logger } from './utils';

export { loadConfig } from './config';
export { fetchAllIssues, validateConnection, getProjectInfo } from './services';
export { exportToHtml } from './exporters';
export { initLogger, logger } from './utils';
export type * from './types';

export async function exportSonarQubeIssues(
  config: AppConfig,
  options: ExportOptions = {},
): Promise<ExporterResult> {
  initLogger(config.logging);

  try {
    if (options.validateConnection !== false) {
      logger.info('Validating SonarQube connection...');
      const isConnected = await validateConnection(config.sonarqube);
      if (!isConnected) {
        throw new Error('Failed to connect to SonarQube. Please check your configuration.');
      }
    }

    if (options.logProjectInfo) {
      const projectInfo = await getProjectInfo(config.sonarqube);
      if (projectInfo) {
        logger.info(`Project found: ${projectInfo.name}`);
      }
    }

    logger.info('Fetching issues from SonarQube...');
    const fetchOptions: FetchIssuesOptions = {
      maxIssues: config.export.maxIssues,
      excludeStatuses: config.export.excludeStatuses,
      includeResolvedIssues: config.export.includeResolvedIssues,
      ...(options.onProgress && { onProgress: options.onProgress }),
    };

    const issues = await fetchAllIssues(config.sonarqube, fetchOptions);

    if (issues.length === 0) {
      logger.warn('No issues found. Check your project key or run a new analysis.');
      return {
        success: true,
        issuesCount: 0,
        outputPath: '',
        metrics: { total: 0, severities: {}, types: {}, statuses: {}, components: {}, rules: {} },
      };
    }

    logger.info('Generating HTML report...');
    return await exportToHtml(config, issues);
  } catch (error) {
    logger.error('Export failed:', error);
    throw error;
  }
}

export async function validateSonarQubeConnection(config: AppConfig): Promise<boolean> {
  initLogger(config.logging);

  try {
    logger.info('Testing SonarQube connection...');
    const isConnected = await validateConnection(config.sonarqube);

    if (isConnected) {
      logger.info('SonarQube connection successful');
      const projectInfo = await getProjectInfo(config.sonarqube);
      if (projectInfo) {
        logger.info(`Project found: ${projectInfo.name} (${projectInfo.key})`);
      } else {
        logger.warn('Project not found or no access');
      }
      return true;
    }

    logger.error('SonarQube connection failed');
    return false;
  } catch (error) {
    logger.error('Validation failed:', error);
    return false;
  }
}
