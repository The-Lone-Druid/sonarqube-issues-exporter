import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSonarQubeIssues, mockConfig } from './mocks';

vi.mock('fs/promises');
vi.mock('fs');

// Must import after mocking
const { readFile, writeFile, mkdir } = await import('fs/promises');
const { existsSync } = await import('fs');

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);
const mockExistsSync = vi.mocked(existsSync);

// Mock sonarqube service to avoid real network calls
vi.mock('../src/services/sonarqube', () => ({
  getQualityGateStatus: vi.fn().mockResolvedValue({ status: 'NONE', conditions: [] }),
  getProjectMeasures: vi.fn().mockResolvedValue({}),
  getSecurityHotspots: vi
    .fn()
    .mockResolvedValue({ total: 0, byPriority: {}, byCategory: {}, hotspots: [] }),
}));

const { exportToHtml } = await import('../src/exporters/html');

describe('exportToHtml', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process issues and generate HTML report', async () => {
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
    mockWriteFile.mockResolvedValue(undefined);

    const result = await exportToHtml(mockConfig, mockSonarQubeIssues, {
      outputPath: './test-reports',
      filename: 'test.html',
      template: 'default',
    });

    expect(result.success).toBe(true);
    expect(result.issuesCount).toBe(3);
    expect(result.metrics.total).toBe(3);
    expect(result.metrics.severities['MAJOR']).toBe(1);
    expect(result.metrics.severities['CRITICAL']).toBe(1);
    expect(result.metrics.severities['BLOCKER']).toBe(1);
    expect(result.metrics.types['CODE_SMELL']).toBe(1);
    expect(result.metrics.types['BUG']).toBe(1);
    expect(result.metrics.types['VULNERABILITY']).toBe(1);
  });

  it('should handle template not found error', async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await exportToHtml(mockConfig, mockSonarQubeIssues, {
      template: 'nonexistent',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Template not found');
  });

  it('should create output directory if it does not exist', async () => {
    mockExistsSync
      .mockReturnValueOnce(true) // template exists
      .mockReturnValueOnce(false); // output directory doesn't exist
    mockReadFile.mockResolvedValue('<html>{{metadata.projectKey}}</html>');
    mockWriteFile.mockResolvedValue(undefined);

    await exportToHtml(mockConfig, mockSonarQubeIssues, {
      outputPath: './new-reports',
    });

    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('new-reports'), {
      recursive: true,
    });
  });
});
