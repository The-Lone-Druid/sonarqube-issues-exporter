import axios, { AxiosInstance, AxiosError } from 'axios';
import { SonarQubeIssue, SonarQubeSearchResponse, FetchIssuesOptions } from '../types';
import { AppConfig } from '../types/config';
import { getLogger } from '../utils';

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
        this.logger.debug(`Making request to: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
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

        this.logger.debug(`Fetched page ${page}: ${filteredIssues.length} issues`);

        if (onProgress) {
          onProgress(totalFetched, Math.min(paging.total, maxIssues));
        }

        // Check if we've fetched all available issues
        if (page * pageSize >= paging.total || issues.length === 0) {
          break;
        }

        page++;
      } catch (error) {
        this.logger.error(`Failed to fetch page ${page}:`, error);
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
      this.logger.error('Failed to validate SonarQube connection:', error);
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
      this.logger.error('Failed to fetch project info:', error);
      return null;
    }
  }
}
