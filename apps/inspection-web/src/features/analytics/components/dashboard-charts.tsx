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
          <CartesianGrid horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={95}
            tick={{ fill: '#334155', fontSize: 12 }}
          />
          <Tooltip formatter={(value: number) => [value, 'Hallazgos']} />
          <Bar
            dataKey="count"
            fill="#334155"
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
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="period"
            tick={{ fill: '#64748b', fontSize: 11 }}
            minTickGap={12}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip formatter={(value: number) => [value, 'Trabajos']} />
          <Bar
            dataKey="works"
            fill="#0f172a"
            radius={[4, 4, 0, 0]}
            maxBarSize={34}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
