import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TRAINING_CATALOG,
  type CompletedTraining,
  type TrainingWorkspace,
} from '@project-manager/macrofit-contracts';
import App from '../../app/app';
import { nutritionFixture, testToken } from '../../testing/nutrition-fixture';

const user = {
  userId: 'training-account',
  name: 'Cuenta de fuerza',
  email: 'training@example.invalid',
  roles: ['user'],
};
const base = '/api/macrofit/me/training';

function trainingFixture() {
  const nutrition = nutritionFixture();
  let workspace: TrainingWorkspace = {
    draft: null,
    revision: 0,
    customExercises: [],
    lastCompleted: null,
  };
  const history: CompletedTraining[] = [];
  const response = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => structuredClone(body),
  });
  return vi.fn(async (path: string, init: RequestInit = {}) => {
    if (path === '/api/auth/profile') return response(user);
    if (path === base) return response(workspace);
    const body = init.body ? JSON.parse(String(init.body)) : null;
    if (path === base + '/draft' && init.method === 'PUT') {
      workspace = {
        ...workspace,
        draft: body.draft,
        revision: workspace.revision + 1,
      };
      return response({ draft: workspace.draft, revision: workspace.revision });
    }
    if (path === base + '/exercises' && init.method === 'POST') {
      workspace.customExercises.push(body);
      return response(body, 201);
    }
    if (
      path === base + '/finish' &&
      init.method === 'POST' &&
      workspace.draft
    ) {
      history.unshift({
        id: workspace.draft.id,
        startedAt: workspace.draft.startedAt,
        finishedAt: new Date().toISOString(),
        exercises: workspace.draft.exercises.map(({ exerciseId, sets }) => ({
          exercise: [...TRAINING_CATALOG, ...workspace.customExercises].find(
            ({ id }) => id === exerciseId
          )!,
          sets,
        })),
      });
      workspace = {
        ...workspace,
        draft: null,
        revision: workspace.revision + 1,
        lastCompleted: history[0],
      };
      return response({
        draft: null,
        revision: workspace.revision,
        lastCompleted: workspace.lastCompleted,
      });
    }
    if (path.startsWith(base + '/history?'))
      return response({ sessions: history, nextOffset: null });
    return nutrition.fetch(path, init);
  });
}

