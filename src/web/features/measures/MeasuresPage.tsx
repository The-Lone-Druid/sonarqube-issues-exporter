import { useSelection } from '../../hooks/use-selection';
import { useMeasures } from '../../hooks/use-queries';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { ErrorState } from '../../components/shared/states';
import { RatingBadge } from '../../components/shared/badges';
import { formatNumber, formatPercent } from '../../lib/format';

export function MeasuresPage() {
  const { project, ref, newCode } = useSelection();
  const { data, isLoading, isError, error, refetch } = useMeasures(project, ref, newCode);

  if (!project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Select a project to view measures.
      </div>
    );
  }
  if (isLoading && !data) return <Skeleton className="h-64 w-full" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Measure label="Coverage" value={formatPercent(data.coverage)} />
      <Measure label="Duplication" value={formatPercent(data.duplicatedLinesDensity)} />
      <Measure label="Lines of Code" value={formatNumber(data.linesOfCode)} />
      <Measure label="Technical Debt" value={data.technicalDebt ?? '—'} />
      <Measure label="Complexity" value={formatNumber(data.complexity)} />
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Ratings</span>
          <Rating label="Reliability" value={data.reliabilityRating} />
          <Rating label="Security" value={data.securityRating} />
          <Rating label="Maintainability" value={data.maintainabilityRating} />
        </CardContent>
      </Card>
    </div>
  );
}

function Measure({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Rating({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <RatingBadge value={value} />
    </div>
  );
}
