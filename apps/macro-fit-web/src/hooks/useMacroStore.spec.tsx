import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useMacroStore } from './useMacroStore';
import { nutritionFixture, testToken } from '../testing/nutrition-fixture';
import {
  canImportLegacy,
  readLegacyData,
  accountKey,
} from '../features/auth/account-storage';
import { setAccessToken } from '../features/auth/auth-session';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('macrofit_access_token', testToken('a'));
});

describe('server-backed personal records', () => {
  it('loads hydration from the server after remount without any local copy', async () => {
    const records = nutritionFixture();
    vi.stubGlobal('fetch', records.fetch);
    const first = renderHook(() => useMacroStore('a'));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    await act(async () => {
      expect(await first.result.current.addWater(250)).toBe(true);
    });
    expect(first.result.current.dailyLog?.waterIntakeMl).toBe(250);
    first.unmount();
    const second = renderHook(() => useMacroStore('a'));
    await waitFor(() =>
      expect(second.result.current.dailyLog?.waterIntakeMl).toBe(250)
    );
    expect(localStorage.length).toBe(0);
    expect(
      records.fetch.mock.calls.some(([, init]) => init?.method === 'POST')
    ).toBe(true);
  });
  it('keeps the existing day unchanged after failed writes and requires a resync before retrying', async () => {
    const records = nutritionFixture();
    const fetch = vi.fn((path: string, init: RequestInit) =>
      path.endsWith('/water')
        ? Promise.reject(new TypeError('Network failed'))
        : records.fetch(path, init)
    );
    vi.stubGlobal('fetch', fetch);
    const { result } = renderHook(() => useMacroStore('a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      expect(await result.current.addWater(250)).toBe(false);
    });
    expect(result.current.dailyLog?.waterIntakeMl).toBe(0);
    expect(result.current.needsReload).toBe(true);
    await act(async () => {
      expect(await result.current.addWater(250)).toBe(false);
    });
    expect(
      fetch.mock.calls.filter(([path]) => path.endsWith('/water'))
    ).toHaveLength(1);
  });
  it('retains the legacy backup on failure and after a successful server import', async () => {
    localStorage.setItem('macrofit_custom_foods', '[]');
    const records = nutritionFixture();
    let rejectImport = true;
    vi.stubGlobal('fetch', (path: string, init: RequestInit) =>
      path.endsWith('/import')
        ? Promise.resolve(
            rejectImport
              ? {
                  ok: false,
                  status: 503,
                  json: async () => ({ message: 'Database offline' }),
                }
              : {
                  ok: true,
                  status: 201,
                  json: async () => ({
                    ...records.account(),
                    legacyImported: true,
                  }),
                }
          )
        : records.fetch(path, init)
    );
    const { result } = renderHook(() => useMacroStore('a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      expect(await result.current.importLegacy()).toBe(false);
    });
    expect(localStorage.getItem('macrofit_custom_foods')).toBe('[]');
    rejectImport = false;
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.needsReload).toBe(false));
    await act(async () => {
      expect(await result.current.importLegacy()).toBe(true);
    });
    expect(localStorage.getItem('macrofit_custom_foods')).toBe('[]');
  });
  it('discards slow responses when selecting a different date', async () => {
    const records = nutritionFixture();
    let resolve!: (value: unknown) => void;
    vi.stubGlobal('fetch', (path: string, init: RequestInit) =>
      path.includes('/days/2026-10-01')
        ? new Promise((done) => {
            resolve = done;
          })
        : records.fetch(path, init)
    );
    const { result } = renderHook(() => useMacroStore('a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSelectedDate('2026-10-01'));
    await waitFor(() => expect(resolve).toBeTypeOf('function'));
    act(() => result.current.setSelectedDate('2026-10-02'));
    await waitFor(() =>
      expect(result.current.dailyLog?.date).toBe('2026-10-02')
    );
    await act(async () =>
      resolve({
        ok: true,
        status: 200,
        json: async () => ({
          date: '2026-10-01',
          meals: [],
          waterIntakeMl: 999,
        }),
      })
    );
    expect(result.current.dailyLog?.date).toBe('2026-10-02');
    expect(result.current.dailyLog?.waterIntakeMl).toBe(0);
  });
  it('discards a body that finishes after the session changes', async () => {
    const records = nutritionFixture();
    let finish!: (value: unknown) => void;
    vi.stubGlobal('fetch', (path: string, init: RequestInit) =>
      path.endsWith('/water')
        ? Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              new Promise((done) => {
                finish = done;
              }),
          })
        : records.fetch(path, init)
    );
    const { result } = renderHook(() => useMacroStore('a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let pending!: Promise<boolean>;
    act(() => {
      pending = result.current.addWater(250);
    });
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    setAccessToken(testToken('b'));
    await act(async () => {
      finish({ ...result.current.dailyLog, waterIntakeMl: 999 });
      expect(await pending).toBe(false);
    });
    expect(result.current.dailyLog?.waterIntakeMl).toBe(0);
  });
});

describe('legacy import reader', () => {
  it('never reads another account and never imports the fictional default profile', () => {
    localStorage.setItem(accountKey('b', 'macrofit_custom_foods'), '[{}]');
    expect(canImportLegacy('a')).toBe(false);
    localStorage.setItem(
      'macrofit_profile',
      JSON.stringify({
        name: 'Paciente MEDS',
        age: 28,
        gender: 'male',
        weightKg: 75,
        heightCm: 175,
        activityLevel: 'moderate',
        goal: 'meds_pauta',
      })
    );
    localStorage.setItem('macrofit_goals', '{}');
    const legacy = readLegacyData('a');
    expect(legacy.data.settings).toBeUndefined();
    expect(legacy.data.foods).toEqual([]);
    expect(localStorage.length).toBe(3);
  });
  it('removes old example meals and preloaded hydration while preserving actual entries', () => {
    const meal = {
      id: 'seed-des-1',
      mealType: 'breakfast',
      foodId: 'avena',
      foodName: 'Avena',
      amountGrams: 40,
      calories: 145,
      protein: 5,
      carbs: 20,
      fat: 3,
      timestamp: '08:00',
    };
    localStorage.setItem(
      'macrofit_log_2026-10-23',
      JSON.stringify({
        date: '2026-10-23',
        meals: [meal, { ...meal, id: 'real-entry' }],
        waterIntakeMl: 2100,
      })
    );
    const imported = readLegacyData('a').data.logs[0];
    expect(imported.meals.map((entry) => entry.id)).toEqual(['real-entry']);
    expect(imported.waterIntakeMl).toBe(0);
  });
  it('retains originals on validation failure', () => {
    localStorage.setItem('macrofit_custom_foods', 'broken json');
    expect(() => readLegacyData('a')).toThrow();
    expect(localStorage.getItem('macrofit_custom_foods')).toBe('broken json');
  });
});
