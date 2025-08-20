import axios, { AxiosInstance, AxiosError } from 'axios';
import { SonarQubeIssue, SonarQubeSearchResponse, FetchIssuesOptions } from '../types';
import { AppConfig } from '../types/config';
import { getLogger } from '../utils';

// New interfaces for enhanced data
export interface QualityGateCondition {
  metric: string;
  operator: string;
  value?: string;
  errorThreshold?: string;
  warningThreshold?: string;
  actualValue?: string;
  status: 'OK' | 'WARN' | 'ERROR';
}

export interface QualityGateStatus {
  status: 'PASSED' | 'FAILED' | 'NONE';
  conditions: QualityGateCondition[];
}

export interface ProjectMeasures {
  coverage?: number;
  duplicatedLinesDensity?: number;
  linesOfCode?: number;
  technicalDebt?: string;
  maintainabilityRating?: string;
  reliabilityRating?: string;
  securityRating?: string;
  complexity?: number;
  sqaleRating?: string;
  reliabilityRemediation?: string;
  securityRemediation?: string;
}

export interface SecurityHotspot {
  key: string;
  component: string;
  project: string;
  securityCategory: string;
  vulnerabilityProbability: string;
  status: string;
  resolution?: string;
  line?: number;
  hash: string;
  textRange?: any;
  flows: any[];
  ruleKey: string;
  messageFormattings: any[];
  creationDate: string;
  updateDate: string;
  assignee?: string;
}

export interface SecurityHotspotsData {
  total: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  hotspots: SecurityHotspot[];
}

export class SonarQubeService {
  private readonly api: AxiosInstance;
  private readonly logger = getLogger();
  private readonly config: AppConfig['sonarqube'];

