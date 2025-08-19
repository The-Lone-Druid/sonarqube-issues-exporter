/**
 * @fileoverview Utility type definitions for the SonarQube Issues Exporter
 *
 * This module contains reusable utility types, helper interfaces, and common
 * type patterns used throughout the application.
 *
 * @author SonarQube Issues Exporter Team
 * @version 2.0.0
 */

/**
 * Logging level enumeration
 *
 * @enum LogLevel
 * @description Available logging levels in order of severity
 */
export enum LogLevel {
  /** Error level - only critical errors */
  ERROR = 'error',

  /** Warning level - warnings and above */
  WARN = 'warn',

  /** Info level - general information and above */
  INFO = 'info',

  /** Debug level - all messages including debug info */
  DEBUG = 'debug',
}

/**
 * Logger configuration interface
 *
 * @interface LoggerConfig
 * @description Configuration options for the logging system
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;

  /** Optional log file path */
  file?: string;

  /** Whether to include timestamps in log output */
  timestamp?: boolean;

  /** Whether to colorize console output */
  colorize?: boolean;

  /** Maximum log file size in bytes */
  maxFileSize?: number;

  /** Maximum number of log files to keep */
  maxFiles?: number;
}

/**
 * Generic result wrapper interface
 *
 * @interface Result
 * @description Wrapper for operation results with success/error handling
 */
export interface Result<T = any, E = Error> {
  /** Whether the operation was successful */
  success: boolean;

  /** The result data (if successful) */
  data?: T;

  /** Error information (if failed) */
  error?: E;

  /** Additional context or metadata */
  context?: Record<string, any>;
}

/**
 * Generic pagination interface
 *
 * @interface Pagination
 * @description Standard pagination parameters
 */
export interface Pagination {
  /** Current page number (1-based) */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of items */
  total: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there are more pages available */
  hasMore: boolean;
}

/**
 * Generic filter interface
 *
 * @interface Filter
 * @description Base interface for filtering operations
 */
export interface Filter<T = any> {
  /** Field to filter on */
  field: keyof T;

  /** Filter operator */
  operator: FilterOperator;

  /** Filter value */
  value: any;

  /** Whether filter is case-sensitive (for string filters) */
  caseSensitive?: boolean;
}

/**
 * Filter operators enumeration
 *
 * @enum FilterOperator
 * @description Available filter operators
 */
export enum FilterOperator {
  /** Exact equality */
  EQUALS = 'equals',

  /** Not equal */
  NOT_EQUALS = 'notEquals',

  /** Contains substring */
  CONTAINS = 'contains',

  /** Does not contain substring */
  NOT_CONTAINS = 'notContains',

  /** Starts with */
  STARTS_WITH = 'startsWith',

  /** Ends with */
  ENDS_WITH = 'endsWith',

  /** Greater than */
  GREATER_THAN = 'greaterThan',

  /** Greater than or equal */
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',

  /** Less than */
  LESS_THAN = 'lessThan',

  /** Less than or equal */
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',

  /** In array */
  IN = 'in',

  /** Not in array */
  NOT_IN = 'notIn',
}

/**
 * Generic sort configuration
 *
 * @interface SortConfig
 * @description Configuration for sorting operations
 */
export interface SortConfig<T = any> {
  /** Field to sort by */
  field: keyof T;

  /** Sort direction */
  direction: SortDirection;
}

/**
 * Sort direction enumeration
 *
 * @enum SortDirection
 * @description Available sort directions
 */
export enum SortDirection {
  /** Ascending order */
  ASC = 'asc',

  /** Descending order */
  DESC = 'desc',
}

/**
 * Date range interface
 *
 * @interface DateRange
 * @description Represents a date range with start and end dates
 */
export interface DateRange {
  /** Start date of the range */
  start: Date;

  /** End date of the range */
  end: Date;
}

/**
 * Validation result interface
 *
 * @interface ValidationResult
 * @description Result of validation operations
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;

  /** Array of validation errors */
  errors: ValidationError[];

  /** Array of validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error interface
 *
 * @interface ValidationError
 * @description Represents a validation error
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code: string;

  /** Current field value */
  value?: any;
}

/**
 * Validation warning interface
 *
 * @interface ValidationWarning
 * @description Represents a validation warning
 */
export interface ValidationWarning {
  /** Field that triggered the warning */
  field: string;

  /** Warning message */
  message: string;

  /** Warning code */
  code: string;

  /** Current field value */
  value?: any;
}

/**
 * Utility type to make all properties optional recursively
 *
 * @type DeepPartial
 * @description Makes all properties in T optional, recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility type to make specific properties required
 *
 * @type RequiredFields
 * @description Makes specified fields required while keeping others optional
 */
export type RequiredFields<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/**
 * Utility type for string literal unions
 *
 * @type StringUnion
 * @description Helper type for creating string literal unions
 */
export type StringUnion<T extends string> = T | (string & {});

/**
 * Utility type for extracting array element type
 *
 * @type ArrayElement
 * @description Extracts the element type from an array type
 */
export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : never;
