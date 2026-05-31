import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ServerCrash } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
      <div className="text-success">{icon ?? <CheckCircle2 className="h-10 w-10" />}</div>
      <div className="text-lg font-medium">{title}</div>
      {description && <div className="max-w-md text-sm text-muted-foreground">{description}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-error/40">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-error" />
        <div className="text-sm text-muted-foreground">{message}</div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ConnectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ServerCrash className="h-12 w-12 text-error" />
      <div className="text-xl font-semibold">Can’t reach SonarQube</div>
      <div className="max-w-md text-sm text-muted-foreground">{message}</div>
      {onRetry && <Button onClick={onRetry}>Retry</Button>}
    </div>
  );
}
