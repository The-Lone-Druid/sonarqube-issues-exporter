// Semantic colours for SonarQube dimensions, carried over from the v3 template.

export const SEVERITY_COLORS: Record<string, string> = {
  BLOCKER: '#dc2626',
  CRITICAL: '#ef4444',
  MAJOR: '#f59e0b',
  MINOR: '#eab308',
  INFO: '#6366f1',
};

export const TYPE_COLORS: Record<string, string> = {
  BUG: '#ef4444',
  VULNERABILITY: '#a855f7',
  CODE_SMELL: '#22c55e',
  SECURITY_HOTSPOT: '#f59e0b',
};

export const STATUS_COLORS: Record<string, string> = {
  OPEN: '#ef4444',
  CONFIRMED: '#f59e0b',
  REOPENED: '#a855f7',
  RESOLVED: '#22c55e',
  CLOSED: '#64748b',
};

export const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#dc2626',
  MEDIUM: '#f59e0b',
  LOW: '#eab308',
};

export const RATING_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f59e0b',
  E: '#ef4444',
};

export function colorFor(map: Record<string, string>, key: string): string {
  return map[key] ?? '#64748b';
}
