import {
  calculatePauta,
  findPautaRule,
  formatPortions,
  NutritionPlan,
  PAUTA_LABELS,
  PautaSelection,
  QuantityUnit,
  QUANTITY_LABELS,
} from '../types/nutrition';

export function PautaFoodFields({
  plan,
  foodId,
  foodName,
  amountGrams,
  quantity,
  selection,
  onChange,
}: {
  plan: NutritionPlan;
  foodId: string;
  foodName: string;
  amountGrams: number;
  quantity?: { amount: number; unit: QuantityUnit };
  selection?: PautaSelection;
  onChange: (selection: PautaSelection | undefined) => void;
}) {
  const matchedRule = findPautaRule(plan, foodId, foodName);
  const rule = selection
    ? plan.rules.find((item) => item.id === selection.ruleId)
    : matchedRule;
  const preview = calculatePauta(
    plan,
    { foodId, foodName, amountGrams, quantity },
    selection
  );
  const needsQuantity =
    rule &&
    !rule.free &&
    rule.unit !== (quantity?.unit ?? 'g') &&
    !rule.gramsPerUnit;
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-xs">
      <label className="block text-slate-300">
        Equivalencia de pauta para {foodName}
        <select
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2"
          value={selection ? selection.ruleId ?? '' : 'auto'}
          onChange={(event) => {
            const chosen = plan.rules.find(
              (item) => item.id === event.target.value
            );
            onChange(
              event.target.value === 'auto'
                ? undefined
                : { ruleId: chosen?.id ?? null }
            );
          }}
        >
          <option value="auto">
            {matchedRule
              ? `Automática: ${matchedRule.name}`
              : 'Sin coincidencia exacta'}
          </option>
          <option value="">Dejar pendiente de clasificar</option>
          {plan.rules.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.referenceAmount} {QUANTITY_LABELS[item.unit]}
              {item.free ? ' · libre' : ''}
            </option>
          ))}
        </select>
      </label>
      {rule && <p className="text-slate-400">{rule.notes}</p>}
      {needsQuantity && (
        <label className="block text-slate-300">
          Cantidad consumida en {QUANTITY_LABELS[rule.unit]} (para la pauta)
          <input
            aria-label={`Cantidad de pauta de ${foodName}`}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2"
            type="number"
            min="0.01"
            max="20000"
            step="any"
            value={selection?.quantity?.amount ?? ''}
            onChange={(event) => {
              const amount = Number(event.target.value);
              onChange({
                ruleId: rule.id,
                ...(amount > 0
                  ? { quantity: { amount, unit: rule.unit } }
                  : {}),
              });
            }}
          />
          <span className="mt-1 block text-slate-400">
            Los nutrientes siguen usando el peso en gramos indicado arriba.
          </span>
        </label>
      )}
      <p
        role="status"
        className={
          preview.status === 'pending' ? 'text-amber-300' : 'text-emerald-300'
        }
      >
        {preview.status === 'pending'
          ? 'Pendiente de clasificar · los nutrientes sí se registran.'
          : preview.status === 'free'
          ? 'Libre según tu pauta.'
          : preview.contributions
              .map(
                (item) =>
                  `${formatPortions(item.portions)} ${PAUTA_LABELS[item.group]}`
              )
              .join(' + ')}
      </p>
    </div>
  );
}
