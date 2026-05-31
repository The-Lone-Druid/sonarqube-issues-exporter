import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
}

/** A pill badge. Pass `color` (hex) to tint it semantically. */
export function Badge({ className, color, style, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        !color && 'bg-muted text-muted-foreground',
        className,
      )}
      style={
        color
          ? { backgroundColor: `${color}22`, color, border: `1px solid ${color}55`, ...style }
          : style
      }
      {...props}
    >
      {children}
    </span>
  );
}
