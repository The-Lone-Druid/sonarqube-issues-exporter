import type { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  accent?: string;
}

export function MetricCard({ label, value, icon, hint, accent }: MetricCardProps) {
  return (
    <Card className="break-inside-avoid">
      <CardContent className="flex items-center gap-4 p-5">
        {icon && (
          <div
            className={cn('flex h-10 w-10 items-center justify-center rounded-lg')}
            style={accent ? { backgroundColor: `${accent}22`, color: accent } : undefined}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold leading-tight">{value}</div>
          {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
