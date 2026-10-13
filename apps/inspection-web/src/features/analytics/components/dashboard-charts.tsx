import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ActivityPoint, SeverityCount } from '../models';

export function FindingsBySeverityChart({ rows }: { rows: SeverityCount[] }) {
  return (
    <div
      style={{ height: Math.max(220, rows.length * 46) }}
      role="img"
      aria-label="Gráfico de hallazgos por criticidad"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 12, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={95}
            tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
          />
          <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip)', borderColor: 'var(--chart-grid)', color: 'var(--chart-text)', borderRadius: 8 }} itemStyle={{ color: 'var(--chart-text)' }} formatter={(value: number) => [value, 'Hallazgos']} />
          <Bar
            dataKey="count"
            fill="var(--chart-bar)"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WorkActivityChart({ rows }: { rows: ActivityPoint[] }) {
  return (
    <div
      className="h-64"
      role="img"
      aria-label="Gráfico de trabajos realizados en el tiempo"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="period"
            tick={{ fill: 'var(--chart-text)', fontSize: 11 }}
            minTickGap={12}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
          />
          <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip)', borderColor: 'var(--chart-grid)', color: 'var(--chart-text)', borderRadius: 8 }} itemStyle={{ color: 'var(--chart-text)' }} formatter={(value: number) => [value, 'Trabajos']} />
          <Bar
            dataKey="works"
            fill="var(--chart-bar)"
            radius={[4, 4, 0, 0]}
            maxBarSize={34}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
