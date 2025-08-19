/**
 * @fileoverview Configuration type definitions for the SonarQube Issues Exporter
 *
 * This module contains all TypeScript interfaces and types related to application
 * configuration, including validation schemas and configuration options.
 *
 * @author SonarQube Issues Exporter Team
 * @version 2.0.0
 */

import { z } from 'zod';
import { LogLevel } from './utils';

/**
 * Zod validation schema for the application configuration
 *
 * @const ConfigSchema
 * @description Validates the complete application configuration structure
 */
export const ConfigSchema = z.object({
  sonarqube: z.object({
    url: z.string().url('Invalid SonarQube URL'),
    token: z.string().min(1, 'SonarQube token is required'),
    projectKey: z.string().min(1, 'Project key is required'),
    organization: z.string().optional(),
  }),
  export: z.object({
    outputPath: z.string().default('./reports'),
    filename: z.string().default('sonarqube-issues-report.html'),
    excludeStatuses: z.array(z.string()).default(['CLOSED']),
    includeResolvedIssues: z.boolean().default(false),
    maxIssues: z.number().positive().default(10000),
    template: z.string().default('default'),
  }),
  logging: z
    .object({
      level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
      file: z.string().optional(),
    })
    .default({}),
});

/**
 * Main application configuration interface
 *
 * @interface AppConfig
 * @description Complete configuration structure for the application
 */
export interface AppConfig {
  /** SonarQube server connection configuration */
  sonarqube: SonarQubeConfig;

  /** Export operation configuration */
  export: ExportConfig;

  /** Logging system configuration */
  logging: LoggingConfig;
}

/**
 * SonarQube connection configuration
 *
 * @interface SonarQubeConfig
 * @description Configuration for connecting to SonarQube server
 */
export interface SonarQubeConfig {
  /** SonarQube server URL */
  url: string;

  /** Authentication token for SonarQube API */
  token: string;

  /** Project key to analyze */
  projectKey: string;

  /** Organization key (required for SonarCloud) */
  organization?: string;
}

/**
 * Export operation configuration
 *
 * @interface ExportConfig
 * @description Configuration for export operations
 */
export interface ExportConfig {
  /** Output directory path for generated reports */
  outputPath: string;

  /** Output filename for the generated report */
  filename: string;

  /** Array of issue statuses to exclude from export */
  excludeStatuses: string[];

  /** Whether to include resolved issues in the export */
  includeResolvedIssues: boolean;

  /** Maximum number of issues to fetch and export */
  maxIssues: number;

  /** Template name to use for report generation */
  template: string;
}

/**
 * Logging system configuration
 *
 * @interface LoggingConfig
 * @description Configuration for the logging system
 */
export interface LoggingConfig {
  /** Minimum log level to output */
  level: LogLevel | 'error' | 'warn' | 'info' | 'debug';

  /** Optional log file path */
  file?: string;
}

/**
 * Configuration loading options
 *
 * @interface ConfigLoadOptions
 * @description Options for loading and parsing configuration
 */
export interface ConfigLoadOptions {
  /** Path to configuration file */
  configPath?: string | undefined;

  /** Configuration overrides to apply */
  overrides?: Partial<AppConfig>;

  /** Whether to validate configuration strictly */
  strict?: boolean;

  /** Whether to merge with environment variables */
  mergeEnv?: boolean;
}

/**
 * Configuration validation result
 *
 * @interface ConfigValidationResult
 * @description Result of configuration validation
 */
export interface ConfigValidationResult {
  /** Whether configuration is valid */
  isValid: boolean;

  /** Validated configuration (if valid) */
  config?: AppConfig;

  /** Validation errors */
  errors: ConfigValidationError[];

  /** Validation warnings */
  warnings: ConfigValidationWarning[];
}

/**
 * Configuration validation error
 *
 * @interface ConfigValidationError
 * @description Represents a configuration validation error
 */
export interface ConfigValidationError {
  /** Configuration path that failed validation */
  path: string;

  /** Error message */
  message: string;

  /** Expected value or format */
  expected?: string;

  /** Actual value that failed validation */
  actual?: any;
}

/**
 * Configuration validation warning
 *
 * @interface ConfigValidationWarning
 * @description Represents a configuration validation warning
 */
export interface ConfigValidationWarning {
  /** Configuration path that triggered warning */
  path: string;

  /** Warning message */
  message: string;

  /** Suggested value or action */
  suggestion?: string;
}

/**
 * Environment variable mapping
 *
 * @interface EnvironmentVariables
 * @description Maps environment variables to configuration paths
 */
export interface EnvironmentVariables {
  /** SonarQube server URL */
  SONARQUBE_URL?: string;

  /** SonarQube authentication token */
  SONARQUBE_TOKEN?: string;

  /** SonarQube project key */
  SONARQUBE_PROJECT_KEY?: string;

  /** SonarQube organization key */
  SONARQUBE_ORGANIZATION?: string;

  /** Export output path */
  EXPORT_OUTPUT_PATH?: string;

  /** Export filename */
  EXPORT_FILENAME?: string;

  /** Logging level */
  LOG_LEVEL?: string;

  /** Log file path */
  LOG_FILE?: string;
}

/**
 * Type alias for the inferred configuration type from Zod schema
 *
 * @type Config
 * @description Type inferred from the ConfigSchema for type safety
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Export options interface (legacy - kept for backward compatibility)
 *
 * @interface ExportOptions
 * @deprecated Use ExportConfig instead
 * @description Legacy export options interface
 */
export interface ExportOptions {
  /** Output directory path */
  outputPath?: string;

  /** Output filename */
  filename?: string;

  /** Template name */
  template?: string;

  /** Include resolved issues */
  includeResolvedIssues?: boolean;

  /** Maximum issues to fetch */
  maxIssues?: number;

  /** Enable verbose output */
  verbose?: boolean;
}
