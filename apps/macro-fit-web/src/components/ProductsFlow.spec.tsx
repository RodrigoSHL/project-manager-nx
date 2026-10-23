import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MacroFitWorkspace } from '../app/app';
import { nutritionFixture, testToken } from '../testing/nutrition-fixture';
import { ProductDraft } from '../types/nutrition';
import { ProductEditor } from './ProductEditor';
import { PlateCameraModal } from './PlateCameraModal';

const user = {
  userId: 'products-test',
  name: 'Test',
  email: 'test@example.invalid',
  roles: ['user'],
};
const imported: ProductDraft = {
  name: 'Yogur especial',
  brand: 'Marca',
  barcode: '7801234567890',
  referenceAmount: 100,
  referenceUnit: 'ml',
  calories: 72,
  protein: 8,
  carbs: 0,
  fat: 3,
  fiber: null,
  warnings: ['Revisa la etiqueta.'],
  source: {
    kind: 'open_food_facts',
    url: 'https://world.openfoodfacts.org/product/7801234567890',
  },
};
const set = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
async function openProducts() {
  render(<MacroFitWorkspace user={user} onLogout={() => undefined} />);
  await screen.findByText('Registrar comida con IA');
  fireEvent.click(screen.getByRole('button', { name: 'Mis productos' }));
}
describe('Personal product workflows', () => {
  it('creates, edits and deletes a server product, retaining declared energy and optional fields', async () => {
    const records = nutritionFixture();
    vi.stubGlobal('fetch', records.fetch);
    await openProducts();
    fireEvent.click(
      screen.getByRole('button', { name: 'Ingresar producto manualmente' })
    );
    set('Nombre del producto', 'Mi mayonesa');
    set('Marca (opcional)', 'Kraft');
    set('Código de barras (opcional)', '7801234567890');
    set('Cantidad base', '15');
    set('Energía (kcal)', '102');
    set('Proteínas (g)', '0.1');
    set('Carbohidratos (g)', '0.3');
    set('Grasas totales (g)', '11.3');
    fireEvent.click(
      screen.getByLabelText(
        'Revisé la cantidad base, la unidad, las calorías y los macros.'
      )
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar producto en mi cuenta' })
    );
    await waitFor(() => expect(records.account().customFoods).toHaveLength(1));
    const saved = records.account().customFoods[0];
    expect(saved).toMatchObject({
      name: 'Mi mayonesa',
      brand: 'Kraft',
      barcode: '7801234567890',
      calories: 102,
      servingSizeGrams: 15,
      quantityUnit: 'g',
      productSource: { kind: 'manual' },
    });
    expect(saved.fiber).toBeUndefined();
    expect(localStorage.length).toBe(0);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    set('Energía (kcal)', '103');
    fireEvent.click(screen.getByLabelText(/Revisé la cantidad base/));
    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar producto en mi cuenta' })
    );
    await waitFor(() =>
      expect(records.account().customFoods[0].calories).toBe(103)
    );
    expect(records.account().customFoods[0].id).toBe(saved.id);
    expect(records.account().customFoods).toHaveLength(1);
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, eliminar producto' })
    );
    await waitFor(() => expect(records.account().customFoods).toHaveLength(0));
  });
  it('searches only on submit and imports only after review, retaining volume and zero', async () => {
    const records = nutritionFixture();
    const search = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: [imported] }),
    });
    vi.stubGlobal('fetch', (path: string, init: RequestInit) =>
      path.startsWith('/api/macrofit/me')
        ? records.fetch(path, init)
        : search(path, init)
    );
    await openProducts();
    set('Nombre o código de barras', 'Yogur especial');
    expect(search).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Buscar en Open Food Facts' })
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Revisar e importar' })
    );
    await screen.findByRole('dialog');
    expect(records.account().customFoods).toHaveLength(0);
    expect(
      (screen.getByLabelText('Carbohidratos (g)') as HTMLInputElement).value
    ).toBe('0');
    fireEvent.click(screen.getByLabelText(/Revisé la cantidad base/));
    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar producto en mi cuenta' })
    );
    await waitFor(() => expect(records.account().customFoods).toHaveLength(1));
    expect(records.account().customFoods[0]).toMatchObject({
      quantityUnit: 'ml',
      calories: 72,
      carbs: 0,
      productSource: imported.source,
    });
  });
  it('provides manual entry when the external catalog fails', async () => {
    const records = nutritionFixture();
    vi.stubGlobal('fetch', (path: string, init: RequestInit) =>
      path.startsWith('/api/macrofit/me')
        ? records.fetch(path, init)
        : Promise.resolve({
            ok: false,
            status: 503,
            json: async () => ({ message: 'Catálogo no disponible' }),
          })
    );
    await openProducts();
    set('Nombre o código de barras', 'Mayonesa');
    fireEvent.click(
      screen.getByRole('button', { name: 'Buscar en Open Food Facts' })
    );
    await screen.findByText('Catálogo no disponible');
    fireEvent.click(
      screen.getByRole('button', { name: 'Ingresar producto manualmente' })
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(records.account().customFoods).toHaveLength(0);
  });
  it('offers distinct camera and gallery inputs and leaves unreadable label fields empty for correction', async () => {
    const save = vi.fn().mockResolvedValue(true);
    const label = { ...imported, carbs: null, source: { kind: 'label' } };
    const provider = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => label });
    vi.stubGlobal('fetch', provider);
    render(<ProductEditor onSave={save} onClose={() => undefined} />);
    const gallery = screen.getByLabelText('Elegir etiqueta de la galería');
    expect(gallery.hasAttribute('capture')).toBe(false);
    expect(
      screen.getByLabelText('Tomar foto de la etiqueta').getAttribute('capture')
    ).toBe('environment');
    fireEvent.change(gallery, {
      target: {
        files: [new File(['image'], 'label.jpg', { type: 'image/jpeg' })],
      },
    });
    await waitFor(() =>
      expect(
        (screen.getByLabelText('Nombre del producto') as HTMLInputElement).value
      ).toBe('Yogur especial')
    );
    expect(
      (screen.getByLabelText('Carbohidratos (g)') as HTMLInputElement).value
    ).toBe('');
    expect(save).not.toHaveBeenCalled();
    set('Carbohidratos (g)', '1.5');
    fireEvent.click(screen.getByLabelText(/Revisé la cantidad base/));
    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar producto en mi cuenta' })
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          carbs: 1.5,
          calories: 72,
          quantityUnit: 'ml',
        })
      )
    );
  });
  it('prevents a repeated barcode from creating a second personal product', () => {
    render(
      <ProductEditor
        initial={imported}
        foods={[
          {
            id: 'existing',
            name: 'Ya guardado',
            barcode: imported.barcode!,
            servingSizeGrams: 100,
            servingUnit: '100 ml',
            quantityUnit: 'ml',
            calories: 72,
            protein: 8,
            carbs: 0,
            fat: 3,
            category: 'dairy',
          },
        ]}
        onSave={vi.fn()}
        onClose={() => undefined}
      />
    );
    expect(screen.getByText(/Este código ya está guardado/)).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: 'Guardar producto en mi cuenta',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });
});
describe('Mobile plate image sources', () => {
  it('keeps the gallery independent of camera permission and permits native capture separately', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
    const click = vi.spyOn(HTMLInputElement.prototype, 'click');
    render(
      <PlateCameraModal
        isOpen
        onClose={() => undefined}
        onAnalysisSuccess={() => undefined}
      />
    );
    await screen.findByText(/No se pudo acceder a la cámara directa/);
    const gallery = screen.getByLabelText('Imagen del plato desde la galería');
    expect(gallery.hasAttribute('capture')).toBe(false);
    expect(
      screen.getByLabelText('Foto nueva del plato').getAttribute('capture')
    ).toBe('environment');
    fireEvent.click(
      screen.getByRole('button', { name: 'Elegir de la galería' })
    );
    expect(click.mock.instances.at(-1)).toBe(gallery);
    fireEvent.click(screen.getByRole('button', { name: 'Tomar foto' }));
    expect(click.mock.instances.at(-1)).toBe(
      screen.getByLabelText('Foto nueva del plato')
    );
  });
  it('stops a camera permission request that resolves after the modal closes', async () => {
    let resolve!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((finish) => {
          resolve = finish;
        })
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
    const stop = vi.fn();
    const view = render(
      <PlateCameraModal
        isOpen
        onClose={() => undefined}
        onAnalysisSuccess={() => undefined}
      />
    );
    view.unmount();
    await act(async () => {
      resolve({ getTracks: () => [{ stop }] } as unknown as MediaStream);
    });
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
