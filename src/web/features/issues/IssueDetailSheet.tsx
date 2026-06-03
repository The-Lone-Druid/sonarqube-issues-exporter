import { useState } from 'react';
import { X } from 'lucide-react';
import type { SonarQubeIssue } from '../../../core/types';
import type { Ref } from '../../lib/api-client';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { SeverityBadge, StatusBadge, TypeBadge } from '../../components/shared/badges';
import { SafeHtml } from '../../components/shared/SafeHtml';
import { Loading } from '../../components/shared/states';
import { useChangelog, useRule, useScm, useSource } from '../../hooks/use-queries';
import { filePath, formatDate } from '../../lib/format';
import { cn } from '../../lib/utils';
import { IssueActions } from './IssueActions';

type Tab = 'why' | 'fix' | 'code' | 'activity';

interface Props {
  issue: SonarQubeIssue | null;
  project: string;
  refSel: Ref;
  allowWrite: boolean;
  onClose: () => void;
}

export function IssueDetailSheet({ issue, project, refSel, allowWrite, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('why');
  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-border bg-card shadow-2xl animate-slide-in-right">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <SeverityBadge value={issue.severity} />
              <TypeBadge value={issue.type} />
              <StatusBadge value={issue.status} />
            </div>
            <p className="text-sm font-medium leading-snug">{issue.message}</p>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              {filePath(issue.component)}{issue.line ? `:${issue.line}` : ''}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1 border-b border-border px-3">
          {(
            [
              ['why', 'Why'],
              ['fix', 'How to fix'],
              ['code', 'Code'],
              ['activity', 'Activity'],
            ] as Array<[Tab, string]>
          ).map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm transition-colors',
                tab === id
                  ? 'border-primary font-medium text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'why' && <WhyTab ruleKey={issue.rule} />}
          {tab === 'fix' && <FixTab ruleKey={issue.rule} />}
          {tab === 'code' && <CodeTab issue={issue} refSel={refSel} />}
          {tab === 'activity' && <ActivityTab issueKey={issue.key} issue={issue} />}
        </div>

        {allowWrite && (
          <div className="border-t border-border p-4">
            <IssueActions issue={issue} onDone={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}

function WhyTab({ ruleKey }: { ruleKey: string }) {
  const { data: rule, isLoading } = useRule(ruleKey);
  if (isLoading) return <Loading />;
  const section =
    rule?.descriptionSections.find((s) => s.key === 'root_cause') ??
    rule?.descriptionSections.find((s) => s.key === 'introduction');
  return (
    <div>
      <RuleMeta ruleKey={ruleKey} name={rule?.name} />
      {section ? (
        <SafeHtml html={section.content} />
      ) : (
        <SafeHtml html={rule?.htmlDescription} />
      )}
    </div>
  );
}

function FixTab({ ruleKey }: { ruleKey: string }) {
  const { data: rule, isLoading } = useRule(ruleKey);
  if (isLoading) return <Loading />;
  const fix = rule?.descriptionSections.find((s) => s.key === 'how_to_fix');
  const resources = rule?.descriptionSections.find((s) => s.key === 'resources');
  if (!fix && !resources && !rule?.htmlDescription) {
    return <p className="text-sm text-muted-foreground">No fix guidance provided for this rule.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {fix ? <SafeHtml html={fix.content} /> : <SafeHtml html={rule?.htmlDescription} />}
      {resources && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">Resources</h3>
          <SafeHtml html={resources.content} />
        </div>
      )}
    </div>
  );
}

function CodeTab({ issue, refSel }: { issue: SonarQubeIssue; refSel: Ref }) {
  const line = issue.line ?? 1;
  const from = Math.max(1, line - 6);
  const to = line + 6;
  const source = useSource(issue.component, refSel, from, to);
  const scm = useScm(issue.component, refSel, line, line);
  const blame = scm.data?.[0];

  if (source.isLoading) return <Loading />;
  const lines = source.data ?? [];
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">Source not available for this component.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {blame?.author && (
        <div className="text-xs text-muted-foreground">
          Last changed by <span className="text-foreground">{blame.author}</span>
          {blame.date ? ` · ${formatDate(blame.date)}` : ''}
          {blame.revision ? ` · ${blame.revision.slice(0, 8)}` : ''}
        </div>
      )}
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed">
        <code>
          {lines.map((l) => (
            <div
              key={l.line}
              className={cn(
                'flex',
                l.line === line && 'rounded bg-error/15 ring-1 ring-error/30',
              )}
            >
              <span className="mr-3 w-10 shrink-0 select-none text-right text-muted-foreground">
                {l.line}
              </span>
              <span className="whitespace-pre">{l.code}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function ActivityTab({ issueKey, issue }: { issueKey: string; issue: SonarQubeIssue }) {
  const { data, isLoading } = useChangelog(issueKey);
  if (isLoading) return <Loading />;
  const entries = data ?? [];
  return (
    <div className="flex flex-col gap-4 text-sm">
      <Field label="Created" value={formatDate(issue.creationDate)} />
      {issue.author && <Field label="Author" value={issue.author} />}
      {issue.assignee && <Field label="Assignee" value={issue.assignee} />}
      {issue.effort && <Field label="Effort" value={issue.effort} />}
      {issue.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {issue.tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      )}
      <div>
        <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Changelog</h3>
        {entries.length === 0 ? (
          <p className="text-muted-foreground">No changes recorded.</p>
        ) : (
          <ol className="flex flex-col gap-2 border-l border-border pl-4">
            {entries.map((e, i) => (
              <li key={i} className="text-xs">
                <span className="text-muted-foreground">
                  {e.user ?? 'system'} · {formatDate(e.creationDate)}
                </span>
                {e.diffs.map((d, j) => (
                  <div key={j}>
                    {d.key}: {d.oldValue ?? '∅'} → {d.newValue ?? '∅'}
                  </div>
                ))}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function RuleMeta({ ruleKey, name }: { ruleKey: string; name?: string }) {
  return (
    <div className="mb-3">
      {name && <div className="text-sm font-medium">{name}</div>}
      <div className="font-mono text-xs text-muted-foreground">{ruleKey}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