function Location() {
  const { pathname } = useLocation();
  return <output data-testid="training-location">{pathname}</output>;
}
function mount(path = '/entrenamiento') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Location />
    </MemoryRouter>
  );
}
function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}
function enter(
  label: string,
  value: string,
  root: Pick<typeof screen, 'getByLabelText'> = screen
) {
  fireEvent.change(root.getByLabelText(label), { target: { value } });
}
function exerciseCard(name: string) {
  return within(screen.getByRole('article', { name }));
}
function search(query: string) {
  enter('Buscar ejercicio', query);
}
function intensity(value: string, label: RegExp) {
  const view = within(
    screen.getByRole('group', { name: 'Vista muscular: Frente' })
  );
  const zone = view.getByRole('button', { name: label });
  expect(
    Array.from(zone.querySelectorAll('[data-muscle]')).map((path) =>
      path.getAttribute('data-intensity')
    )
  ).toEqual([value, value]);
  return zone;
}
function metric(label: string, value: string) {
  const summary = within(screen.getByLabelText('Resumen de la sesión'));
  expect(
    summary
      .getByText(label)
      .nextElementSibling?.textContent?.replace(/\s+/g, '')
  ).toBe(value);
}
async function register(card: ReturnType<typeof exerciseCard>) {
  const button = card.getByRole('button', { name: 'Registrar serie' });
  await waitFor(() =>
    expect((button as HTMLButtonElement).disabled).toBe(false)
  );
  fireEvent.submit(button.closest('form')!);
  await waitFor(() =>
    expect((button as HTMLButtonElement).disabled).toBe(false)
  );
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken(user.userId));
  vi.stubGlobal('fetch', trainingFixture());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Muscle Log inside MacroFit', () => {
  it('opens from the workspace, resolves aliases, updates both quads and keeps a session across reloads', async () => {
    const page = mount('/');
    await screen.findByRole('heading', { name: 'Tu diario' });
    click('Entrenamiento');
    click('Muscle Log');
    await screen.findByRole('heading', { name: 'Sesión actual' });
    expect(screen.getByTestId('training-location').textContent).toBe(
      '/entrenamiento'
    );
    click('Agregar ejercicio');
    search('leg extension');
    expect(
      screen.getAllByRole('button', { name: /^Agregar Extensión de piernas$/ })
    ).toHaveLength(1);
    click('Agregar Extensión de piernas');
    await screen.findByRole('article', { name: 'Extensión de piernas' });
    const card = exerciseCard('Extensión de piernas');
    enter('Repeticiones', '10', card);
    enter('Peso (kg)', '35', card);
    await register(card);
    metric('Ejercicios', '1');
    metric('Series', '1');
    metric('Volumen externo', '350kg');
    const zone = intensity('low', /^Cuádriceps · 1 serie equivalente$/);
    fireEvent.keyDown(zone, { key: 'Enter' });
    expect(screen.getByText('Cuádriceps · 1 serie equivalente')).toBeTruthy();
    expect(
      (card.getByLabelText('Repeticiones') as HTMLInputElement).value
    ).toBe('10');
    expect((card.getByLabelText('Peso (kg)') as HTMLInputElement).value).toBe(
      '35'
    );

    await register(card);
    await register(card);
    intensity('medium', /^Cuádriceps · 3 series equivalentes$/);
    fireEvent.click(card.getByRole('button', { name: 'Eliminar serie 3' }));
    intensity('low', /^Cuádriceps · 2 series equivalentes$/);
    await waitFor(() =>
      expect(
        (
          card.getByRole('button', {
            name: 'Editar serie 1',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(false)
    );
    fireEvent.click(card.getByRole('button', { name: 'Editar serie 1' }));
    enter('Peso (kg)', '37.5', card);
    fireEvent.submit(
      card.getByRole('button', { name: 'Guardar cambios' }).closest('form')!
    );
    await card.findByText('10 rep · 37,5 kg');
    await waitFor(() => expect(screen.queryByText('Guardando…')).toBeNull());
    metric('Volumen externo', '725kg');

    page.unmount();
    const reloaded = mount();
    await screen.findByRole('article', { name: 'Extensión de piernas' });
    metric('Series', '2');
    metric('Volumen externo', '725kg');
    click('Finalizar sesión');
    await screen.findByText('Sesión guardada en el historial.');
    expect(
      screen.getByRole('heading', { name: 'Mapa de la última sesión' })
    ).toBeTruthy();
    intensity('low', /^Cuádriceps · 2 series equivalentes$/);
    expect(
      screen.queryByRole('button', { name: 'Finalizar sesión' })
    ).toBeNull();
    reloaded.unmount();

    mount();
    await screen.findByRole('heading', { name: 'Mapa de la última sesión' });
    metric('Series', '2');
    metric('Volumen externo', '725kg');
    intensity('low', /^Cuádriceps · 2 series equivalentes$/);
    click('Historial');
    await screen.findByText('Serie 2 · 10 rep · 35 kg');
    click('Sesión');
    click('Agregar ejercicio');
    search('leg extension');
    click('Agregar Extensión de piernas');
    await screen.findByRole('article', { name: 'Extensión de piernas' });
    expect(screen.getByRole('heading', { name: 'Mapa muscular' })).toBeTruthy();
    intensity('none', /^Cuádriceps · 0 series equivalentes$/);
    metric('Series', '0');
  });

  it('filters by muscle and equipment and registers a custom bodyweight set with two secondary muscles', async () => {
    mount();
    await screen.findByRole('heading', { name: 'Sesión actual' });
    click('Catálogo');
    search('cuadriceps');
    expect(
      screen.getByRole('heading', { name: 'Sentadilla hack' })
    ).toBeTruthy();
    enter('Filtrar por equipamiento', 'free');
    expect(
      screen.queryByRole('heading', { name: 'Sentadilla hack' })
    ).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Sentadilla con barra' })
    ).toBeTruthy();
    click('Crear ejercicio');
    enter('Nombre del ejercicio', 'Flexión de prueba');
    enter('Equipamiento del ejercicio', 'bodyweight');
    enter('Pectorales', 'primary');
    enter('Tríceps', 'secondary');
    enter('Abdominales', 'secondary');
    fireEvent.submit(
      screen.getByRole('button', { name: 'Guardar ejercicio' }).closest('form')!
    );
    await screen.findByRole('button', { name: 'Agregar Flexión de prueba' });
    click('Agregar Flexión de prueba');
    await screen.findByRole('article', { name: 'Flexión de prueba' });
    const card = exerciseCard('Flexión de prueba');
    enter('Repeticiones', '8', card);
    await register(card);
    metric('Volumen externo', '0kg');
    intensity('low', /^Pectorales · 1 serie equivalente$/);
    intensity('low', /^Abdominales · 0,5 series equivalentes$/);
    const back = within(
      screen.getByRole('group', { name: 'Vista muscular: Espalda' })
    );
    fireEvent.click(
      back.getByRole('button', { name: /^Tríceps · 0,5 series equivalentes$/ })
    );
    expect(screen.getByText('Tríceps · 0,5 series equivalentes')).toBeTruthy();
  });
});
