import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '../../lib/utils';

/** Render remote SonarQube rule/hotspot HTML after sanitizing it. */
export function SafeHtml({ html, className }: { html?: string; className?: string }) {
  const clean = useMemo(() => (html ? DOMPurify.sanitize(html) : ''), [html]);
  if (!clean) return null;
  return (
    <div
      className={cn('sq-rule text-sm leading-relaxed', className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
