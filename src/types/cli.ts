/**
 * @fileoverview CLI-related type definitions for the SonarQube Issues Exporter
 *
 * This module contains all TypeScript interfaces and types related to the
 * command-line interface functionality, including command options and arguments.
 *
 * @author SonarQube Issues Exporter Team
 * @version 2.0.0
 */

/**
 * Options for the export command in the CLI
 *
 * @interface ExportCommandOptions
 * @description Configuration options available for the export command
 */
export interface ExportCommandOptions {
  /** Path to the configuration file */
  config?: string;

  /** Output directory path for the generated report */
  output?: string;

  /** Custom filename for the generated report */
  filename?: string;

  /** Template name to use for report generation (default: 'default') */
  template: string;

  /** Maximum number of issues to fetch as string (needs parsing) */
  maxIssues: string;

  /** Whether to include resolved issues in the report */
  includeResolved?: boolean;

  /** Comma-separated list of statuses to exclude from the report */
  excludeStatuses: string;

  /** Enable verbose logging output */
  verbose?: boolean;
}

/**
 * Options for the validate command in the CLI
 *
 * @interface ValidateCommandOptions
 * @description Configuration options available for the validate command
 */
export interface ValidateCommandOptions {
  /** Path to the configuration file to validate */
  config?: string;
}

/**
 * Base interface for all CLI command options
 *
 * @interface BaseCommandOptions
 * @description Common properties shared across all CLI commands
 */
export interface BaseCommandOptions {
  /** Path to the configuration file */
  config?: string;
}

/**
 * Union type for all possible CLI command options
 *
 * @type CLICommandOptions
 * @description Represents any valid CLI command options
 */
export type CLICommandOptions = ExportCommandOptions | ValidateCommandOptions;

/**
 * CLI command names enum
 *
 * @enum CLICommands
 * @description Available CLI commands
 */
export enum CLICommands {
  /** Export SonarQube issues to HTML report */
  EXPORT = 'export',

  /** Validate SonarQube connection and configuration */
  VALIDATE = 'validate',

  /** Display help information */
  HELP = 'help',
}
