import type { SonarQubeIssue } from '../../core/types';
import type { SecurityHotspot } from '../../core/types';

function escape(value: string | number | undefined | null): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(fields: Array<string | number | undefined | null>): string {
  return fields.map(escape).join(',');
}

function download(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dateSuffix(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportIssuesToCSV(issues: SonarQubeIssue[], projectKey: string): void {
  const header = row([
    'Key',
    'Rule',
    'Severity',
    'Type',
    'Component',
    'Project',
    'Line',
    'Status',
    'Message',
    'Effort',
    'Debt',
    'Author',
    'Assignee',
    'Tags',
    'Created',
    'Updated',
  ]);

  const rows = issues.map((i) =>
    row([
      i.key,
      i.rule,
      i.severity,
      i.type,
      i.component,
      i.project,
      i.line,
      i.status,
      i.message,
      i.effort,
      i.debt,
      i.author,
      i.assignee,
      (i.tags ?? []).join('; '),
      i.creationDate,
      i.updateDate,
    ]),
  );

  download([header, ...rows].join('\n'), `sonarqube-issues-${projectKey}-${dateSuffix()}.csv`);
}

export function exportHotspotsToCSV(hotspots: SecurityHotspot[], projectKey: string): void {
  const header = row([
    'Key',
    'Rule',
    'Security Category',
    'Vulnerability Probability',
    'Component',
    'Project',
    'Line',
    'Status',
    'Resolution',
    'Message',
    'Assignee',
    'Created',
    'Updated',
  ]);

  const rows = hotspots.map((h) =>
    row([
      h.key,
      h.ruleKey,
      h.securityCategory,
      h.vulnerabilityProbability,
      h.component,
      h.project,
      h.line,
      h.status,
      h.resolution,
      h.message,
      h.assignee,
      h.creationDate,
      h.updateDate,
    ]),
  );

  download([header, ...rows].join('\n'), `sonarqube-hotspots-${projectKey}-${dateSuffix()}.csv`);
}
