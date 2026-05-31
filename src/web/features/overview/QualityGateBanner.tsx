import { useState } from 'react';
import { CheckCircle2, ChevronDown, XCircle, MinusCircle } from 'lucide-react';
import type { QualityGateStatus } from '../../../core/types';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';

const STYLES = {
  PASSED: { color: '#22c55e', label: 'Passed', icon: CheckCircle2 },
  FAILED: { color: '#ef4444', label: 'Failed', icon: XCircle },
  NONE: { color: '#64748b', label: 'No quality gate', icon: MinusCircle },
} as const;

export function QualityGateBanner({ status }: { status: QualityGateStatus }) {
  const [open, setOpen] = useState(false);
  const style = STYLES[status.status] ?? STYLES.NONE;
  const Icon = style.icon;
  const failing = status.conditions.filter((c) => c.status !== 'OK');

  return (
    <Card className="break-inside-avoid overflow-hidden" style={{ borderColor: `${style.color}55` }}>
      <button
        type="button"
        className="flex w-full items-center gap-3 p-5 text-left"
        onClick={() => setOpen((v) => !v)}
        disabled={failing.length === 0}
        style={{ backgroundColor: `${style.color}11` }}
      >
        <Icon className="h-6 w-6 shrink-0" style={{ color: style.color }} />
        <div className="flex-1">
          <div className="text-base font-semibold" style={{ color: style.color }}>
            Quality Gate: {style.label}
          </div>
          {failing.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {failing.length} failing condition{failing.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
        {failing.length > 0 && (
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && failing.length > 0 && (
        <div className="border-t border-border">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-2 text-left font-medium">Metric</th>
                <th className="px-5 py-2 text-left font-medium">Actual</th>
                <th className="px-5 py-2 text-left font-medium">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {failing.map((c) => (
                <tr key={c.metric} className="border-t border-border">
                  <td className="px-5 py-2 font-mono text-xs">{c.metric}</td>
                  <td className="px-5 py-2 text-error">{c.actualValue ?? '—'}</td>
                  <td className="px-5 py-2 text-muted-foreground">
                    {c.operator} {c.errorThreshold ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
