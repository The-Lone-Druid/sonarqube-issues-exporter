/**
 * @fileoverview Service-related type definitions for the SonarQube Issues Exporter
 *
 * This module contains all TypeScript interfaces and types related to service layer
 * functionality, including API service options, configurations, and responses.
 *
 * @author SonarQube Issues Exporter Team
 * @version 2.0.0
 */

/**
 * Options for fetching issues from SonarQube API
 *
 * @interface FetchIssuesOptions
 * @description Configuration options for controlling how issues are fetched from SonarQube
 */
export interface FetchIssuesOptions {
  /** Number of issues to fetch per API request (default: 500) */
  pageSize?: number;

  /** Maximum total number of issues to fetch (default: 10000) */
  maxIssues?: number;

  /** Array of issue statuses to exclude from results */
  excludeStatuses?: string[];

  /** Whether to include resolved issues in the results */
  includeResolvedIssues?: boolean;

  /** Callback function to report progress during fetching */
  onProgress?: (current: number, total: number) => void;
}

/**
 * Options for SonarQube API requests
 *
 * @interface SonarQubeApiOptions
 * @description Configuration options for SonarQube API requests
 */
export interface SonarQubeApiOptions {
  /** API request timeout in milliseconds */
  timeout?: number;

  /** Maximum number of retry attempts for failed requests */
  maxRetries?: number;

  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;

  /** Whether to enable request/response logging */
  enableLogging?: boolean;
}

/**
 * SonarQube service configuration
 *
 * @interface SonarQubeServiceConfig
 * @description Configuration required for initializing the SonarQube service
 */
export interface SonarQubeServiceConfig {
  /** SonarQube server URL */
  url: string;

  /** Authentication token for SonarQube API */
  token: string;

  /** Project key to fetch issues for */
  projectKey: string;

  /** Organization key (required for SonarCloud) */
  organization?: string;

  /** Additional API options */
  apiOptions?: SonarQubeApiOptions;
}

/**
 * Service operation result
 *
 * @interface ServiceResult
 * @description Generic result interface for service operations
 */
export interface ServiceResult<T = any> {
  /** Whether the operation was successful */
  success: boolean;

  /** The result data (if successful) */
  data?: T;

  /** Error message (if failed) */
  error?: string;

  /** Additional metadata about the operation */
  metadata?: Record<string, any>;
}

/**
 * Connection validation result
 *
 * @interface ConnectionValidationResult
 * @description Result of SonarQube connection validation
 */
export interface ConnectionValidationResult {
  /** Whether connection is valid */
  isValid: boolean;

  /** Server version information */
  serverVersion?: string;

  /** Authentication status */
  isAuthenticated: boolean;

  /** Project accessibility status */
  canAccessProject: boolean;

  /** Any validation errors encountered */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}
