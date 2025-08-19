/**
 * @fileoverview Configuration management for the SonarQube Issues Exporter
 *
 * This module provides configuration loading, validation, and management functionality.
 * It handles loading configuration from files, environment variables, and provides
 * proper defaults and validation.
 *
 * @author SonarQube Issues Exporter Team
 * @version 2.0.0
 */

import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { AppConfig, ConfigLoadOptions } from '../types/config';

// Re-export types for backward compatibility
export type { AppConfig, ConfigLoadOptions } from '../types/config';

// Load environment variables
config();

/**
 * Get default application configuration
 *
 * @function getDefaultConfig
 * @description Provides sensible defaults for all configuration options
 * Reads environment variables dynamically to support testing
 */
function getDefaultConfig(): AppConfig {
  return {
    sonarqube: {
      url: process.env.SONARQUBE_URL || 'http://localhost:9000',
      token: process.env.SONARQUBE_TOKEN || '',
      projectKey: process.env.SONARQUBE_PROJECT_KEY || '',
      ...(process.env.SONARQUBE_ORGANIZATION && {
        organization: process.env.SONARQUBE_ORGANIZATION,
      }),
    },
    export: {
      outputPath: process.env.EXPORT_OUTPUT_PATH || './reports',
      filename: process.env.EXPORT_FILENAME || 'sonarqube-issues-report.html',
      excludeStatuses: (process.env.EXPORT_EXCLUDE_STATUSES || 'CLOSED').split(','),
      includeResolvedIssues: process.env.EXPORT_INCLUDE_RESOLVED === 'true',
      maxIssues: parseInt(process.env.EXPORT_MAX_ISSUES || '10000', 10),
      template: process.env.EXPORT_TEMPLATE || 'default',
    },
    logging: {
      level: (process.env.LOG_LEVEL as AppConfig['logging']['level']) || 'info',
      ...(process.env.LOG_FILE && { file: process.env.LOG_FILE }),
    },
  };
}

function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (!config.sonarqube.url) {
    errors.push('SonarQube URL is required');
  }

  if (!config.sonarqube.token) {
    errors.push('SonarQube token is required');
  }

  if (!config.sonarqube.projectKey) {
    errors.push('SonarQube project key is required');
  }

  try {
    new URL(config.sonarqube.url);
  } catch {
    errors.push('Invalid SonarQube URL format');
  }

  if (config.export.maxIssues <= 0) {
    errors.push('Max issues must be a positive number');
  }

  if (errors.length > 0) {
    const configHelp = `
Configuration validation failed:
${errors.join('\n')}

💡 To fix this, you can:

1. Set environment variables:
   export SONARQUBE_URL="https://your-sonarqube-instance.com"
   export SONARQUBE_TOKEN="your-sonarqube-token"
   export SONARQUBE_PROJECT_KEY="your-project-key"

2. Create a .sonarqube-exporter.json file in your current directory:
   {
     "sonarqube": {
       "url": "https://your-sonarqube-instance.com",
       "token": "your-sonarqube-token",
       "projectKey": "your-project-key"
     }
   }

3. Use CLI options:
   sonarqube-exporter --url "https://your-sonarqube-instance.com" --token "your-token" --project "your-project"

4. Run the setup command for guided configuration:
   sonarqube-exporter setup

For more help, visit: https://github.com/The-Lone-Druid/sonarqube-issues-exporter#readme
`;
    throw new Error(configHelp);
  }
}

function loadConfigFile(configPath: string): Partial<AppConfig> {
  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load config file: ${error}`);
  }
}

/**
 * Load and validate application configuration
 *
 * @function loadConfig
 * @description Loads configuration from multiple sources and validates it
 * @param options Configuration loading options
 * @returns Validated application configuration
 */
export function loadConfig(options: ConfigLoadOptions = {}): AppConfig {
  let config = { ...getDefaultConfig() };

  // Look for config files in multiple locations
  const configPaths = [
    options.configPath,
    '.sonarqube-exporter.json',
    '.sonarqube-exporter.js',
    'sonarqube-exporter.config.json',
    process.env.HOME ? `${process.env.HOME}/.sonarqube-exporter.json` : null,
    process.env.USERPROFILE ? `${process.env.USERPROFILE}/.sonarqube-exporter.json` : null,
  ].filter(Boolean) as string[];

  // Load from the first available config file
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

  // Apply overrides
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

/**
 * Load configuration without validation (for CLI help and setup commands)
 */
export function loadConfigSafe(options: ConfigLoadOptions = {}): AppConfig {
  try {
    return loadConfig(options);
  } catch (error) {
    // Return default config without validation for CLI help
    // This allows the CLI to show help and setup commands even with invalid config
    console.debug('Configuration validation failed, using defaults for CLI help:', error);
    return { ...getDefaultConfig() };
  }
}

// Remove the automatic config loading at module level
// This was causing issues when the tool is used globally
// export const appConfig = loadConfig();
