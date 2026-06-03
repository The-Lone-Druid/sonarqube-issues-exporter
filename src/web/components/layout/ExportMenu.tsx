import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { api, ApiError, reportUrl } from '../../lib/api-client';
import { useSelection } from '../../hooks/use-selection';
import { useIssues } from '../../hooks/use-queries';
import { exportIssuesToCSV } from '../../lib/export';
import { cn } from '../../lib/utils';

export function ExportMenu() {
  const { project, ref, newCode } = useSelection();
  const [open, setOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: issuesData } = useIssues(project, ref, newCode);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const exportPdf = async (): Promise<void> => {
    if (!project) return;
    setOpen(false);
    setPdfBusy(true);
    try {
      const blob = await api.exportPdf(project, ref, newCode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        window.open(reportUrl(project, ref), '_blank');
      } else {
        // eslint-disable-next-line no-alert
        alert(error instanceof Error ? error.message : 'PDF export failed');
      }
    } finally {
      setPdfBusy(false);
    }
  };

  const exportCsv = (): void => {
    if (!project || !issuesData?.issues) return;
    setOpen(false);
    exportIssuesToCSV(issuesData.issues, project);
  };

  return (
    <div ref={menuRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={!project || pdfBusy}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {pdfBusy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        Export
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-150', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-fade-in">
          <button
            type="button"
            onClick={exportPdf}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-accent"
          >
            <FileDown className="h-4 w-4 text-muted-foreground" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!issuesData?.issues?.length}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
