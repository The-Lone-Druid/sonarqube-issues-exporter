import type { IssueMetrics, SonarQubeIssue } from './types';
import { extractFilename } from './format';

/** Generic grouping helper: count items by each named key extractor. */
export function calculateMetrics<T>(
  items: T[],
  keyExtractors: Record<string, (item: T) => string>,
): Record<string, Record<string, number>> {
  const metrics: Record<string, Record<string, number>> = {};

  for (const [metricName, extractor] of Object.entries(keyExtractors)) {
    const bucket: Record<string, number> = {};
    for (const item of items) {
      const key = extractor(item);
      bucket[key] = (bucket[key] || 0) + 1;
    }
    metrics[metricName] = bucket;
  }

  return metrics;
}

/** Compute severity/type/status/component/rule breakdowns for a set of issues. */
export function computeIssueMetrics(issues: SonarQubeIssue[]): IssueMetrics {
  const grouped = calculateMetrics(issues, {
    severities: (issue) => issue.severity,
    types: (issue) => issue.type,
    statuses: (issue) => issue.status,
    components: (issue) => extractFilename(issue.component),
    rules: (issue) => issue.rule,
  });

  return {
    total: issues.length,
    severities: grouped['severities'] ?? {},
    types: grouped['types'] ?? {},
    statuses: grouped['statuses'] ?? {},
    components: grouped['components'] ?? {},
    rules: grouped['rules'] ?? {},
  };
}
