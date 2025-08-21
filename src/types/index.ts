/**
 * @fileoverview Main type definitions index for the SonarQube Issues Exporter
 *
 * This module serves as the central export point for all TypeScript type definitions
 * used throughout the application. It re-exports types from specialized modules
 * to provide a clean and organized API for type consumption.
 *
 * @author SonarQube Issues Exporter Team
 * @version 2.0.0
 */

// Core domain types
export * from './sonarqube';
export * from './report';
export * from './core';

// Configuration types
export * from './config';

// CLI types
export * from './cli';

// Service layer types
export * from './service';

// Exporter types
export * from './exporter';

// Utility types
export * from './utils';

/**
 * Re-export commonly used types for convenience
 */

// Most commonly used SonarQube types
export type {
  SonarQubeIssue,
  IssueSeverity,
  IssueStatus,
  IssueType,
  SonarQubeSearchResponse,
  QualityGateCondition,
  QualityGateStatus,
  ProjectMeasures,
  SecurityHotspot,
  SecurityHotspotsData,
} from './sonarqube';

// Most commonly used configuration types
export type { AppConfig, SonarQubeConfig, ExportConfig, LoggingConfig } from './config';

// Most commonly used CLI types
export type { ExportCommandOptions, ValidateCommandOptions, CLICommandOptions } from './cli';

// Most commonly used service types
export type { FetchIssuesOptions, ServiceResult, ConnectionValidationResult } from './service';

// Most commonly used exporter types
export type { HtmlExporterOptions, ExportFormat, ExportContext } from './exporter';

// Most commonly used report types
export type {
  ProcessedIssue,
  ReportMetrics,
  ReportMetadata,
  ExporterResult,
  TemplateData,
} from './report';

// Most commonly used utility types
export type { Result, LogLevel, LoggerConfig, ValidationResult, Pagination } from './utils';

// Most commonly used core types
export type { ProgressCallback, ExportOptions, ValidationOptions } from './core';
