import { useSelection } from '../../hooks/use-selection';
import { cn } from '../../lib/utils';

/** Toggle between overall code and new code (Clean as You Code). */
export function NewCodeToggle() {
  const { project, newCode, setNewCode } = useSelection();
  if (!project) return null;

  return (
    <div className="flex items-center rounded-md border border-border p-0.5 text-xs">
      {(
        [
          ['Overall', false],
          ['New code', true],
        ] as Array<[string, boolean]>
      ).map(([label, value]) => (
        <button
          key={label}
          type="button"
          onClick={() => setNewCode(value)}
          className={cn(
            'rounded px-2 py-1 transition-colors',
            newCode === value
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
