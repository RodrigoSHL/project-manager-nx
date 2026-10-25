import { formatPortions, PAUTA_LABELS } from '../../types/nutrition';
import { FoodIdea, NUTRIENT_LABELS } from './food-guide';
const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

export function FoodIdeaImpact({ idea }: { idea: FoodIdea }) {
  return (
    <div className="space-y-2">
      {idea.pauta && (
        <p className="text-xs text-teal-200">
          {idea.pauta.status === 'pending'
            ? 'Equivalencia pendiente en tu pauta'
            : idea.pauta.status === 'free'
            ? 'Libre en tu pauta · sus nutrientes sí cuentan'
            : idea.pauta.contributions
                .map(
                  (item) =>
                    `${formatPortions(item.portions)} ${
                      item.portions === 1 ? 'porción' : 'porciones'
                    } de ${PAUTA_LABELS[item.group].toLocaleLowerCase('es')}`
                )
                .join(' + ')}
        </p>
      )}
      {idea.macroOverages.length > 0 && (
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-2.5 py-2 text-xs leading-5 text-amber-200">
          Esta opción agrega sobre tu meta:{' '}
          {idea.macroOverages
            .map(
              (item) =>
                `${NUTRIENT_LABELS[item.key].toLocaleLowerCase(
                  'es'
                )} +${number.format(item.extra)} ${
                  item.key === 'calories' ? 'kcal' : 'g'
                }`
            )
            .join(' · ')}
          .
        </p>
      )}
      {idea.portionOverages.length > 0 && (
        <p className="text-xs leading-5 text-amber-200">
          También agrega porciones sobre tu pauta:{' '}
          {idea.portionOverages
            .map(
              (item) =>
                `${PAUTA_LABELS[item.group]} +${formatPortions(item.extra)}`
            )
            .join(' · ')}
          .
        </p>
      )}
    </div>
  );
}
