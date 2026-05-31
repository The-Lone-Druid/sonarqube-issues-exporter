import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { SonarQubeIssue } from '../../../core/types';
import { useSelection } from '../../hooks/use-selection';
import { useIssues } from '../../hooks/use-queries';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/shared/states';
import { SeverityBadge, StatusBadge, TypeBadge } from '../../components/shared/badges';
import { FilterChips } from './FilterChips';
import { IssueDetailSheet } from './IssueDetailSheet';
import { fileName } from '../../lib/format';
import { cn } from '../../lib/utils';

const SEVERITIES = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO'];
const TYPES = ['BUG', 'VULNERABILITY', 'CODE_SMELL'];
const STATUSES = ['OPEN', 'CONFIRMED', 'REOPENED', 'RESOLVED'];

export function IssuesPage() {
  const { project, ref } = useSelection();
  const { data, isLoading, isError, error, refetch } = useIssues(project, ref);

  const [search, setSearch] = useState('');
  const [sev, setSev] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [active, setActive] = useState<SonarQubeIssue | null>(null);

  const issues = useMemo(() => data?.issues ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((i) => {
      if (sev.length && !sev.includes(i.severity)) return false;
      if (types.length && !types.includes(i.type)) return false;
      if (statuses.length && !statuses.includes(i.status)) return false;
      if (q && !`${i.message} ${i.component} ${i.rule}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [issues, search, sev, types, statuses]);

  const columns = useMemo<ColumnDef<SonarQubeIssue>[]>(
    () => [
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => <SeverityBadge value={row.original.severity} />,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <TypeBadge value={row.original.type} />,
      },
      {
        accessorKey: 'message',
        header: 'Message',
        cell: ({ row }) => (
          <div className="max-w-[420px]">
            <div className="truncate">{row.original.message}</div>
            <div className="truncate font-mono text-xs text-muted-foreground">
              {fileName(row.original.component)}
              {row.original.line ? `:${row.original.line}` : ''}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'rule',
        header: 'Rule',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.rule}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge value={row.original.status} />,
      },
      { accessorKey: 'effort', header: 'Effort', cell: ({ row }) => row.original.effort ?? '—' },
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  if (!project) return <SelectPrompt />;
  if (isLoading && !data) return <Skeleton className="h-96 w-full" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues…"
            className="h-9 w-64 rounded-md border border-border bg-card pl-8 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {issues.length} issues
        </span>
      </div>

      <div className="flex flex-wrap gap-4">
        <FilterChips label="Severity" options={SEVERITIES} selected={sev} onChange={setSev} />
        <FilterChips label="Type" options={TYPES} selected={types} onChange={setTypes} />
        <FilterChips label="Status" options={STATUSES} selected={statuses} onChange={setStatuses} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No issues match" description="Try clearing some filters." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th key={header.id} className="px-4 py-2 text-left font-medium">
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                          type="button"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-t border-border hover:bg-accent/50"
                    onClick={() => setActive(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-sm">
            <span className="text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <IssueDetailSheet issue={active} onClose={() => setActive(null)} />
    </div>
  );
}

function SelectPrompt() {
  return (
    <div className={cn('flex min-h-[50vh] items-center justify-center text-muted-foreground')}>
      Select a project to view issues.
    </div>
  );
}
