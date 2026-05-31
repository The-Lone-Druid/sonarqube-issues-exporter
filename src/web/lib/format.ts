/** UI-side formatting helpers (display only). */

export function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(value?: string): string {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return value;
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatNumber(value?: number): string {
  if (value == null) return '—';
  return new Intl.NumberFormat().format(value);
}

export function formatPercent(value?: number): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}

/** Extract a file name from a SonarQube component key (`proj:path/File.ts`). */
export function fileName(component: string): string {
  const path = component.includes(':') ? component.slice(component.indexOf(':') + 1) : component;
  return path.split('/').pop() || path;
}

export function filePath(component: string): string {
  return component.includes(':') ? component.slice(component.indexOf(':') + 1) : component;
}
