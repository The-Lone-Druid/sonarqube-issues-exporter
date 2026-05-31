import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { api, ApiError, reportUrl } from '../../lib/api-client';
import { useSelection } from '../../hooks/use-selection';

export function ExportPdfButton() {
  const { project, ref } = useSelection();
  const [busy, setBusy] = useState(false);

  const onClick = async (): Promise<void> => {
    if (!project) return;
    setBusy(true);
    try {
      const blob = await api.exportPdf(project, ref);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      // Chromium unavailable on the server → fall back to the browser's own print.
      if (error instanceof ApiError && error.status === 422) {
        window.open(reportUrl(project, ref), '_blank');
      } else {
        // eslint-disable-next-line no-alert
        alert(error instanceof Error ? error.message : 'PDF export failed');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={!project || busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Export PDF
    </Button>
  );
}
