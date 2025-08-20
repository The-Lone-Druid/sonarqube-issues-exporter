export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  // Use proper local timezone formatting with full date and time
  return d.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function extractFilename(component: string): string {
  const parts = component.split(':');
  const path = parts.length > 1 ? parts[1] : parts[0];
  const filename = path?.split('/').pop();
  return filename || path || component;
}

export function calculateMetrics<T extends Record<string, any>>(
  items: T[],
  keyExtractors: Record<string, (item: T) => string>
): Record<string, Record<string, number>> {
  const metrics: Record<string, Record<string, number>> = {};

  for (const [metricName, extractor] of Object.entries(keyExtractors)) {
    metrics[metricName] = {};

    for (const item of items) {
      const key = extractor(item);
      metrics[metricName][key] = (metrics[metricName][key] || 0) + 1;
    }
  }

  return metrics;
}

export function createProgressBar(current: number, total: number, width = 50): string {
  const progress = Math.floor((current / total) * width);
  const remaining = width - progress;

  return `[${'='.repeat(progress)}${' '.repeat(remaining)}] ${current}/${total}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
