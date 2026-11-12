export const PLANNING_POKER_SCALE = [
  { points: 1, effort: 'Menos de medio día' },
  { points: 2, effort: 'Medio día' },
  { points: 3, effort: '1 día' },
  { points: 5, effort: '2 días' },
  { points: 8, effort: '3 días' },
  { points: 13, effort: '4 días' },
  { points: 21, effort: '1 semana' },
]

export function PlanningPokerGuide() {
  return (
    <details className="text-xs text-muted-foreground">
      <summary className="w-fit cursor-pointer underline decoration-dotted underline-offset-2">Guía de estimación</summary>
      <dl className="mt-2 space-y-1 rounded-md border bg-muted/30 p-2">
        {PLANNING_POKER_SCALE.map(({ points, effort }) => (
          <div key={points} className="flex items-baseline justify-between gap-2">
            <dt className="shrink-0 font-semibold tabular-nums">{points} pt{points === 1 ? '' : 's'}</dt>
            <dd className="text-right">{effort}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-1">Si supera 21 pts, considera dividir el ticket.</p>
    </details>
  )
}