  constructor(config: AppConfig['sonarqube']) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.url,
      auth: {
        username: config.token,
        password: '',
      },
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        // Only log URL and method, not the full config which may contain sensitive data
        this.logger.debug(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error.message || error);
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: AxiosError): void {
    if (error.response?.status === 401) {
      this.logger.error('Authentication failed (401 Unauthorized)');
      this.logger.error('Possible causes:');
      this.logger.error('- Invalid or expired token');
      this.logger.error('- Insufficient permissions');
      this.logger.error('- Incorrect SonarQube URL');
    } else if (error.response?.status === 403) {
      this.logger.error('Access forbidden (403 Forbidden)');
      this.logger.error('The token does not have sufficient permissions');
    } else if (error.response?.status === 404) {
      this.logger.error('Project not found (404 Not Found)');
      this.logger.error(`Project key '${this.config.projectKey}' may be incorrect`);
    } else {
      this.logger.error(`API request failed: ${error.message}`);
    }
  }

  async fetchAllIssues(options: FetchIssuesOptions = {}): Promise<SonarQubeIssue[]> {
    const {
      pageSize = 500,
      maxIssues = 10000,
      excludeStatuses = ['CLOSED'],
      includeResolvedIssues = false,
      onProgress,
    } = options;

    let allIssues: SonarQubeIssue[] = [];
    let page = 1;
    let totalFetched = 0;

    this.logger.info(`Starting to fetch issues for project: ${this.config.projectKey}`);

    while (totalFetched < maxIssues) {
      try {
        const response = await this.api.get<SonarQubeSearchResponse>('/api/issues/search', {
          params: {
            componentKeys: this.config.projectKey,
            organization: this.config.organization,
            ps: Math.min(pageSize, maxIssues - totalFetched),
            p: page,
            statuses: includeResolvedIssues
              ? undefined
              : ['OPEN', 'CONFIRMED', 'REOPENED'].join(','),
          },
        });

        const { issues, paging } = response.data;

        // Filter out excluded statuses
        const filteredIssues = issues.filter((issue) => !excludeStatuses.includes(issue.status));

        allIssues = allIssues.concat(filteredIssues);
        totalFetched += filteredIssues.length;

        this.logger.debug(
          `Fetched page ${page}: ${filteredIssues.length} issues (total: ${totalFetched})`
        );

        if (onProgress) {
          onProgress(totalFetched, Math.min(paging.total, maxIssues));
        }

        // Check if we've fetched all available issues
        if (page * pageSize >= paging.total || issues.length === 0) {
          break;
        }

        page++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to fetch page ${page}: ${errorMessage}`);
        throw error;
      }
    }

    this.logger.info(`Successfully fetched ${allIssues.length} issues`);
    return allIssues;
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.api.get('/api/system/status');
      this.logger.info('SonarQube connection validated successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to validate SonarQube connection:', errorMessage);
      return false;
    }
  }

  async getProjectInfo(): Promise<any> {
    try {
      const response = await this.api.get('/api/projects/search', {
        params: {
          projects: this.config.projectKey,
          organization: this.config.organization,
        },
      });

      return response.data.components[0] || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to fetch project info:', errorMessage);
      return null;
    }
  }

  /**
   * Fetch quality gate status for the project
   */
  async getQualityGateStatus(): Promise<QualityGateStatus> {
    try {
      this.logger.info('Fetching quality gate status...');
      const response = await this.api.get('/api/qualitygates/project_status', {
        params: {
          projectKey: this.config.projectKey,
          organization: this.config.organization,
        },
      });

      const data = response.data.projectStatus;

      return {
        status: data.status as 'PASSED' | 'FAILED' | 'NONE',
        conditions:
          data.conditions?.map((condition: any) => ({
            metric: condition.metricKey,
            operator: condition.comparator,
            value: condition.periodValue || condition.value,
            errorThreshold: condition.errorThreshold,
            warningThreshold: condition.warningThreshold,
            actualValue: condition.actualValue,
            status: condition.status,
          })) || [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn('Failed to fetch quality gate status:', errorMessage);
      return {
        status: 'NONE',
        conditions: [],
      };
    }
  }

  /**
   * Fetch project measures (code coverage, technical debt, etc.)
   */
  async getProjectMeasures(): Promise<ProjectMeasures> {
    try {
      this.logger.info('Fetching project measures...');
      const metrics = [
        'coverage',
        'duplicated_lines_density',
        'ncloc',
        'sqale_index',
        'sqale_rating',
        'reliability_rating',
        'security_rating',
        'complexity',
        'sqale_debt_ratio',
      ];

      const response = await this.api.get('/api/measures/component', {
        params: {
          component: this.config.projectKey,
          organization: this.config.organization,
          metricKeys: metrics.join(','),
        },
      });

      const measures = response.data.component.measures;
      const result: ProjectMeasures = {};

      for (const measure of measures) {
        switch (measure.metric) {
          case 'coverage':
            result.coverage = parseFloat(measure.value || '0');
            break;
          case 'duplicated_lines_density':
            result.duplicatedLinesDensity = parseFloat(measure.value || '0');
            break;
          case 'ncloc':
            result.linesOfCode = parseInt(measure.value || '0', 10);
            break;
          case 'sqale_index':
            result.technicalDebt = this.formatTechnicalDebt(parseInt(measure.value || '0', 10));
            break;
          case 'sqale_rating':
            result.maintainabilityRating = this.formatRating(measure.value);
            break;
          case 'reliability_rating':
            result.reliabilityRating = this.formatRating(measure.value);
            break;
          case 'security_rating':
            result.securityRating = this.formatRating(measure.value);
            break;
          case 'complexity':
            result.complexity = parseInt(measure.value || '0', 10);
            break;
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn('Failed to fetch project measures:', errorMessage);
      return {};
    }
  }

  /**
   * Fetch security hotspots data
   */
  async getSecurityHotspots(): Promise<SecurityHotspotsData> {
    try {
      this.logger.info('Fetching security hotspots...');
      const response = await this.api.get('/api/hotspots/search', {
        params: {
          projectKey: this.config.projectKey,
          organization: this.config.organization,
          ps: 500, // Page size
          status: 'TO_REVIEW',
        },
      });

      const hotspots = response.data.hotspots || [];
      const total = response.data.paging?.total || 0;

      // Group by priority and category
      const byPriority: Record<string, number> = {};
      const byCategory: Record<string, number> = {};

      for (const hotspot of hotspots) {
        const priority = hotspot.vulnerabilityProbability || 'UNKNOWN';
        const category = hotspot.securityCategory || 'UNKNOWN';

        byPriority[priority] = (byPriority[priority] || 0) + 1;
        byCategory[category] = (byCategory[category] || 0) + 1;
      }

      return {
        total,
        byPriority,
        byCategory,
        hotspots: hotspots.slice(0, 100), // Limit to first 100 for performance
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn('Failed to fetch security hotspots:', errorMessage);
      return {
        total: 0,
        byPriority: {},
        byCategory: {},
        hotspots: [],
      };
    }
  }

  /**
   * Helper method to format technical debt from minutes to human readable format
   */
  private formatTechnicalDebt(minutes: number): string {
    if (minutes === 0) return '0min';

    const days = Math.floor(minutes / (8 * 60)); // 8 hours per day
    const hours = Math.floor((minutes % (8 * 60)) / 60);
    const mins = minutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0 && days === 0) parts.push(`${mins}min`);

    return parts.join(' ') || '0min';
  }

  /**
   * Helper method to format numeric rating to letter rating
   */
  private formatRating(value?: string): string {
    if (!value) return 'N/A';
    const numValue = parseInt(value, 10);
    const ratings = ['A', 'B', 'C', 'D', 'E'];
    return ratings[numValue - 1] || 'N/A';
  }
}
