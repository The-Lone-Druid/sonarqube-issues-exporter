import type { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  accent?: string;
  className?: string;
}

export function MetricCard({ label, value, icon, hint, accent, className }: MetricCardProps) {
  return (
    <Card className={cn('break-inside-avoid animate-fade-in-up', className)}>
      <CardContent className="flex items-center gap-4 p-5">
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200"
            style={
              accent
                ? { backgroundColor: `${accent}20`, color: accent, boxShadow: `0 0 0 1px ${accent}18` }
                : undefined
            }
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="text-2xl font-bold leading-tight tracking-tight">{value}</div>
          {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
