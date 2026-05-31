import { useEffect } from 'react';
import { useSelection } from '../../hooks/use-selection';
import { useConfig, useIssues, useSummary } from '../../hooks/use-queries';
import { BreakdownBar, BreakdownDonut } from '../../components/charts/breakdown';
import { SeverityBadge, RatingBadge, TypeBadge } from '../../components/shared/badges';
import { SEVERITY_COLORS, STATUS_COLORS, TYPE_COLORS } from '../../lib/colors';
import { fileName, formatDate, formatNumber, formatPercent } from '../../lib/format';

/**
 * Print-optimised, chrome-less report. Rendered standalone and captured by
 * Playwright (or the browser's own print) into a PDF. Signals readiness via
 * `data-report-ready` / window.__REPORT_READY__ once data has settled.
 */
export function ReportView() {
  const { project, ref } = useSelection();
  const config = useConfig();
  const summary = useSummary(project, ref);
  const issues = useIssues(project, ref);

  const settled =
    !!project &&
    (summary.isSuccess || summary.isError) &&
    (issues.isSuccess || issues.isError);

  useEffect(() => {
    if (settled) {
      (window as unknown as { __REPORT_READY__?: boolean }).__REPORT_READY__ = true;
    }
  }, [settled]);

  if (!project) {
    return <div className="p-10 text-center">No project selected.</div>;
  }
  if (!summary.data) {
    return <div className="p-10 text-center text-muted-foreground">Preparing report…</div>;
  }

  const { qualityGate, measures, hotspots, issues: facets } = summary.data;
  const allIssues = issues.data?.issues ?? [];
  const topIssues = [...allIssues]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 25);

  const refLabel = ref ? `${ref.type === 'pr' ? 'PR' : 'branch'} ${ref.value}` : 'main branch';

  return (
    <div
      data-report-ready={settled ? 'true' : 'false'}
      className="mx-auto max-w-4xl bg-white p-10 text-slate-900"
      style={{ colorScheme: 'light' }}
    >
      <header className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold">SonarQube Report</h1>
        <div className="mt-1 text-sm text-slate-500">
          {project} · {refLabel} · {config.data?.url}
        </div>
        <div className="text-sm text-slate-500">Generated {formatDate(new Date().toISOString())}</div>
      </header>

      <section className="mb-8 break-inside-avoid">
        <h2 className="mb-3 text-lg font-semibold">Executive summary</h2>
        <div
          className="mb-4 rounded-lg border p-4"
          style={{
            borderColor: qualityGate.status === 'PASSED' ? '#22c55e' : '#ef4444',
            background: qualityGate.status === 'PASSED' ? '#f0fdf4' : '#fef2f2',
          }}
        >
          Quality Gate:{' '}
          <strong>{qualityGate.status === 'PASSED' ? 'Passed' : qualityGate.status}</strong>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Bugs" value={formatNumber(facets.types['BUG'] ?? 0)} />
          <Stat label="Vulnerabilities" value={formatNumber(facets.types['VULNERABILITY'] ?? 0)} />
          <Stat label="Code Smells" value={formatNumber(facets.types['CODE_SMELL'] ?? 0)} />
          <Stat label="Hotspots" value={formatNumber(hotspots.total)} />
          <Stat label="Coverage" value={formatPercent(measures.coverage)} />
          <Stat label="Tech Debt" value={measures.technicalDebt ?? '—'} />
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <span>
            Reliability <RatingBadge value={measures.reliabilityRating} />
          </span>
          <span>
            Security <RatingBadge value={measures.securityRating} />
          </span>
          <span>
            Maintainability <RatingBadge value={measures.maintainabilityRating} />
          </span>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-6 break-inside-avoid">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Issues by Severity</h3>
          <BreakdownBar data={facets.severities} colors={SEVERITY_COLORS} static />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Issues by Type</h3>
          <BreakdownDonut data={facets.types} colors={TYPE_COLORS} static />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Issues by Status</h3>
          <BreakdownDonut data={facets.statuses} colors={STATUS_COLORS} static />
        </div>
      </section>

      <section className="break-inside-avoid">
        <h2 className="mb-3 text-lg font-semibold">Top issues</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-left">
              <th className="py-1 pr-2">Severity</th>
              <th className="py-1 pr-2">Type</th>
              <th className="py-1 pr-2">Message</th>
              <th className="py-1">Location</th>
            </tr>
          </thead>
          <tbody>
            {topIssues.map((i) => (
              <tr key={i.key} className="border-b border-slate-100 align-top">
                <td className="py-1 pr-2">
                  <SeverityBadge value={i.severity} />
                </td>
                <td className="py-1 pr-2">
                  <TypeBadge value={i.type} />
                </td>
                <td className="py-1 pr-2">{i.message}</td>
                <td className="py-1 font-mono text-slate-500">
                  {fileName(i.component)}
                  {i.line ? `:${i.line}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function severityRank(sev: string): number {
  return ['INFO', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER'].indexOf(sev);
}
