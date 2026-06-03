import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../lib/theme';
import { colorFor } from '../../lib/colors';

interface BreakdownProps {
  data: Record<string, number>;
  colors: Record<string, string>;
  /** Disable animation for deterministic PDF rendering. */
  static?: boolean;
}

function toEntries(data: Record<string, number>): Array<{ name: string; value: number }> {
  return Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function tooltipFormatter(
  params: { name: string; value: number; color: string }[],
  total: number,
): string {
  const p = params[0];
  const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
  return `
    <div style="display:flex;align-items:center;gap:6px;padding:2px 0">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};flex-shrink:0"></span>
      <span style="font-weight:500">${p.name}</span>
      <span style="margin-left:auto;padding-left:12px;font-weight:600">${p.value}</span>
      <span style="color:#94a3b8;font-size:11px">(${pct}%)</span>
    </div>`;
}

export function BreakdownBar({ data, colors, static: isStatic }: BreakdownProps) {
  const { resolved } = useTheme();
  const entries = toEntries(data);
  if (entries.length === 0) return <Empty />;

  const total = entries.reduce((s, e) => s + e.value, 0);
  const isDark = resolved === 'dark';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const bgColor = 'transparent';

  const option = {
    animation: !isStatic,
    backgroundColor: bgColor,
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: entries.map((e) => e.name),
      inverse: true,
      axisLabel: { color: labelColor, fontSize: 12, fontFamily: 'Inter, sans-serif' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      borderWidth: 1,
      borderRadius: 8,
      padding: [8, 12],
      textStyle: { color: isDark ? '#e2e8f0' : '#0f172a', fontSize: 12 },
      formatter: (params: { name: string; value: number; color: string }) =>
        tooltipFormatter([params], total),
    },
    series: [
      {
        type: 'bar',
        data: entries.map((e) => ({
          value: e.value,
          itemStyle: { color: colorFor(colors, e.name), borderRadius: [0, 4, 4, 0] },
        })),
        barMaxWidth: 28,
        label: { show: false },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 220, width: '100%' }} notMerge />;
}

export function BreakdownDonut({ data, colors, static: isStatic }: BreakdownProps) {
  const { resolved } = useTheme();
  const entries = toEntries(data);
  if (entries.length === 0) return <Empty />;

  const total = entries.reduce((s, e) => s + e.value, 0);
  const isDark = resolved === 'dark';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  const option = {
    animation: !isStatic,
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      borderWidth: 1,
      borderRadius: 8,
      padding: [8, 12],
      textStyle: { color: isDark ? '#e2e8f0' : '#0f172a', fontSize: 12 },
      formatter: (params: { name: string; value: number; color: string }) =>
        tooltipFormatter([params], total),
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: labelColor, fontSize: 12 },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '42%'],
        padAngle: 2,
        data: entries.map((e) => ({
          name: e.name,
          value: e.value,
          itemStyle: { color: colorFor(colors, e.name) },
        })),
        label: { show: false },
        emphasis: { scale: true, scaleSize: 4 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 220, width: '100%' }} notMerge />;
}

function Empty() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      No data
    </div>
  );
}
