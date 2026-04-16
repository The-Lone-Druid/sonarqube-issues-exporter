import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import type { AppConfig, ConfigLoadOptions } from '../types';

function loadEnvFile(filePath = '.env'): void {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) return;

  const content = readFileSync(resolved, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Don't overwrite existing env vars
    if (process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

function getDefaultConfig(): AppConfig {
  return {
    sonarqube: {
      url: process.env['SONARQUBE_URL'] || 'http://localhost:9000',
      token: process.env['SONARQUBE_TOKEN'] || '',
      projectKey: process.env['SONARQUBE_PROJECT_KEY'] || '',
      ...(process.env['SONARQUBE_ORGANIZATION'] && {
        organization: process.env['SONARQUBE_ORGANIZATION'],
      }),
    },
    export: {
      outputPath: process.env['EXPORT_OUTPUT_PATH'] || './reports',
      filename: process.env['EXPORT_FILENAME'] || 'sonarqube-issues-report.html',
      excludeStatuses: (process.env['EXPORT_EXCLUDE_STATUSES'] || 'CLOSED').split(','),
      includeResolvedIssues: process.env['EXPORT_INCLUDE_RESOLVED'] === 'true',
      maxIssues: parseInt(process.env['EXPORT_MAX_ISSUES'] || '10000', 10),
      template: process.env['EXPORT_TEMPLATE'] || 'default',
    },
    logging: {
      level: (process.env['LOG_LEVEL'] as AppConfig['logging']['level']) || 'info',
    },
  };
}

function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (!config.sonarqube.url) errors.push('SonarQube URL is required');
  if (!config.sonarqube.token) errors.push('SonarQube token is required');
  if (!config.sonarqube.projectKey) errors.push('SonarQube project key is required');

  try {
    new URL(config.sonarqube.url);
  } catch {
    errors.push('Invalid SonarQube URL format');
  }

  if (config.export.maxIssues <= 0) errors.push('Max issues must be a positive number');

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.join('\n')}\n\n` +
        'Set environment variables (SONARQUBE_URL, SONARQUBE_TOKEN, SONARQUBE_PROJECT_KEY)\n' +
        'or create a .sonarqube-exporter.json config file.\n' +
        'Run "sonarqube-exporter setup" for guided configuration.',
    );
  }
}

function loadConfigFile(configPath: string): Partial<AppConfig> {
  if (!existsSync(configPath)) return {};

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as Partial<AppConfig>;
  } catch (error) {
    throw new Error(`Failed to load config file: ${error}`);
  }
}

export function loadConfig(options: ConfigLoadOptions = {}): AppConfig {
  loadEnvFile();
  let config = getDefaultConfig();

  const configPaths = [
    options.configPath,
    '.sonarqube-exporter.json',
    'sonarqube-exporter.config.json',
    process.env['HOME'] ? join(process.env['HOME'], '.sonarqube-exporter.json') : null,
  ].filter(Boolean) as string[];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      const fileConfig = loadConfigFile(configPath);
      config = {
        ...config,
        ...fileConfig,
        sonarqube: { ...config.sonarqube, ...fileConfig.sonarqube },
        export: { ...config.export, ...fileConfig.export },
        logging: { ...config.logging, ...fileConfig.logging },
      };
      break;
    }
  }

  if (options.overrides) {
    config = {
      ...config,
      ...options.overrides,
      sonarqube: { ...config.sonarqube, ...options.overrides.sonarqube },
      export: { ...config.export, ...options.overrides.export },
      logging: { ...config.logging, ...options.overrides.logging },
    };
  }

  validateConfig(config);
  return config;
}
