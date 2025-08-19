import { SonarQubeIssue, ProcessedIssue, AppConfig } from '../types';

/**
 * Mock data for testing the SonarQube Issues Exporter
 * This file contains sample data that represents what SonarQube API returns
 */

// Simple test to satisfy Jest requirement
describe('Mock Data', () => {
  it('should provide valid mock configuration', () => {
    expect(mockConfig).toBeDefined();
    expect(mockConfig.sonarqube.url).toBe('http://localhost:9000');
    expect(mockConfig.export.filename).toBe('test-report.html');
  });
});

// Mock SonarQube issue data for testing
export const mockSonarQubeIssue: SonarQubeIssue = {
  key: 'AYr1234567890',
  rule: 'javascript:S1234',
  severity: 'MAJOR',
  component: 'my-project:src/main/typescript/utils/helper.ts',
  project: 'my-project',
  line: 42,
  hash: 'abc123def456',
  textRange: {
    startLine: 42,
    endLine: 42,
    startOffset: 10,
    endOffset: 20,
  },
  flows: [],
  status: 'OPEN',
  message: 'This function has too many parameters (8). Maximum allowed is 7.',
  effort: '5min',
  debt: '5min',
  assignee: 'john.doe',
  author: 'jane.smith@example.com',
  tags: ['brain-overload', 'confusing'],
  transitions: ['confirm', 'resolve'],
  actions: ['comment'],
  comments: [],
  creationDate: '2024-01-15T10:30:00+0000',
  updateDate: '2024-01-16T14:20:00+0000',
  type: 'CODE_SMELL',
  scope: 'MAIN',
  quickFixAvailable: false,
  messageFormattings: [],
};

export const mockSonarQubeIssues: SonarQubeIssue[] = [
  mockSonarQubeIssue,
  {
    ...mockSonarQubeIssue,
    key: 'AYr1234567891',
    severity: 'CRITICAL',
    type: 'BUG',
    status: 'CONFIRMED',
    message: 'Null pointer dereference',
    component: 'my-project:src/main/typescript/services/api.ts',
    line: 156,
  },
  {
    ...mockSonarQubeIssue,
    key: 'AYr1234567892',
    severity: 'BLOCKER',
    type: 'VULNERABILITY',
    status: 'OPEN',
    message: 'SQL injection vulnerability',
    component: 'my-project:src/main/typescript/database/query.ts',
    line: 89,
  },
];

export const mockProcessedIssue: ProcessedIssue = {
  key: 'AYr1234567890',
  file: 'helper.ts',
  line: 42,
  message: 'This function has too many parameters (8). Maximum allowed is 7.',
  severity: 'MAJOR',
  status: 'OPEN',
  type: 'CODE_SMELL',
  rule: 'javascript:S1234',
  component: 'my-project:src/main/typescript/utils/helper.ts',
  creationDate: '1/15/2024, 10:30:00 AM',
  updateDate: '1/16/2024, 2:20:00 PM',
  assignee: 'john.doe',
  author: 'jane.smith@example.com',
  tags: ['brain-overload', 'confusing'],
  effort: '5min',
  debt: '5min',
};

export const mockConfig: AppConfig = {
  sonarqube: {
    url: 'http://localhost:9000',
    token: 'test-token',
    projectKey: 'test-project',
  },
  export: {
    outputPath: './reports',
    filename: 'test-report.html',
    excludeStatuses: ['CLOSED'],
    includeResolvedIssues: false,
    maxIssues: 10000,
    template: 'default',
  },
  logging: {
    level: 'info' as const,
  },
};
