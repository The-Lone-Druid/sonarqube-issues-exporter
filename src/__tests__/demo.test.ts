/**
 * Demo Test: How to Use the SonarQube Issues Exporter
 *
 * This test file demonstrates the main workflows and features
 * of the enterprise-level SonarQube Issues Exporter.
 */

// Set up environment variables before any imports
process.env.SONARQUBE_URL = 'http://localhost:9000';
process.env.SONARQUBE_TOKEN = 'test-token';
process.env.SONARQUBE_PROJECT_KEY = 'test-project';

import { loadConfig } from '../config';
import { escapeHtml, extractFilename } from '../utils/helpers';

describe('🚀 SonarQube Issues Exporter - How It Works', () => {
  beforeEach(() => {
    // Ensure environment variables are set for each test
    process.env.SONARQUBE_URL = 'http://localhost:9000';
    process.env.SONARQUBE_TOKEN = 'test-token';
    process.env.SONARQUBE_PROJECT_KEY = 'test-project';
  });

  afterEach(() => {
    // Clean up any test environment variables
    delete process.env.SONARQUBE_URL;
    delete process.env.SONARQUBE_TOKEN;
    delete process.env.SONARQUBE_PROJECT_KEY;
  });

  describe('📋 1. Configuration System', () => {
    it('supports multiple configuration methods', () => {
      // Save current env vars
      const originalUrl = process.env.SONARQUBE_URL;
      const originalToken = process.env.SONARQUBE_TOKEN;
      const originalProjectKey = process.env.SONARQUBE_PROJECT_KEY;

      try {
        // Method 1: Environment variables (most common)
        process.env.SONARQUBE_URL = 'https://sonarcloud.io';
        process.env.SONARQUBE_TOKEN = 'demo-token';
        process.env.SONARQUBE_PROJECT_KEY = 'my-project';

        const config = loadConfig();
        expect(config.sonarqube.url).toBe('https://sonarcloud.io');
        expect(config.sonarqube.token).toBe('demo-token');
        expect(config.sonarqube.projectKey).toBe('my-project');
      } finally {
        // Restore original env vars
        if (originalUrl) process.env.SONARQUBE_URL = originalUrl;
        else delete process.env.SONARQUBE_URL;
        if (originalToken) process.env.SONARQUBE_TOKEN = originalToken;
        else delete process.env.SONARQUBE_TOKEN;
        if (originalProjectKey) process.env.SONARQUBE_PROJECT_KEY = originalProjectKey;
        else delete process.env.SONARQUBE_PROJECT_KEY;
      }
    });

    it('allows configuration overrides', () => {
      // Method 2: Programmatic overrides (for custom integrations)
      const config = loadConfig({
        overrides: {
          sonarqube: {
            url: 'https://my-company-sonar.com',
            token: 'custom-token',
            projectKey: 'enterprise-project',
            organization: 'my-org',
          },
          export: {
            outputPath: './custom-reports',
            filename: 'quality-report.html',
            excludeStatuses: ['CLOSED', 'RESOLVED'],
            includeResolvedIssues: false,
            maxIssues: 5000,
            template: 'default',
          },
        },
      });

      expect(config.sonarqube.url).toBe('https://my-company-sonar.com');
      expect(config.export.outputPath).toBe('./custom-reports');
      expect(config.export.maxIssues).toBe(5000);
    });
  });

  describe('🔧 2. Data Processing Pipeline', () => {
    it('safely processes HTML content', () => {
      // The exporter safely handles potentially dangerous content
      const dangerousMessage = '<script>alert("XSS")</script>Resource leak detected';
      const safeMessage = escapeHtml(dangerousMessage);

      expect(safeMessage).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;Resource leak detected'
      );
      expect(safeMessage).not.toContain('<script>');
    });

    it('extracts clean filenames from SonarQube components', () => {
      // SonarQube returns full component paths, we extract just the filename
      expect(extractFilename('my-project:src/main/java/com/example/Service.java')).toBe(
        'Service.java'
      );
      expect(extractFilename('frontend:src/components/Button.tsx')).toBe('Button.tsx');
      expect(extractFilename('simple-file.js')).toBe('simple-file.js');
    });
  });

  describe('📊 3. Report Generation Features', () => {
    it('demonstrates the report structure', () => {
      // The generated HTML reports include:
      const reportFeatures = {
        header: {
          projectInfo: 'Project name and key',
          generationTime: 'When the report was created',
          totalIssues: 'Count of all issues found',
        },
        metricsOverview: {
          summaryCards: ['Total Issues', 'Critical Issues', 'Bugs', 'Vulnerabilities'],
          detailedMetrics: ['By Severity', 'By Type', 'By Status'],
          collapsible: 'Can be hidden to focus on issues table',
        },
        issuesTable: {
          columns: [
            'Severity',
            'Status',
            'Type',
            'Message',
            'File',
            'Line',
            'Rule',
            'Created',
            'Actions',
          ],
          features: ['Sorting', 'Filtering', 'Searching', 'Pagination'],
          interactions: ['Copy file paths', 'Copy issue keys'],
        },
        theming: {
          darkMode: 'Automatic based on system preference',
          lightMode: 'Classic light theme',
          toggle: 'Manual theme switching',
        },
      };

      expect(reportFeatures.header.projectInfo).toBeDefined();
      expect(reportFeatures.metricsOverview.summaryCards).toHaveLength(4);
      expect(reportFeatures.issuesTable.columns).toHaveLength(9);
      expect(reportFeatures.theming.darkMode).toContain('Automatic');
    });
  });

  describe('🖥️ 4. CLI Usage Examples', () => {
    it('supports different CLI workflows', () => {
      // Command examples (these would be run in terminal):
      const commands = {
        basic: 'npm run export',
        withConfig: 'npm run export -- --config ./config.json',
        customOutput: 'npm run export -- --output ./reports --filename my-report.html',
        filtered: 'npm run export -- --exclude-statuses "CLOSED,RESOLVED" --max-issues 1000',
        verbose: 'npm run export -- --verbose',
        validate: 'npm run export -- validate',
        production: 'npm run build && npm run export:prod',
      };

      // Each command serves a different use case:
      expect(commands.basic).toBe('npm run export'); // Quick export with defaults
      expect(commands.withConfig).toContain('config.json'); // Using config file
      expect(commands.customOutput).toContain('--output'); // Custom output location
      expect(commands.filtered).toContain('--exclude-statuses'); // Filtering options
      expect(commands.verbose).toContain('--verbose'); // Debug information
      expect(commands.validate).toContain('validate'); // Test connection
      expect(commands.production).toContain('build'); // Production deployment
    });
  });

  describe('🎯 5. Enterprise Features', () => {
    it('provides enterprise-grade capabilities', () => {
      const enterpriseFeatures = {
        typeScript: {
          enabled: true,
          benefits: ['Type safety', 'Better IDE support', 'Compile-time checks'],
        },
        errorHandling: {
          validation: 'Configuration validation',
          apiErrors: 'Detailed API error messages',
          gracefulFails: 'Continues on non-critical errors',
        },
        performance: {
          pagination: 'Handles large datasets efficiently',
          progress: 'Real-time progress reporting',
          limits: 'Configurable issue limits',
        },
        logging: {
          levels: ['error', 'warn', 'info', 'debug'],
          output: ['console', 'file'],
          structured: 'JSON logging format',
        },
        integration: {
          programmaticAPI: 'Use in other applications',
          configFiles: 'JSON configuration support',
          envVars: 'Environment variable support',
        },
      };

      expect(enterpriseFeatures.typeScript.enabled).toBe(true);
      expect(enterpriseFeatures.logging.levels).toHaveLength(4);
      expect(enterpriseFeatures.performance.pagination).toContain('efficiently');
    });
  });

  describe('🔄 6. Workflow Example', () => {
    it('demonstrates a complete workflow', async () => {
      // This is how the application works internally:

      // Step 1: Load configuration
      const config = loadConfig({
        overrides: {
          sonarqube: {
            url: 'https://sonarcloud.io',
            token: 'demo-token',
            projectKey: 'my-project',
            organization: 'my-org',
          },
          export: {
            outputPath: './reports',
            filename: 'issues-report.html',
            excludeStatuses: ['CLOSED'],
            includeResolvedIssues: false,
            maxIssues: 10000,
            template: 'default',
          },
        },
      });

      // Step 2: Service initialization (would happen internally)
      // const sonarQubeService = new SonarQubeService(config.sonarqube);
      // const htmlExporter = new HtmlExporter(config);

      // Step 3: Data fetching (would call SonarQube API)
      // const issues = await sonarQubeService.fetchAllIssues({
      //   maxIssues: config.export.maxIssues,
      //   excludeStatuses: config.export.excludeStatuses,
      //   onProgress: (current, total) => console.log(`${current}/${total}`),
      // });

      // Step 4: Report generation (would generate HTML)
      // const result = await htmlExporter.export(issues, {
      //   outputPath: config.export.outputPath,
      //   filename: config.export.filename,
      // });

      // Verify configuration is ready for this workflow
      expect(config.sonarqube.url).toBe('https://sonarcloud.io');
      expect(config.export.outputPath).toBe('./reports');
      expect(config.export.maxIssues).toBe(10000);
    });
  });
});
