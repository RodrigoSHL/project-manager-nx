import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { createPautaTemplate, NutritionPlan } from '../types/nutrition';
import { getTodayDateString } from '../hooks/useMacroStore';
import { NutritionPlanView } from './NutritionPlanView';

const makePlan = (): NutritionPlan => ({
  ...createPautaTemplate(getTodayDateString()),
  version: 1,
  createdAt: new Date().toISOString(),
});
afterEach(cleanup);

it('combines accent-insensitive search, exchange groups and units, and resets pagination when filters change', () => {
  render(
    <NutritionPlanView
      plan={makePlan()}
      foods={[]}
      onSave={vi.fn()}
      onGoToTracker={vi.fn()}
    />
  );
  const list = screen.getByRole('list', { name: 'Equivalencias de mi pauta' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(12);
  fireEvent.click(
    screen.getByRole('button', { name: 'Página siguiente de equivalencias' })
  );
  expect(
    (
      screen.getByRole('combobox', {
        name: 'Página de equivalencias',
      }) as HTMLSelectElement
    ).value
  ).toBe('2');
  fireEvent.change(screen.getByRole('combobox', { name: 'Grupo de aporte' }), {
    target: { value: 'carbs' },
  });
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Unidad de referencia' }),
    { target: { value: 'unit' } }
  );
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Buscar equivalencias' }),
    { target: { value: 'wild' } }
  );
  expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  expect(within(list).getByText('1 Proteínas')).toBeTruthy();
  expect(within(list).getByText('0,5 Carbohidratos')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Buscar equivalencias' }),
    { target: { value: 'atun' } }
  );
  expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  fireEvent.change(screen.getByRole('combobox', { name: 'Grupo de aporte' }), {
    target: { value: 'free' },
  });
  expect(
    screen.getByText('No hay equivalencias con estos filtros.')
  ).toBeTruthy();
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Buscar equivalencias' }),
    { target: { value: '' } }
  );
  expect(within(list).getAllByText('Libre · sin sumar porciones')).toHaveLength(
    12
  );
  fireEvent.click(screen.getByRole('button', { name: 'Vista de cuadrícula' }));
  expect(
    screen
      .getByRole('button', { name: 'Vista de cuadrícula' })
      .getAttribute('aria-pressed')
  ).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Vista de lista' }));
  expect(
    screen
      .getByRole('button', { name: 'Vista de lista' })
      .getAttribute('aria-pressed')
  ).toBe('true');
});

it('edits and removes filtered items using icon actions while saving every other rule and the complete plan', async () => {
  const initial = makePlan();
  const saved = vi.fn<React.ComponentProps<typeof NutritionPlanView>['onSave']>(
    async () => true
  );
  render(
    <NutritionPlanView
      plan={initial}
      foods={[]}
      onSave={saved}
      onGoToTracker={vi.fn()}
    />
  );
  const search = screen.getByRole('textbox', { name: 'Buscar equivalencias' });
  fireEvent.change(search, { target: { value: 'palta' } });
  const list = screen.getByRole('list', { name: 'Equivalencias de mi pauta' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  fireEvent.click(
    within(list).getByRole('button', { name: 'Editar equivalencia: Palta' })
  );
  fireEvent.change(screen.getByLabelText('Cantidad de referencia'), {
    target: { value: '100' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar equivalencia' }));
  fireEvent.change(search, { target: { value: 'piure' } });
  fireEvent.click(
    within(list).getByRole('button', { name: 'Quitar equivalencia: Piure' })
  );
  expect(
    screen.getByText('No hay equivalencias con estos filtros.')
  ).toBeTruthy();
  expect(saved).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar pauta en mi cuenta' })
  );
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
  const result = saved.mock.calls[0][0];
  expect(result.rules).toHaveLength(132);
  expect(
    result.rules.find((rule) => rule.id === 'meds-palta-hass')?.referenceAmount
  ).toBe(100);
  expect(result.rules.some((rule) => rule.id === 'ref-piure')).toBe(false);
  expect(result.rules.find((rule) => rule.id === 'meds-aceite-oliva')).toEqual(
    initial.rules.find((rule) => rule.id === 'meds-aceite-oliva')
  );
  expect(result.targets).toEqual(initial.targets);
  expect(result.waterTargetMl).toBe(initial.waterTargetMl);
});
