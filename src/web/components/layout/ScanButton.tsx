import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Loader2, Play, ScanLine, X, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { api, type ScanPhase, type ScanStatus } from '../../lib/api-client';
import { useSelection } from '../../hooks/use-selection';
import { useRefresh } from '../../hooks/use-queries';
import { cn } from '../../lib/utils';

const PHASE_LABEL: Record<ScanPhase, string> = {
  idle: 'Scan',
  scanning: 'Scanning…',
  processing: 'Processing…',
  success: 'Scan done',
  error: 'Scan failed',
};

const PHASE_COLOR: Record<ScanPhase, string> = {
  idle: '',
  scanning: 'text-primary',
  processing: 'text-primary',
  success: 'text-green-500',
  error: 'text-destructive',
};

function useScanStatus() {
  return useQuery<ScanStatus>({
    queryKey: ['scan-status'],
    queryFn: () => api.scanStatus(),
    refetchInterval: (query) => {
      const phase = query.state.data?.phase;
      return phase === 'scanning' || phase === 'processing' ? 1000 : false;
    },
    staleTime: 0,
  });
}

export function ScanButton() {
  const { project, ref } = useSelection();
  const refresh = useRefresh(project);
  const { data, refetch } = useScanStatus();
  const phase = data?.phase ?? 'idle';
  const [open, setOpen] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const prevPhase = useRef<ScanPhase>('idle');

  // Auto-open drawer when scan starts.
  useEffect(() => {
    if (prevPhase.current === 'idle' && (phase === 'scanning' || phase === 'processing')) {
      setOpen(true);
    }
    // Refresh dashboard data when scan completes successfully.
    if (
      (prevPhase.current === 'scanning' || prevPhase.current === 'processing') &&
      phase === 'success'
    ) {
      refresh();
    }
    prevPhase.current = phase;
  }, [phase, refresh]);

  // Scroll to bottom of logs as new lines arrive.
  useEffect(() => {
    if (open) logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.logs, open]);

  const busy = phase === 'scanning' || phase === 'processing';

  async function handleScan() {
    if (busy) {
      setOpen(true);
      return;
    }
    setOpen(true);
    if (!project) return; // need a project selected first
    const branch = ref?.type === 'branch' ? ref.value : undefined;
    try {
      await api.startScan(project, branch);
      await refetch();
    } catch {
      await refetch();
    }
  }

  const Icon = busy
    ? Loader2
    : phase === 'success'
      ? CheckCircle2
      : phase === 'error'
        ? XCircle
        : ScanLine;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleScan}
        title={busy ? 'Scan in progress — click to view logs' : 'Scan project with SonarQube'}
        className={cn('gap-1.5', PHASE_COLOR[phase])}
      >
        <Icon className={cn('h-4 w-4', busy && 'animate-spin')} />
        <span className="hidden sm:inline">{PHASE_LABEL[phase]}</span>
      </Button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex justify-end bg-black/40"
            onClick={() => setOpen(false)}
          >
          <div
            className="relative flex h-full w-[520px] max-w-full flex-col border-l border-border bg-background shadow-2xl animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                <span className="font-medium">Scan Logs</span>
                <PhaseBadge phase={phase} />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Project context */}
            {data?.startedAt && (
              <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                {project ?? '—'}
                {ref?.type === 'branch' && <span className="ml-2 opacity-70">@ {ref.value}</span>}
              </div>
            )}

            {/* Log output */}
            <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-5">
              {!data?.logs.length && phase === 'idle' && (
                <p className="text-muted-foreground">
                  {project
                    ? 'Click Start Scan to run SonarQube analysis on the current directory.'
                    : 'Select a project first, then click Start Scan.'}
                </p>
              )}
              {data?.logs.map((line, i) => (
                <LogLine key={i} line={line} />
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              {data?.endedAt && (
                <span className="text-xs text-muted-foreground">
                  Finished in {Math.round((data.endedAt - (data.startedAt ?? data.endedAt)) / 1000)}s
                </span>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
                {!busy && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      const branch = ref?.type === 'branch' ? ref.value : undefined;
                      try {
                        await api.startScan(project ?? '', branch);
                        await refetch();
                      } catch {
                        await refetch();
                      }
                    }}
                    disabled={!project}
                  >
                    <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                    {phase === 'idle' ? 'Start Scan' : 'Scan Again'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function PhaseBadge({ phase }: { phase: ScanPhase }) {
  const styles: Record<ScanPhase, string> = {
    idle: 'bg-muted text-muted-foreground',
    scanning: 'bg-primary/10 text-primary',
    processing: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    error: 'bg-destructive/10 text-destructive',
  };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', styles[phase])}>
      {phase}
    </span>
  );
}

function LogLine({ line }: { line: string }) {
  const isError = line.startsWith('[error]') || line.includes('ERROR');
  const isWarn = line.includes('WARN');
  const isInfo = line.startsWith('[info]');
  const isSuccess = line.includes('✓');
  return (
    <div
      className={cn(
        'whitespace-pre-wrap break-all',
        isError && 'text-destructive',
        isWarn && 'text-yellow-600 dark:text-yellow-400',
        isInfo && 'text-primary/80',
        isSuccess && 'font-semibold text-green-600 dark:text-green-400',
        !isError && !isWarn && !isInfo && !isSuccess && 'text-foreground/70',
      )}
    >
      {line || ' '}
    </div>
  );
}
