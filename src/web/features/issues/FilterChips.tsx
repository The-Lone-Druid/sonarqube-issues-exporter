import { cn } from '../../lib/utils';

interface FilterChipsProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function FilterChips({ label, options, selected, onChange }: FilterChipsProps) {
  const toggle = (value: string): void => {
    onChange(selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value]);
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      {options.map((opt) => {
        const isOn = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              'rounded-md border px-2 py-0.5 text-xs transition-colors',
              isOn
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-accent',
            )}
          >
            {opt.replace(/_/g, ' ')}
          </button>
        );
      })}
    </div>
  );
}
