/**
 * @fileoverview Exporter-related type definitions for the SonarQube Issues Exporter
 *
 * This module contains all TypeScript interfaces and types related to export functionality,
 * including exporter options, configurations, and output formats.
 *
 * @author SonarQube Issues Exporter Team
 * @version 2.0.0
 */

/**
 * Options for HTML export functionality
 *
 * @interface HtmlExporterOptions
 * @description Configuration options for HTML report generation
 */
export interface HtmlExporterOptions {
  /** Output directory path for the generated report */
  outputPath?: string;

  /** Custom filename for the generated report */
  filename?: string;

  /** Template name to use for report generation */
  template?: string;

  /** Whether to include CSS inline in the HTML */
  inlineCSS?: boolean;

  /** Whether to include JavaScript inline in the HTML */
  inlineJS?: boolean;

  /** Custom CSS file path to include */
  customCSS?: string;

  /** Custom JavaScript file path to include */
  customJS?: string;
}

/**
 * Export operation configuration
 *
 * @interface ExportConfig
 * @description General configuration for export operations
 */
export interface ExportConfig {
  /** Output format for the export */
  format: ExportFormat;

  /** Output directory path */
  outputPath: string;

  /** Output filename */
  filename: string;

  /** Whether to overwrite existing files */
  overwrite?: boolean;

  /** Compression options */
  compression?: CompressionOptions;

  /** Template configuration */
  template?: TemplateConfig;
}

/**
 * Available export formats
 *
 * @enum ExportFormat
 * @description Supported export formats
 */
export enum ExportFormat {
  /** HTML format with interactive features */
  HTML = 'html',

  /** JSON format for programmatic consumption */
  JSON = 'json',

  /** CSV format for spreadsheet applications */
  CSV = 'csv',

  /** PDF format for reports */
  PDF = 'pdf',

  /** XML format for structured data */
  XML = 'xml',
}

/**
 * Compression options for exports
 *
 * @interface CompressionOptions
 * @description Options for compressing export outputs
 */
export interface CompressionOptions {
  /** Whether to enable compression */
  enabled: boolean;

  /** Compression format to use */
  format: 'gzip' | 'zip' | 'brotli';

  /** Compression level (1-9) */
  level?: number;
}

/**
 * Template configuration for exports
 *
 * @interface TemplateConfig
 * @description Configuration for template-based exports
 */
export interface TemplateConfig {
  /** Template name or path */
  name: string;

  /** Template variables */
  variables?: Record<string, any>;

  /** Template partials */
  partials?: Record<string, string>;

  /** Template helpers */
  helpers?: Record<string, (...args: any[]) => any>;
}

/**
 * Export context information
 *
 * @interface ExportContext
 * @description Context information available during export operations
 */
export interface ExportContext {
  /** Export start timestamp */
  startTime: Date;

  /** Export configuration */
  config: ExportConfig;

  /** Source data statistics */
  sourceStats: {
    /** Total number of issues */
    totalIssues: number;

    /** Issues by severity */
    bySeverity: Record<string, number>;

    /** Issues by type */
    byType: Record<string, number>;

    /** Issues by status */
    byStatus: Record<string, number>;
  };

  /** Export metadata */
  metadata: {
    /** Exporter version */
    version: string;

    /** Export timestamp */
    timestamp: string;

    /** Source system information */
    source: {
      /** SonarQube server URL */
      url: string;

      /** Project key */
      projectKey: string;

      /** Organization (if applicable) */
      organization?: string;
    };
  };
}

/**
 * Base interface for all exporters
 *
 * @interface BaseExporter
 * @description Common interface that all exporters must implement
 */
export interface BaseExporter<TOptions = any, TResult = any> {
  /** Export data using the specified options */
  export(data: any[], options: TOptions): Promise<TResult>;

  /** Validate export options */
  validateOptions(options: TOptions): boolean;

  /** Get supported export formats */
  getSupportedFormats(): ExportFormat[];
}
