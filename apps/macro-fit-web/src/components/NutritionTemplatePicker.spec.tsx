import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { NutritionTemplatePicker } from './NutritionTemplatePicker';
import { createPautaTemplate, NutritionPlanInput } from '../types/nutrition';

afterEach(cleanup);
function Harness({
  initial,
  applied,
}: {
  initial: NutritionPlanInput;
  applied: ReturnType<typeof vi.fn>;
}) {
  const [draft, setDraft] = useState(initial);
  return (
    <NutritionTemplatePicker
      draft={draft}
      disabled={false}
      onApply={(next, message) => {
        setDraft(next);
        applied(next, message);
      }}
    />
  );
}
it('searches all source aliases and applies a reusable copy without saving or losing personal product rules', () => {
  const initial = createPautaTemplate('2026-10-24');
  initial.rules = [
    {
      ...initial.rules[0],
      id: 'my-mustard',
      name: 'Mostaza Heinz',
      foodIds: ['my-product'],
    },
  ];
  initial.targets.protein = 14;
  const applied = vi.fn();
  render(<Harness initial={initial} applied={applied} />);
  fireEvent.click(screen.getByRole('button', { name: 'Explorar plantillas' }));
  expect(
    (
      screen.getByRole('checkbox', {
        name: /Usar también las metas/,
      }) as HTMLInputElement
    ).checked
  ).toBe(false);
  const search = screen.getByRole('textbox', {
    name: 'Buscar en la plantilla',
  });
  const preview = screen.getByLabelText(
    'Vista previa de equivalencias de la plantilla'
  );
  fireEvent.change(search, { target: { value: 'legumbres' } });
  expect(
    within(preview).getByRole('heading', { name: /Lentejas cocidas/ })
  ).toBeTruthy();
  fireEvent.change(search, { target: { value: 'arándanos' } });
  expect(within(preview).getAllByRole('article')).toHaveLength(1);
  expect(within(preview).getByText('1 taza → 1 Frutas')).toBeTruthy();
  expect(within(preview).getByText(/Medida casera:.*120–130/)).toBeTruthy();
  fireEvent.change(search, { target: { value: 'quesillo' } });
  expect(within(preview).getAllByRole('article')).toHaveLength(2);
  fireEvent.change(search, { target: { value: 'nunca-existe' } });
  expect(within(preview).getByText(/No hay coincidencias/)).toBeTruthy();
  expect(applied).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Cargar plantilla en el borrador' })
  );
  const result = applied.mock.calls[0][0];
  expect(result.rules).toHaveLength(134);
  expect(
    result.rules.find((rule: { id: string }) => rule.id === 'my-mustard')
  ).toEqual(initial.rules[0]);
  expect(result.targets.protein).toBe(14);
  expect(
    screen.getByRole('button', { name: 'Explorar plantillas' })
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Explorar plantillas' }));
  fireEvent.click(
    screen.getByRole('checkbox', { name: /Usar también las metas/ })
  );
  fireEvent.click(
    screen.getByRole('checkbox', { name: /Reemplazar todas mis equivalencias/ })
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Cargar plantilla en el borrador' })
  );
  expect(applied.mock.calls[1][0].rules).toHaveLength(133);
  expect(applied.mock.calls[1][0].targets.protein).toBe(10);
});

it('blocks loading while a rule has unsaved edits', () => {
  const applied = vi.fn();
  render(
    <NutritionTemplatePicker
      draft={createPautaTemplate('2026-10-24')}
      disabled
      onApply={applied}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Explorar plantillas' }));
  const load = screen.getByRole('button', {
    name: 'Cargar plantilla en el borrador',
  }) as HTMLButtonElement;
  expect(load.disabled).toBe(true);
  fireEvent.click(load);
  expect(applied).not.toHaveBeenCalled();
});
