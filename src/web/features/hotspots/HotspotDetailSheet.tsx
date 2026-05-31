import { useState } from 'react';
import { X } from 'lucide-react';
import type { Ref } from '../../lib/api-client';
import { api, ApiError } from '../../lib/api-client';
import { useHotspotDetail, useInvalidateAll } from '../../hooks/use-queries';
import { Button } from '../../components/ui/button';
import { PriorityBadge } from '../../components/shared/badges';
import { SafeHtml } from '../../components/shared/SafeHtml';
import { OpenInIde } from '../../components/shared/OpenInIde';
import { Loading } from '../../components/shared/states';
import { filePath, formatDate } from '../../lib/format';

interface Props {
  hotspotKey: string | null;
  project: string;
  refSel: Ref;
  allowWrite: boolean;
  onClose: () => void;
}

const REVIEW_ACTIONS = [
  { label: 'Mark Safe', resolution: 'SAFE' },
  { label: 'Mark Fixed', resolution: 'FIXED' },
  { label: 'Acknowledge', resolution: 'ACKNOWLEDGED' },
];

export function HotspotDetailSheet({ hotspotKey, project, refSel, allowWrite, onClose }: Props) {
  const { data, isLoading } = useHotspotDetail(hotspotKey);
  const invalidate = useInvalidateAll();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hotspotKey) return null;

  const changeStatus = async (status: string, resolution?: string): Promise<void> => {
    if (!window.confirm(`Set this hotspot to ${resolution ?? status} in SonarQube?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api.hotspotStatus(hotspotKey, status, resolution);
      invalidate();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            {data?.vulnerabilityProbability && (
              <div className="mb-2">
                <PriorityBadge value={data.vulnerabilityProbability} />
              </div>
            )}
            <p className="text-sm font-medium leading-snug">{data?.message ?? 'Hotspot'}</p>
            {data?.component && (
              <div className="mt-1">
                <OpenInIde
                  project={project}
                  component={data.component}
                  ref={refSel}
                  line={data.line ?? 1}
                  label={`${filePath(data.component)}${data.line ? `:${data.line}` : ''}`}
                />
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <Loading />
          ) : !data ? (
            <p className="text-sm text-muted-foreground">Hotspot detail unavailable.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {data.securityCategory && (
                <div className="text-xs text-muted-foreground">
                  Category: <span className="text-foreground">{data.securityCategory}</span>
                  {data.creationDate ? ` · ${formatDate(data.creationDate)}` : ''}
                </div>
              )}
              {data.riskDescription && (
                <Section title="What's the risk?" html={data.riskDescription} />
              )}
              {data.vulnerabilityDescription && (
                <Section title="Assess the risk" html={data.vulnerabilityDescription} />
              )}
              {data.fixRecommendations && (
                <Section title="How can you fix it?" html={data.fixRecommendations} />
              )}
            </div>
          )}
        </div>

        {allowWrite && data && (
          <div className="flex flex-col gap-2 border-t border-border p-4">
            <div className="flex flex-wrap gap-2">
              {REVIEW_ACTIONS.map((a) => (
                <Button
                  key={a.resolution}
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => changeStatus('REVIEWED', a.resolution)}
                >
                  {a.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => changeStatus('TO_REVIEW')}
              >
                Reset to review
              </Button>
            </div>
            {error && <div className="text-xs text-error">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, html }: { title: string; html: string }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <SafeHtml html={html} />
    </div>
  );
}
