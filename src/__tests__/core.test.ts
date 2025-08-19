import { loadConfig } from '../config';
import { escapeHtml, extractFilename, calculateMetrics } from '../utils/helpers';

describe('Configuration Management', () => {
  it('should load default configuration', () => {
    // This will use environment variables or defaults
    const config = loadConfig();

    expect(config).toBeDefined();
    expect(config.sonarqube).toBeDefined();
    expect(config.export).toBeDefined();
    expect(config.logging).toBeDefined();
  });

  it('should validate required fields', () => {
    expect(() => {
      loadConfig({
        overrides: {
          sonarqube: {
            url: '',
            token: '',
            projectKey: '',
          },
        },
      });
    }).toThrow();
  });

  it('should merge overrides correctly', () => {
    const config = loadConfig({
      overrides: {
        export: {
          maxIssues: 5000,
          outputPath: './custom-reports',
          filename: 'custom-report.html',
          excludeStatuses: ['CLOSED'],
          includeResolvedIssues: false,
          template: 'default',
        },
      },
    });

    expect(config.export.maxIssues).toBe(5000);
    expect(config.export.outputPath).toBe('./custom-reports');
  });
});

describe('Utility Functions', () => {
  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml('Test & Co.')).toBe('Test &amp; Co.');
    });
  });

  describe('extractFilename', () => {
    it('should extract filename from component path', () => {
      expect(extractFilename('project:src/main/java/Test.java')).toBe('Test.java');
      expect(extractFilename('simple-file.js')).toBe('simple-file.js');
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate metrics from items', () => {
      const items = [
        { severity: 'MAJOR', type: 'BUG' },
        { severity: 'MINOR', type: 'CODE_SMELL' },
        { severity: 'MAJOR', type: 'BUG' },
      ];

      const metrics = calculateMetrics(items, {
        severities: (item) => item.severity,
        types: (item) => item.type,
      });

      expect(metrics.severities?.MAJOR).toBe(2);
      expect(metrics.severities?.MINOR).toBe(1);
      expect(metrics.types?.BUG).toBe(2);
      expect(metrics.types?.CODE_SMELL).toBe(1);
    });
  });
});
