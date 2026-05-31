import { ShieldCheck } from 'lucide-react';
import { useSelection } from '../../hooks/use-selection';
import { useHotspots } from '../../hooks/use-queries';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/shared/states';
import { PriorityBadge } from '../../components/shared/badges';
import { BreakdownBar } from '../../components/charts/breakdown';
import { PRIORITY_COLORS } from '../../lib/colors';
import { fileName } from '../../lib/format';

export function HotspotsPage() {
  const { project, ref } = useSelection();
  const { data, isLoading, isError, error, refetch } = useHotspots(project, ref);

  if (!project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Select a project to view hotspots.
      </div>
    );
  }
  if (isLoading && !data) return <Skeleton className="h-96 w-full" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data || data.total === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="h-10 w-10" />}
        title="No security hotspots to review"
        description="All hotspots have been reviewed or none were detected."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBar data={data.byPriority} colors={PRIORITY_COLORS} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBar data={data.byCategory} colors={{}} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Hotspots ({data.total})</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Priority</th>
                <th className="px-4 py-2 text-left font-medium">Category</th>
                <th className="px-4 py-2 text-left font-medium">Location</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.hotspots.map((h) => (
                <tr key={h.key} className="border-t border-border">
                  <td className="px-4 py-2">
                    <PriorityBadge value={h.vulnerabilityProbability} />
                  </td>
                  <td className="px-4 py-2">{h.securityCategory}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {fileName(h.component)}
                    {h.line ? `:${h.line}` : ''}
                  </td>
                  <td className="px-4 py-2">{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
