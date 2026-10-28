import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  RefreshCw,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DashboardResponse,
  PAUTA_GROUPS,
  PAUTA_LABELS,
  formatPortions,
} from '../../types/nutrition';
import { nutritionRequest } from '../../utils/nutritionApi';
import { getTodayDateString } from '../../hooks/useMacroStore';

const number = (value: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(value);
const count = (value: number, singular: string, plural: string) =>
  `${number(value)} ${value === 1 ? singular : plural}`;
const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
  });
export function rangeStart(end: string, days: number) {
  return new Date(Date.parse(end) - (days - 1) * 86400000)
    .toISOString()
    .slice(0, 10);
}
const metrics = {
  calories: {
    label: 'Energía',
    unit: 'kcal',
    color: '#34d399',
    goal: 'calories',
  },
  protein: {
    label: 'Proteínas',
    unit: 'g',
    color: '#34d399',
    goal: 'proteinGrams',
  },
  carbs: {
    label: 'Carbohidratos',
    unit: 'g',
    color: '#fbbf24',
    goal: 'carbsGrams',
  },
  fat: { label: 'Grasas', unit: 'g', color: '#fb7185', goal: 'fatGrams' },
} as const;
const panel =
  'min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5';
const input =
  'min-h-11 min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';

export default function DashboardView({
  date,
  onOpenDiary,
}: {
  date: string;
  onOpenDiary: (date: string) => void;
}) {
  const today = getTodayDateString();
  const [end, setEnd] = useState(date > today ? today : date);
  const [period, setPeriod] = useState(7);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    data?: DashboardResponse;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  const [selected, setSelected] = useState(end);
  const [metric, setMetric] = useState<keyof typeof metrics>('calories');
  const [group, setGroup] = useState<(typeof PAUTA_GROUPS)[number]>('protein');
  const from = rangeStart(end, period);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    setState({ loading: true });
    nutritionRequest<DashboardResponse>(
      `/dashboard?from=${from}&to=${end}`,
      'GET',
      undefined,
      controller.signal
    )
      .then((data) => {
        if (active) setState({ data, loading: false });
      })
      .catch((error) => {
        if (active)
          setState({
            loading: false,
            error:
              error instanceof Error && error.name !== 'AbortError'
                ? error.message
                : 'No se pudo cargar el seguimiento. Intenta nuevamente.',
          });
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [from, end, revision]);

  const data = state.data;
  const days = data?.days ?? [];
  const recorded = days.filter((day) => day.mealCount > 0);
  const day = days.find((day) => day.date === selected) ?? days.at(-1);
  const info = metrics[metric];
  const chart = useMemo(
    () =>
      days.map((day) => ({
        date: day.date,
        value: day.mealCount ? day.totals[metric] : null,
        portions: day.mealCount && day.plan ? day.plan.consumed[group] : null,
        target: day.plan?.targets[group] ?? null,
        water: day.waterIntakeMl > 0 ? day.waterIntakeMl / 1000 : null,
        waterTarget:
          (day.plan?.waterTargetMl ?? data?.goals?.waterTargetMl ?? 0) / 1000 ||
          null,
      })),
    [days, metric, group, data?.goals]
  );
  const pending = days.reduce((sum, day) => sum + (day.plan?.pending ?? 0), 0);
  const goal = data?.goals?.[info.goal];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Mi seguimiento</h1>
          <p className="mt-1 text-sm text-slate-400">
            Tu evolución en macros, porciones y agua.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenDiary(today)}
          className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950"
        >
          Registrar comida <ArrowRight className="size-4" />
        </button>
      </div>
      <section
        aria-label="Período del seguimiento"
        className={`${panel} flex flex-wrap items-end gap-3`}
      >
        <label className="flex flex-col gap-1.5 text-xs text-slate-400">
          Período
          <select
            aria-label="Período"
            className={input}
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value))}
          >
            {[7, 30, 90].map((days) => (
              <option key={days} value={days}>
                Últimos {days} días
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-slate-400">
          Hasta el
          <input
            aria-label="Fin del período"
            type="date"
            className={input}
            value={end}
            max={today}
            onChange={(event) => {
              const value = event.target.value;
              if (/^\d{4}-\d{2}-\d{2}$/.test(value) && value <= today) {
                setEnd(value);
                setSelected(value);
              }
            }}
          />
        </label>
        <p className="self-center text-xs text-slate-400">
          {dateLabel(from)} – {dateLabel(end)}
        </p>
        <button
          type="button"
          onClick={() => setRevision((value) => value + 1)}
          disabled={state.loading}
          aria-label="Actualizar seguimiento"
          title="Actualizar seguimiento"
          className={`${input} ml-auto grid size-11 place-items-center disabled:opacity-40`}
        >
          <RefreshCw className="size-4" />
        </button>
      </section>
      {state.loading ? (
        <p role="status" className={panel}>
          Cargando tu seguimiento…
        </p>
      ) : state.error ? (
        <div role="alert" className={`${panel} text-rose-300`}>
          <p>{state.error}</p>
          <button
            type="button"
            className="mt-3 underline"
            onClick={() => setRevision((value) => value + 1)}
          >
            Reintentar
          </button>
        </div>
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Stat
                icon={CalendarDays}
                label="Días con comidas"
                value={`${recorded.length} / ${days.length}`}
                detail="Días con alimentos registrados"
              />
              <Stat
                icon={BarChart3}
                label="Energía media"
                value={
                  recorded.length
                    ? `${number(
                        recorded.reduce(
                          (sum, day) => sum + day.totals.calories,
                          0
                        ) / recorded.length
                      )} kcal`
                    : 'Sin registros'
                }
                detail="Promedio de días con comidas"
              />
              <Stat
                icon={CheckCheck}
                label="Sobre meta de energía"
                value={
                  data.goals
                    ? count(
                        recorded.filter(
                          (day) => day.totals.calories > data.goals!.calories
                        ).length,
                        'día',
                        'días'
                      )
                    : 'Sin meta'
                }
                detail={
                  data.goals
                    ? `Referencia actual: ${number(data.goals.calories)} kcal`
                    : 'Configura tus metas en Calculadora'
                }
              />
              <Stat
                icon={CircleAlert}
                label="Sin clasificar"
                value={count(pending, 'alimento', 'alimentos')}
                detail="Porciones pendientes en el período"
              />
            </div>
            {!recorded.length && (
              <p role="status" className={`${panel} text-sm text-slate-300`}>
                Todavía no hay comidas registradas en este período. Registra
                alimentos o selecciona otras fechas para ver tu evolución.
              </p>
            )}
            <p className="text-xs leading-relaxed text-slate-400">
              Los macros se comparan con tu meta actual; no se conserva un
              historial de esas metas. Las porciones usan la versión de pauta de
              cada día. Un día registrado puede estar incompleto: estos gráficos
              reflejan lo que ingresaste.
            </p>

            <section className={panel} aria-labelledby="macro-chart-heading">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="macro-chart-heading" className="font-semibold">
                    Evolución de consumo
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Consumo diario y meta actual · {info.unit}
                  </p>
                </div>
                <select
                  aria-label="Indicador del gráfico"
                  value={metric}
                  onChange={(event) =>
                    setMetric(event.target.value as keyof typeof metrics)
                  }
                  className={input}
                >
                  {Object.entries(metrics).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <TrendChart
                data={chart}
                lines={[{ key: 'value', name: info.label, color: info.color }]}
                unit={info.unit}
                goal={goal}
              />
            </section>
            <div className="grid gap-4 xl:grid-cols-2">
              <section
                className={panel}
                aria-labelledby="portion-chart-heading"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 id="portion-chart-heading" className="font-semibold">
                      Porciones de mi pauta
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Consumidas y meta histórica del grupo
                    </p>
                  </div>
                  <select
                    className={input}
                    aria-label="Grupo de pauta del gráfico"
                    value={group}
                    onChange={(event) =>
                      setGroup(event.target.value as typeof group)
                    }
                  >
                    {PAUTA_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {PAUTA_LABELS[group]}
                      </option>
                    ))}
                  </select>
                </div>
                {days.some((day) => day.plan) ? (
                  <>
                    <TrendChart
                      data={chart}
                      lines={[
                        {
                          key: 'portions',
                          name: 'Consumidas',
                          color: '#a78bfa',
                        },
                        {
                          key: 'target',
                          name: 'Meta',
                          color: '#64748b',
                          dashed: true,
                        },
                      ]}
                      unit="porciones"
                    />
                    <p className="text-xs text-slate-400">
                      Los alimentos pendientes no suman porciones. Libre / sin
                      meta no equivale a una meta de cero.
                    </p>
                  </>
                ) : (
                  <p className="py-12 text-center text-sm text-slate-400">
                    No hay pauta activa para las fechas seleccionadas.
                  </p>
                )}
              </section>
              <section className={panel} aria-labelledby="water-chart-heading">
                <h2 id="water-chart-heading" className="font-semibold">
                  Hidratación
                </h2>
                <p className="mb-4 mt-1 text-xs text-slate-400">
                  Agua registrada y objetivo diario · litros
                </p>
                <TrendChart
                  data={chart}
                  lines={[
                    { key: 'water', name: 'Agua', color: '#22d3ee' },
                    {
                      key: 'waterTarget',
                      name: 'Objetivo',
                      color: '#64748b',
                      dashed: true,
                    },
                  ]}
                  unit="L"
                />
                <p className="text-xs text-slate-400">
                  Objetivo de la pauta del día o, si no hay pauta, de tu
                  configuración actual.
                </p>
              </section>
            </div>

            {day && (
              <section className={panel} aria-labelledby="day-detail-heading">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 id="day-detail-heading" className="font-semibold">
                      Detalle de un día
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {count(day.mealCount, 'alimento', 'alimentos')} ·{' '}
                      {formatPortions(day.waterIntakeMl / 1000)} L de agua
                    </p>
                  </div>
                  <label className="sr-only" htmlFor="dashboard-day">
                    Día del detalle
                  </label>
                  <select
                    id="dashboard-day"
                    className={input}
                    value={day.date}
                    onChange={(event) => setSelected(event.target.value)}
                  >
                    {[...days].reverse().map((day) => (
                      <option key={day.date} value={day.date}>
                        {dateLabel(day.date)}
                        {!day.mealCount ? ' · Sin comidas' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mb-4 text-xs text-cyan-300">
                  Agua: {formatPortions(day.waterIntakeMl / 1000)} L · Objetivo:{' '}
                  {day.plan?.waterIsMinimum ? 'más de ' : ''}
                  {day.plan || data.goals
                    ? `${formatPortions(
                        (day.plan?.waterTargetMl ?? data.goals!.waterTargetMl) /
                          1000
                      )} L`
                    : 'sin configurar'}
                </p>
                {!day.mealCount ? (
                  <p className="mb-4 text-sm text-slate-400">
                    Sin comidas registradas. No se interpreta como consumo cero
                    ni como cumplimiento.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Object.entries(metrics).map(([key, info]) => (
                      <Progress
                        key={key}
                        label={info.label}
                        value={day.totals[key as keyof typeof metrics]}
                        target={data.goals?.[info.goal] ?? null}
                        unit={info.unit}
                        color={info.color}
                      />
                    ))}
                  </div>
                )}
                {day.plan ? (
                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <p className="mb-3 text-sm text-slate-300">
                      {day.plan.name} · versión {day.plan.version}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {PAUTA_GROUPS.map((group) => (
                        <Progress
                          key={group}
                          label={PAUTA_LABELS[group]}
                          value={day.plan!.consumed[group]}
                          target={day.plan!.targets[group]}
                          unit="porciones"
                          color="#a78bfa"
                          noData={!day.mealCount}
                        />
                      ))}
                    </div>
                    {day.plan.pending > 0 && (
                      <p className="mt-3 text-sm text-amber-300">
                        Avance parcial:{' '}
                        {count(
                          day.plan.pending,
                          'alimento pendiente',
                          'alimentos pendientes'
                        )}{' '}
                        de clasificar. Sus macros sí están incluidos.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">
                    Este día no tiene una pauta activa.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onOpenDiary(day.date)}
                  className="mt-4 flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-300"
                >
                  Abrir este día en el diario <ArrowRight className="size-4" />
                </button>
              </section>
            )}
            <details className={panel}>
              <summary className="cursor-pointer py-1 text-sm font-semibold">
                Ver registros y valores de los gráficos
              </summary>
              <p className="my-3 text-xs text-slate-400">
                — indica que no hay registro de comidas o de agua. La meta de
                energía es la actual.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-left text-xs">
                  <caption className="sr-only">
                    Valores diarios del período seleccionado
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      {[
                        'Fecha',
                        'Energía (kcal)',
                        'Proteínas (g)',
                        'Carbohidratos (g)',
                        'Grasas (g)',
                        'Agua (L)',
                        'Sin clasificar',
                      ].map((label) => (
                        <th key={label} scope="col" className="px-3 py-3">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...days].reverse().map((day) => (
                      <tr key={day.date} className="border-b border-slate-800">
                        <th scope="row" className="px-3 py-3">
                          <button
                            type="button"
                            className="min-h-9 text-emerald-300 underline"
                            onClick={() => {
                              setSelected(day.date);
                              onOpenDiary(day.date);
                            }}
                          >
                            {dateLabel(day.date)}
                          </button>
                        </th>
                        {Object.keys(metrics).map((key) => (
                          <td key={key} className="px-3 py-3">
                            {day.mealCount
                              ? number(day.totals[key as keyof typeof metrics])
                              : '—'}
                          </td>
                        ))}
                        <td className="px-3 py-3">
                          {day.waterIntakeMl
                            ? number(day.waterIntakeMl / 1000)
                            : '—'}
                        </td>
                        <td className="px-3 py-3">
                          {day.plan && day.mealCount ? day.plan.pending : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <section className={panel}>
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
        <Icon className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
        {label}
      </div>
      <p className="text-lg font-bold sm:text-2xl">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </section>
  );
}
function Progress({
  label,
  value,
  target,
  unit,
  color,
  noData,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  color: string;
  noData?: boolean;
}) {
  const difference = target == null ? null : target - value;
  const unitLabel = (amount: number) =>
    unit === 'porciones' && amount === 1 ? 'porción' : unit;
  return (
    <div className="min-w-0 rounded-xl bg-slate-950/60 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold" style={{ color }}>
        {noData
          ? 'Sin registro'
          : `${formatPortions(value)} ${unitLabel(value)}`}
        <span className="block text-xs font-normal text-slate-400">
          {target == null
            ? 'Libre / sin meta'
            : `Objetivo: ${number(target)} ${unitLabel(target)}`}
        </span>
      </p>
      {!noData && difference != null && (
        <>
          <div
            role="meter"
            aria-label={`${label}: consumo frente a objetivo`}
            aria-valuemin={0}
            aria-valuemax={Math.max(target!, value, 1)}
            aria-valuenow={value}
            aria-valuetext={`${number(value)} de ${number(target!)} ${unit}`}
            className="my-2 h-1.5 overflow-hidden rounded-full bg-slate-800"
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${
                  target! > 0
                    ? Math.min((value / target!) * 100, 100)
                    : value > 0
                    ? 100
                    : 0
                }%`,
                backgroundColor: color,
              }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {difference > 0
              ? `${difference === 1 ? 'Falta' : 'Faltan'} ${number(
                  difference
                )} ${unitLabel(difference)}`
              : difference < 0
              ? `${number(-difference)} ${unitLabel(
                  -difference
                )} sobre objetivo`
              : 'Objetivo alcanzado'}
          </p>
        </>
      )}
    </div>
  );
}
function TrendChart({
  data,
  lines,
  unit,
  goal,
}: {
  data: Array<{ date: string }>;
  lines: Array<{ key: string; name: string; color: string; dashed?: boolean }>;
  unit: string;
  goal?: number;
}) {
  return (
    <div>
      <div
        className="h-52 w-full min-w-0 sm:h-60"
        role="img"
        aria-label={`Gráfico diario en ${unit}. Valores disponibles en la tabla de registros.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 14, right: 12, bottom: 0, left: -18 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={dateLabel}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              minTickGap={35}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 'auto']}
            />
            <Tooltip
              labelFormatter={(value) => dateLabel(String(value))}
              formatter={(value: number, name: string) => [
                `${number(value)} ${unit}`,
                name,
              ]}
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            {goal != null && (
              <ReferenceLine
                y={goal}
                ifOverflow="extendDomain"
                stroke="#94a3b8"
                strokeDasharray="4 4"
              />
            )}
            {lines.map((line) => (
              <Line
                key={line.key}
                type="linear"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                strokeDasharray={line.dashed ? '4 4' : undefined}
                connectNulls={false}
                dot={{ r: data.length <= 30 ? 3 : 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
        {lines.map((line) => (
          <span key={line.key} className="flex items-center gap-2">
            <span className="h-0.5 w-4" style={{ background: line.color }} />
            {line.name}
          </span>
        ))}
        {goal != null && (
          <span>
            ··· Meta actual: {number(goal)} {unit}
          </span>
        )}
      </div>
    </div>
  );
}
