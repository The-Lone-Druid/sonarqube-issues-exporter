import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { SonarQubeIssue } from '../../../core/types';
import { Button } from '../../components/ui/button';
import { SeverityBadge, StatusBadge, TypeBadge } from '../../components/shared/badges';
import { Badge } from '../../components/ui/badge';
import { filePath, formatDate } from '../../lib/format';

export function IssueDetailSheet({
  issue,
  onClose,
}: {
  issue: SonarQubeIssue | null;
  onClose: () => void;
}) {
  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge value={issue.severity} />
            <TypeBadge value={issue.type} />
            <StatusBadge value={issue.status} />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <p className="text-sm leading-relaxed">{issue.message}</p>

          <Detail label="Rule" value={<span className="font-mono text-xs">{issue.rule}</span>} />
          <Detail
            label="Location"
            value={
              <span className="font-mono text-xs">
                {filePath(issue.component)}
                {issue.line ? `:${issue.line}` : ''}
              </span>
            }
          />
          {issue.effort && <Detail label="Effort" value={issue.effort} />}
          {issue.assignee && <Detail label="Assignee" value={issue.assignee} />}
          {issue.author && <Detail label="Author" value={issue.author} />}
          <Detail label="Created" value={formatDate(issue.creationDate)} />
          {issue.updateDate && <Detail label="Updated" value={formatDate(issue.updateDate)} />}

          {issue.tags?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {issue.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {issue.flows?.some((f) => f.locations?.length) && (
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Data flow
              </span>
              <ol className="flex flex-col gap-1.5 border-l border-border pl-4">
                {issue.flows.flatMap((f, fi) =>
                  (f.locations ?? []).map((loc, li) => (
                    <li key={`${fi}-${li}`} className="text-xs">
                      <span className="font-mono text-muted-foreground">
                        {filePath(loc.component)}
                        {loc.textRange ? `:${loc.textRange.startLine}` : ''}
                      </span>
                      {loc.msg && <div className="text-foreground">{loc.msg}</div>}
                    </li>
                  )),
                )}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}
