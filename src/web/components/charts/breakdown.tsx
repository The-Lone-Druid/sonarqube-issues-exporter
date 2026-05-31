import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { colorFor } from '../../lib/colors';

interface BreakdownProps {
  data: Record<string, number>;
  colors: Record<string, string>;
  /** Disable animation for deterministic PDF rendering. */
  static?: boolean;
}

function toData(data: Record<string, number>): Array<{ name: string; value: number }> {
  return Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function BreakdownBar({ data, colors, static: isStatic }: BreakdownProps) {
  const rows = toData(data);
  if (rows.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
        />
        <Tooltip
          cursor={{ fill: 'var(--muted)' }}
          contentStyle={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={!isStatic}>
          {rows.map((row) => (
            <Cell key={row.name} fill={colorFor(colors, row.name)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BreakdownDonut({ data, colors, static: isStatic }: BreakdownProps) {
  const rows = toData(data);
  if (rows.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          isAnimationActive={!isStatic}
        >
          {rows.map((row) => (
            <Cell key={row.name} fill={colorFor(colors, row.name)} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      No data
    </div>
  );
}
