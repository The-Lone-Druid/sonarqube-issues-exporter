import { Bug, Code2, Gauge, Percent, ShieldAlert, Timer } from 'lucide-react';
import { useSelection } from '../../hooks/use-selection';
import { useSummary } from '../../hooks/use-queries';
import { MetricCard } from '../../components/shared/metric-card';
import { RatingBadge } from '../../components/shared/badges';
import { BreakdownBar, BreakdownDonut } from '../../components/charts/breakdown';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { ErrorState } from '../../components/shared/states';
import { QualityGateBanner } from './QualityGateBanner';
import { SEVERITY_COLORS, STATUS_COLORS, TYPE_COLORS } from '../../lib/colors';
import { formatNumber, formatPercent } from '../../lib/format';

export function OverviewPage() {
  const { project, ref, newCode } = useSelection();
  const { data, isLoading, isError, error, refetch } = useSummary(project, ref, newCode);

  if (!project) return <SelectPrompt />;
  if (isLoading && !data) return <OverviewSkeleton />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const { qualityGate, measures, hotspots, issues } = data;
  const types = issues.types;

  return (
    <div className="flex flex-col gap-6">
      <QualityGateBanner status={qualityGate} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 stagger-children">
        <MetricCard
          label="Bugs"
          value={formatNumber(types['BUG'] ?? 0)}
          icon={<Bug className="h-5 w-5" />}
          accent={TYPE_COLORS['BUG']}
        />
        <MetricCard
          label="Vulnerabilities"
          value={formatNumber(types['VULNERABILITY'] ?? 0)}
          icon={<ShieldAlert className="h-5 w-5" />}
          accent={TYPE_COLORS['VULNERABILITY']}
        />
        <MetricCard
          label="Code Smells"
          value={formatNumber(types['CODE_SMELL'] ?? 0)}
          icon={<Code2 className="h-5 w-5" />}
          accent={TYPE_COLORS['CODE_SMELL']}
        />
        <MetricCard
          label="Hotspots"
          value={formatNumber(hotspots.total)}
          icon={<ShieldAlert className="h-5 w-5" />}
          accent={TYPE_COLORS['SECURITY_HOTSPOT']}
        />
        <MetricCard
          label="Coverage"
          value={formatPercent(measures.coverage)}
          icon={<Percent className="h-5 w-5" />}
          accent="#0ea5e9"
        />
        <MetricCard
          label="Tech Debt"
          value={measures.technicalDebt ?? '—'}
          icon={<Timer className="h-5 w-5" />}
          accent="#f59e0b"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RatingCard label="Reliability" value={measures.reliabilityRating} />
        <RatingCard label="Security" value={measures.securityRating} />
        <RatingCard label="Maintainability" value={measures.maintainabilityRating} />
        <MetricCard
          label="Lines of Code"
          value={formatNumber(measures.linesOfCode)}
          icon={<Gauge className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 stagger-children">
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>Issues by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBar data={issues.severities} colors={SEVERITY_COLORS} />
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>Issues by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownDonut data={issues.types} colors={TYPE_COLORS} />
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>Issues by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownDonut data={issues.statuses} colors={STATUS_COLORS} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RatingCard({ label, value }: { label: string; value?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <RatingBadge value={value} />
      </CardContent>
    </Card>
  );
}

function SelectPrompt() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      Select a project to get started.
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}
