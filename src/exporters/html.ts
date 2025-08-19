import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import {
  SonarQubeIssue,
  ProcessedIssue,
  TemplateData,
  ReportMetrics,
  ReportMetadata,
  ExporterResult,
  HtmlExporterOptions,
} from '../types';
import { AppConfig } from '../types/config';
import { getLogger, escapeHtml, extractFilename, formatDate, calculateMetrics } from '../utils';

export class HtmlExporter {
  private readonly logger = getLogger();
  private readonly config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers(): void {
    // Helper to add two numbers
    Handlebars.registerHelper('add', (a: number, b: number) => {
      return (a || 0) + (b || 0);
    });

    // Helper to format dates
    Handlebars.registerHelper('formatDate', (date: string) => {
      return formatDate(date);
    });

    // Helper to escape HTML
    Handlebars.registerHelper('escapeHtml', (str: string) => {
      return escapeHtml(str);
    });
  }

  private processIssues(issues: SonarQubeIssue[]): ProcessedIssue[] {
    return issues.map((issue) => ({
      key: issue.key,
      file: extractFilename(issue.component),
      line: issue.line || 'N/A',
      message: escapeHtml(issue.message),
      severity: issue.severity,
      status: issue.status,
      type: issue.type,
      rule: issue.rule,
      component: issue.component,
      creationDate: formatDate(issue.creationDate),
      updateDate: issue.updateDate ? formatDate(issue.updateDate) : undefined,
      assignee: issue.assignee,
      author: issue.author,
      tags: issue.tags || [],
      effort: issue.effort,
      debt: issue.debt,
    }));
  }

  private calculateReportMetrics(issues: ProcessedIssue[]): ReportMetrics {
    const metricsCalculator = calculateMetrics(issues, {
      severities: (issue) => issue.severity,
      types: (issue) => issue.type,
      statuses: (issue) => issue.status,
      components: (issue) => issue.file,
      rules: (issue) => issue.rule,
    });

    return {
      total: issues.length,
      severities: metricsCalculator.severities || {},
      types: metricsCalculator.types || {},
      statuses: metricsCalculator.statuses || {},
      components: metricsCalculator.components || {},
      rules: metricsCalculator.rules || {},
    };
  }

  private createReportMetadata(issues: ProcessedIssue[]): ReportMetadata {
    return {
      generatedAt: formatDate(new Date()),
      projectKey: this.config.sonarqube.projectKey,
      sonarQubeUrl: this.config.sonarqube.url,
      totalIssues: issues.length,
      reportVersion: '2.0.0',
      filters: {
        excludedStatuses: this.config.export.excludeStatuses,
        includeResolvedIssues: this.config.export.includeResolvedIssues,
      },
    };
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = join(__dirname, '..', 'templates', `${templateName}.hbs`);

    if (!existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    try {
      return await readFile(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read template: ${error}`);
    }
  }

  async export(
    issues: SonarQubeIssue[],
    options: HtmlExporterOptions = {}
  ): Promise<ExporterResult> {
    const {
      outputPath = this.config.export.outputPath,
      filename = this.config.export.filename,
      template = this.config.export.template,
    } = options;

    try {
      this.logger.info(`Starting HTML export with ${issues.length} issues`);

      // Process issues
      const processedIssues = this.processIssues(issues);
      const metrics = this.calculateReportMetrics(processedIssues);
      const metadata = this.createReportMetadata(processedIssues);

      // Prepare template data
      const templateData: TemplateData = {
        issues: processedIssues,
        metrics,
        metadata,
      };

      // Load and compile template
      const templateContent = await this.loadTemplate(template);
      const compiledTemplate = Handlebars.compile(templateContent);

      // Generate HTML
      const html = compiledTemplate(templateData);

      // Ensure output directory exists
      const fullOutputPath = join(process.cwd(), outputPath);
      if (!existsSync(fullOutputPath)) {
        await mkdir(fullOutputPath, { recursive: true });
      }

      // Write HTML file
      const filePath = join(fullOutputPath, filename);
      await writeFile(filePath, html, 'utf-8');

      this.logger.info(`HTML report generated successfully: ${filePath}`);

      return {
        success: true,
        outputPath: filePath,
        issuesCount: issues.length,
        metrics,
      };
    } catch (error) {
      this.logger.error('Failed to generate HTML report:', error);
      return {
        success: false,
        outputPath: '',
        issuesCount: 0,
        metrics: {
          total: 0,
          severities: {},
          types: {},
          statuses: {},
          components: {},
          rules: {},
        },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
