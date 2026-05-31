import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api-client';
import type { Ref } from '../../lib/api-client';
import { useConfig } from '../../hooks/use-queries';
import { useEditorPref } from '../../lib/editor-pref';
import { cn } from '../../lib/utils';

interface OpenInIdeProps {
  project: string;
  component: string;
  ref: Ref;
  line?: number;
  /** Visible label (e.g. "File.ts:42"); falls back to an icon-only button. */
  label?: string;
  className?: string;
}

/** Opens the engineer's editor at the exact file:line (or copies the path). */
export function OpenInIde({ project, component, ref, line = 1, label, className }: OpenInIdeProps) {
  const { data: config } = useConfig();
  const pref = useEditorPref();
  const [copied, setCopied] = useState(false);
  // 'default' (or unset with no server default) → OS-open; an editor → exact line.
  const choice = pref ?? config?.ide.editor ?? 'default';

  const open = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      if (choice === 'default') {
        // OS default application — no editor configuration, no line positioning.
        await api.ideOpen(project, component);
        return;
      }
      const r = await api.ideResolve(project, component, ref, line);
      if (choice === 'jetbrains') {
        // Fire-and-forget to the IDE's built-in REST server; fall back to scheme.
        fetch(r.jetbrainsRest, { mode: 'no-cors' }).catch(() => {
          window.location.href = r.urls.idea;
        });
      } else {
        window.location.href = r.urls[choice];
      }
    } catch {
      /* open failed — user can use Copy path instead */
    }
  };

  const copy = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      const r = await api.ideResolve(project, component, ref, line);
      await navigator.clipboard.writeText(r.absPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={open}
        title={choice === 'default' ? 'Open with default app' : `Open in ${choice}`}
        className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
      >
        {label ?? <ExternalLink className="h-3.5 w-3.5" />}
        {label && <ExternalLink className="h-3 w-3 opacity-70" />}
      </button>
      <button
        type="button"
        onClick={copy}
        title="Copy local path"
        className="text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  );
}
