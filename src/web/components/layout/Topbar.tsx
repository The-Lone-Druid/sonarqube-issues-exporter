import { Moon, RefreshCw, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../lib/theme';
import { useSelection } from '../../hooks/use-selection';
import { useRefresh, useSummary } from '../../hooks/use-queries';
import { formatRelative } from '../../lib/format';
import { BranchPrSelector, ProjectSwitcher } from './selectors';
import { ExportMenu } from './ExportMenu';
import { NewCodeToggle } from './NewCodeToggle';
import { ScanButton } from './ScanButton';
import { cn } from '../../lib/utils';

export function Topbar() {
  const { resolved, toggle } = useTheme();
  const { project, ref, newCode } = useSelection();
  const refresh = useRefresh(project);
  const summary = useSummary(project, ref, newCode);

  return (
    <header className="no-print sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md [background:linear-gradient(to_right,var(--background)/90,var(--background)/95)]">
      <ProjectSwitcher />
      <BranchPrSelector />
      <NewCodeToggle />

      <div className="ml-auto flex items-center gap-2">
        {summary.dataUpdatedAt > 0 && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Updated {formatRelative(new Date(summary.dataUpdatedAt).toISOString())}
          </span>
        )}
        <ScanButton />
        <ExportMenu />
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCw className={cn('h-4 w-4', summary.isFetching && 'animate-spin')} />
        </Button>
        <Button variant="outline" size="icon" onClick={toggle} aria-label="Toggle theme">
          {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
