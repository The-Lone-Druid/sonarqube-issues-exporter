/**
 * @fileoverview Core library type definitions for the SonarQube Issues Exporter
 *
 * This module contains TypeScript interfaces and types specifically for the
 * core library functionality, including export operations and progress callbacks.
 *
 * @author SonarQube Issues Exporter Team
 * @version 3.2.1
 */

/**
 * Progress callback function type for reporting export progress
 *
 * @param current - The current number of items processed
 * @param total - The total number of items to process
 * @param message - Optional progress message
 */
export type ProgressCallback = (current: number, total: number, message?: string) => void;

/**
 * Options for export operations in the core library
 *
 * @interface ExportOptions
 * @description Configuration options for controlling export behavior
 */
export interface ExportOptions {
  /** Optional progress callback to report fetching progress */
  onProgress?: ProgressCallback;

  /** Whether to validate SonarQube connection before export (default: true) */
  validateConnection?: boolean;

  /** Whether to log project information during export (default: false) */
  logProjectInfo?: boolean;
}

/**
 * Options for validation operations
 *
 * @interface ValidationOptions
 * @description Configuration options for validation operations
 */
export interface ValidationOptions {
  /** Whether to include detailed validation information */
  includeDetails?: boolean;

  /** Timeout for validation operations in milliseconds */
  timeout?: number;
}
