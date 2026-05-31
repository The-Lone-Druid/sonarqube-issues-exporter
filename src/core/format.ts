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

/** Extract a file name from a SonarQube component key like `project:src/a/B.ts`. */
export function extractFilename(component: string): string {
  const parts = component.split(':');
  const path = parts.length > 1 ? parts[1] : parts[0];
  const filename = path?.split('/').pop();
  return filename || path || component;
}

/** Extract the path portion (without the project prefix) from a component key. */
export function extractPath(component: string): string {
  const parts = component.split(':');
  return (parts.length > 1 ? parts.slice(1).join(':') : parts[0]) || component;
}

/** Format SonarQube `sqale_index` minutes into a human string (e.g. `2d 3h`). */
export function formatTechnicalDebt(minutes: number): string {
  if (minutes === 0) return '0min';
  const days = Math.floor(minutes / (8 * 60));
  const hours = Math.floor((minutes % (8 * 60)) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 && days === 0) parts.push(`${mins}min`);
  return parts.join(' ') || '0min';
}

/** Convert a numeric SonarQube rating (1-5) into a letter grade (A-E). */
export function formatRating(value?: string): string {
  if (!value) return 'N/A';
  const ratings = ['A', 'B', 'C', 'D', 'E'];
  return ratings[parseInt(value, 10) - 1] || 'N/A';
}
