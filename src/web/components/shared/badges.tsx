import { Badge } from '../ui/badge';
import {
  PRIORITY_COLORS,
  RATING_COLORS,
  SEVERITY_COLORS,
  STATUS_COLORS,
  TYPE_COLORS,
  colorFor,
} from '../../lib/colors';

export function SeverityBadge({ value }: { value: string }) {
  return <Badge color={colorFor(SEVERITY_COLORS, value)}>{value}</Badge>;
}

export function TypeBadge({ value }: { value: string }) {
  return <Badge color={colorFor(TYPE_COLORS, value)}>{value.replace(/_/g, ' ')}</Badge>;
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge color={colorFor(STATUS_COLORS, value)}>{value}</Badge>;
}

export function PriorityBadge({ value }: { value: string }) {
  return <Badge color={colorFor(PRIORITY_COLORS, value)}>{value}</Badge>;
}

export function RatingBadge({ value }: { value?: string }) {
  if (!value || value === 'N/A') return <Badge>N/A</Badge>;
  return (
    <Badge color={colorFor(RATING_COLORS, value)} className="font-mono font-bold">
      {value}
    </Badge>
  );
}
