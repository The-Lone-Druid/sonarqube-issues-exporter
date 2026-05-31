import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { SonarQubeIssue } from '../../../core/types';
import { api, ApiError } from '../../lib/api-client';
import { useInvalidateAll } from '../../hooks/use-queries';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';

const TRANSITIONS = [
  { value: 'confirm', label: 'Confirm' },
  { value: 'reopen', label: 'Reopen' },
  { value: 'resolve', label: 'Resolve (fixed)' },
  { value: 'falsepositive', label: 'False positive' },
  { value: 'wontfix', label: "Won't fix" },
  { value: 'accept', label: 'Accept' },
];

/** In-app triage controls (only rendered when the server allows writes). */
export function IssueActions({ issue, onDone }: { issue: SonarQubeIssue; onDone: () => void }) {
  const invalidate = useInvalidateAll();
  const [transition, setTransition] = useState('');
  const [assignee, setAssignee] = useState(issue.assignee ?? '');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>, confirmMsg?: string): Promise<void> => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      invalidate();
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select
          value={transition}
          onChange={(e) => setTransition(e.target.value)}
          className="flex-1"
          aria-label="Transition"
        >
          <option value="">Change status…</option>
          {TRANSITIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          disabled={!transition || busy}
          onClick={() =>
            run(
              () => api.issueTransition(issue.key, transition),
              `Apply "${transition}" to this issue in SonarQube?`,
            )
          }
        >
          Apply
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Assignee login (empty = unassign)"
          className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => run(() => api.issueAssign(issue.key, assignee || undefined))}
        >
          Assign
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment…"
          className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={!comment.trim() || busy}
          onClick={() => run(() => api.issueComment(issue.key, comment))}
        >
          Comment
        </Button>
      </div>

      {busy && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Applying…
        </div>
      )}
      {error && <div className="text-xs text-error">{error}</div>}
    </div>
  );
}
