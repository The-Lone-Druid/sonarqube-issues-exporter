import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import type {
  AppConfig,
  SonarQubeIssue,
  ProcessedIssue,
  EnhancedTemplateData,
  ReportMetrics,
  ReportMetadata,
  ExporterResult,
  HtmlExporterOptions,
  QualityGateStatus,
  ProjectMeasures,
  SecurityHotspotsData,
} from '../types';
import { escapeHtml, extractFilename, formatDate, calculateMetrics } from '../utils/helpers';
import { logger } from '../utils/logger';
import {
  getQualityGateStatus,
  getProjectMeasures,
  getSecurityHotspots,
} from '../services/sonarqube';

function registerHelpers(): void {
  Handlebars.registerHelper('add', (a: number, b: number) => (a || 0) + (b || 0));
  Handlebars.registerHelper('formatDate', (date: string) => formatDate(date));
  Handlebars.registerHelper('escapeHtml', (str: string) => escapeHtml(str));
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
  Handlebars.registerHelper('or', (...args: unknown[]) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper(
    'if_eq',
    function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
      return a === b ? options.fn(this) : options.inverse(this);
    },
  );
  Handlebars.registerHelper('currentYear', () => new Date().getFullYear());
}

function processIssues(issues: SonarQubeIssue[]): ProcessedIssue[] {
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
    ...(issue.updateDate != null && { updateDate: formatDate(issue.updateDate) }),
    ...(issue.assignee != null && { assignee: issue.assignee }),
    ...(issue.author != null && { author: issue.author }),
    tags: issue.tags || [],
    ...(issue.effort != null && { effort: issue.effort }),
    ...(issue.debt != null && { debt: issue.debt }),
  }));
}

function calculateReportMetrics(issues: ProcessedIssue[]): ReportMetrics {
  const grouped = calculateMetrics(issues, {
    severities: (issue) => issue.severity,
    types: (issue) => issue.type,
    statuses: (issue) => issue.status,
    components: (issue) => issue.file,
    rules: (issue) => issue.rule,
  });

  return {
    total: issues.length,
    severities: grouped['severities'] || {},
    types: grouped['types'] || {},
    statuses: grouped['statuses'] || {},
    components: grouped['components'] || {},
    rules: grouped['rules'] || {},
  };
}

function createReportMetadata(config: AppConfig, issues: ProcessedIssue[]): ReportMetadata {
  return {
    generatedAt: formatDate(new Date()),
    projectKey: config.sonarqube.projectKey,
    sonarQubeUrl: config.sonarqube.url,
    totalIssues: issues.length,
    reportVersion: '4.0.0',
    filters: {
      excludedStatuses: config.export.excludeStatuses,
      includeResolvedIssues: config.export.includeResolvedIssues,
    },
  };
}

async function loadTemplate(templateName: string): Promise<string> {
  const templatePath = join(__dirname, 'templates', `${templateName}.hbs`);

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return readFile(templatePath, 'utf-8');
}

export async function exportToHtml(
  config: AppConfig,
  issues: SonarQubeIssue[],
  options: HtmlExporterOptions = {},
): Promise<ExporterResult> {
  const {
    outputPath = config.export.outputPath,
    filename = config.export.filename,
    template = config.export.template,
  } = options;

  try {
    logger.info(`Starting HTML export with ${issues.length} issues`);
    registerHelpers();

    const processedIssues = processIssues(issues);
    const metrics = calculateReportMetrics(processedIssues);
    const metadata = createReportMetadata(config, processedIssues);

    // Fetch enhanced data
    let qualityGate: QualityGateStatus = { status: 'NONE', conditions: [] };
    let projectMeasures: ProjectMeasures = {};
    let securityHotspots: SecurityHotspotsData = {
      total: 0,
      byPriority: {},
      byCategory: {},
      hotspots: [],
    };

    try {
      const [qg, pm, sh] = await Promise.all([
        getQualityGateStatus(config.sonarqube),
        getProjectMeasures(config.sonarqube),
        getSecurityHotspots(config.sonarqube),
      ]);
      qualityGate = qg;
      projectMeasures = pm;
      securityHotspots = sh;
    } catch (error) {
      logger.warn(
        'Failed to fetch enhanced data, using defaults:',
        error instanceof Error ? error.message : error,
      );
    }

    const templateData: EnhancedTemplateData = {
      issues: processedIssues,
      metrics,
      metadata,
      qualityGate,
      projectMeasures,
      securityHotspots,
    };

    const templateContent = await loadTemplate(template);
    const compiledTemplate = Handlebars.compile(templateContent);
    const html = compiledTemplate(templateData);

    const fullOutputPath = join(process.cwd(), outputPath);
    if (!existsSync(fullOutputPath)) {
      await mkdir(fullOutputPath, { recursive: true });
    }

    const filePath = join(fullOutputPath, filename);
    await writeFile(filePath, html, 'utf-8');

    logger.info(`HTML report generated: ${filePath}`);

    return { success: true, outputPath: filePath, issuesCount: issues.length, metrics };
  } catch (error) {
    logger.error('Failed to generate HTML report:', error);
    return {
      success: false,
      outputPath: '',
      issuesCount: 0,
      metrics: { total: 0, severities: {}, types: {}, statuses: {}, components: {}, rules: {} },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
