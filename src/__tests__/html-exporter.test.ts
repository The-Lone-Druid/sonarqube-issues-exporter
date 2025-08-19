import { HtmlExporter } from '../exporters/html';
import { mockSonarQubeIssues, mockConfig } from './mocks';
import { readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Mock fs/promises for testing
jest.mock('fs/promises');
jest.mock('fs');

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('HtmlExporter', () => {
  let exporter: HtmlExporter;

  beforeEach(() => {
    exporter = new HtmlExporter(mockConfig);
    jest.clearAllMocks();
  });

  describe('export', () => {
    it('should process issues and generate HTML report', async () => {
      // Mock template file exists and content
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(`
        <html>
          <body>
            <h1>{{metadata.projectKey}}</h1>
            <div>Total: {{metrics.total}}</div>
            {{#each issues}}
              <div>{{this.message}}</div>
            {{/each}}
          </body>
        </html>
      `);

      const result = await exporter.export(mockSonarQubeIssues, {
        outputPath: './test-reports',
        filename: 'test.html',
        template: 'default',
      });

      expect(result.success).toBe(true);
      expect(result.issuesCount).toBe(3);
      expect(result.metrics.total).toBe(3);
      expect(result.metrics.severities.MAJOR).toBe(1);
      expect(result.metrics.severities.CRITICAL).toBe(1);
      expect(result.metrics.severities.BLOCKER).toBe(1);
      expect(result.metrics.types.CODE_SMELL).toBe(1);
      expect(result.metrics.types.BUG).toBe(1);
      expect(result.metrics.types.VULNERABILITY).toBe(1);
    });

    it('should handle template not found error', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await exporter.export(mockSonarQubeIssues, {
        template: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template not found');
    });

    it('should create output directory if it does not exist', async () => {
      mockExistsSync.mockReturnValueOnce(true); // template exists
      mockExistsSync.mockReturnValueOnce(false); // output directory doesn't exist
      mockReadFile.mockResolvedValue('<html>{{metadata.projectKey}}</html>');

      await exporter.export(mockSonarQubeIssues, {
        outputPath: './new-reports',
      });

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('new-reports'),
        { recursive: true }
      );
    });
  });

  describe('processIssues', () => {
    it('should transform SonarQube issues to processed format', () => {
      // Access private method through type assertion
      const processIssues = (exporter as any).processIssues.bind(exporter);
      const processed = processIssues(mockSonarQubeIssues);

      expect(processed).toHaveLength(3);
      expect(processed[0]).toMatchObject({
        key: 'AYr1234567890',
        file: 'helper.ts', // Should extract just the filename
        line: 42,
        severity: 'MAJOR',
        type: 'CODE_SMELL',
        status: 'OPEN',
      });
    });
  });
});
