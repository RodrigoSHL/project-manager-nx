import { GoogleGenAI } from '@google/genai';
import { PlateAnalysisService } from './plate-analysis.service';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
  ThinkingLevel: { MINIMAL: 'MINIMAL' },
  Type: {
    OBJECT: 'OBJECT',
    BOOLEAN: 'BOOLEAN',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    ARRAY: 'ARRAY',
  },
}));

const result = {
  dish_name: 'Arroz',
  plate_type_detected: 'bowl',
  total_estimated_kcal: 999,
  items: [
    {
      name: 'Arroz cocido',
      category: 'carbohidrato',
      estimated_grams: 200,
      confidence: 'media',
      nutritional_density_per_100g: {
        kcal: 130,
        protein_g: 2,
        carbs_g: 28,
        fat_g: 1,
        fiber_g: 1,
      },
    },
  ],
  clinical_tip: 'Agrega verduras.',
};

describe('PlateAnalysisService provider contract', () => {
  const environment = { ...process.env };
  const generate = jest.fn();
  beforeEach(() => {
    process.env = {
      ...environment,
      GEMINI_API_KEY: 'test-only',
      GEMINI_TIMEOUT_MS: '15000',
      MACROFIT_REQUESTS_PER_MINUTE: '10',
      MACROFIT_MAX_CONCURRENT_ANALYSES: '2',
    };
    generate.mockReset();
    (GoogleGenAI as jest.Mock).mockImplementation(() => ({
      models: { generateContent: generate },
    }));
  });
  afterEach(() => {
    process.env = { ...environment };
    jest.useRealTimers();
  });
  const analyze = (service: PlateAnalysisService) =>
    service.analyzePlate(Buffer.from('pixels'), 'image/jpeg');

  const textResult = {
    ...result,
    meal_type: 'lunch',
    assumptions: ['Arroz pesado cocido.'],
    items: [
      { ...result.items[0], estimated_grams: 9, quantity_source: 'declared' },
    ],
  };
  const label = {
    name: 'Mayonesa',
    brand: null,
    barcode: null,
    referenceAmount: 15,
    referenceUnit: 'g',
    calories: 102,
    protein: 0.1,
    carbs: null,
    fat: 11.3,
    fiber: null,
    warnings: ['Carbohidratos ilegibles.'],
  };
  const rankingInput = {
    food: { name: 'Atún' },
    references: [
      {
        key: 'day:0',
        name: 'Atún al agua',
        aliases: [],
        free: false,
        unit: 'g',
      },
    ],
  };
  it('ranks reference keys without accepting model-generated amounts and shares the analysis budget', async () => {
    process.env.MACROFIT_REQUESTS_PER_MINUTE = '1';
    const ranking = {
      candidates: [
        {
          key: 'day:0',
          confidence: 'medium',
          explanation: 'Nombre relacionado.',
          uncertainty: 'Revisar preparación.',
        },
      ],
      missingInfo: [],
    };
    generate.mockResolvedValue({ text: JSON.stringify(ranking) });
    const service = new PlateAnalysisService();
    expect(await service.rankEquivalences(rankingInput)).toEqual(ranking);
    expect(generate.mock.calls[0][0].config.systemInstruction).toContain(
      'Nunca generes referenceAmount'
    );
    await expect(service.analyzeMealText('Arroz')).rejects.toMatchObject({
      status: 429,
    });
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it.each([
    'garbage',
    JSON.stringify({
      candidates: [
        {
          key: 'day:0',
          confidence: 'medium',
          explanation: 'x',
          uncertainty: 'x',
          referenceAmount: 100,
        },
      ],
      missingInfo: [],
    }),
    JSON.stringify({
      candidates: [
        {
          key: 'day:0',
          confidence: 'high',
          explanation: 'x',
          uncertainty: 'x',
        },
      ],
      missingInfo: [],
    }),
  ])('rejects malformed or invented ranking fields: %s', async (text) => {
    generate.mockResolvedValue({ text });
    await expect(
      new PlateAnalysisService().rankEquivalences(rankingInput)
    ).rejects.toMatchObject({ status: 502 });
  });
  it('transcribes label data without inventing missing nutrients or recomputing printed calories', async () => {
    generate.mockResolvedValue({ text: JSON.stringify(label) });
    expect(
      await new PlateAnalysisService().analyzeProductLabel(
        Buffer.from('pixels'),
        'image/jpeg'
      )
    ).toEqual({ ...label, source: { kind: 'label' } });
    expect(generate.mock.calls[0][0].config.systemInstruction).toContain(
      'No estimes nutrientes'
    );
    expect(generate.mock.calls[0][0].config.responseSchema.required).toContain(
      'referenceUnit'
    );
  });
  it('shares the same provider budget between labels and meals', async () => {
    process.env.MACROFIT_REQUESTS_PER_MINUTE = '1';
    generate.mockResolvedValue({ text: JSON.stringify(label) });
    const service = new PlateAnalysisService();
    await service.analyzeProductLabel(Buffer.from('pixels'), 'image/jpeg');
    await expect(
      service.analyzeMealText('200 g de arroz')
    ).rejects.toMatchObject({ status: 429 });
  });
  it('rejects unreadable labels and invalid label output', async () => {
    const service = new PlateAnalysisService();
    generate.mockResolvedValueOnce({
      text: JSON.stringify({
        ...label,
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
      }),
    });
    await expect(
      service.analyzeProductLabel(Buffer.from('pixels'), 'image/jpeg')
    ).rejects.toMatchObject({ status: 400 });
    generate.mockResolvedValueOnce({
      text: JSON.stringify({ ...label, referenceUnit: 'unknown' }),
    });
    await expect(
      service.analyzeProductLabel(Buffer.from('pixels'), 'image/jpeg')
    ).rejects.toMatchObject({ status: 502 });
  });
  it('analyzes text without image data and preserves small declared amounts and assumptions', async () => {
    generate.mockResolvedValue({ text: JSON.stringify(textResult) });
    const analysis = await new PlateAnalysisService().analyzeMealText(
      'En el almuerzo comí 9 g de arroz'
    );
    expect(analysis).toMatchObject({
      meal_type: 'lunch',
      assumptions: textResult.assumptions,
      items: [{ estimated_grams: 9, quantity_source: 'declared' }],
      total_estimated_kcal: 12,
    });
    const request = generate.mock.calls[0][0];
    expect(request.contents).toEqual([
      {
        text: JSON.stringify({
          description: 'En el almuerzo comí 9 g de arroz',
        }),
      },
    ]);
    expect(request.config.responseSchema.required).toContain('assumptions');
  });
  it('honors the explicitly selected meal over the model suggestion', async () => {
    generate.mockResolvedValue({ text: JSON.stringify(textResult) });
    expect(
      (
        await new PlateAnalysisService().analyzeMealText(
          '9 g de arroz',
          'dinner'
        )
      ).meal_type
    ).toBe('dinner');
  });
  it('rejects a description without foods instead of creating a meal', async () => {
    generate.mockResolvedValue({
      text: JSON.stringify({
        ...textResult,
        dish_name: 'Sin alimentos',
        items: [],
      }),
    });
    await expect(
      new PlateAnalysisService().analyzeMealText('Hola, qué hora es')
    ).rejects.toMatchObject({ status: 400 });
  });
  it('rejects text analyses with missing uncertainty metadata', async () => {
    generate.mockResolvedValue({ text: JSON.stringify(result) });
    await expect(
      new PlateAnalysisService().analyzeMealText('200 g de arroz')
    ).rejects.toMatchObject({ status: 502 });
  });
  it('shares the provider quota across text and photo analyses', async () => {
    process.env.MACROFIT_REQUESTS_PER_MINUTE = '1';
    generate.mockResolvedValue({ text: JSON.stringify(textResult) });
    const service = new PlateAnalysisService();
    await service.analyzeMealText('200 g de arroz');
    await expect(analyze(service)).rejects.toMatchObject({ status: 429 });
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it('surfaces a text provider failure without returning a fictional meal', async () => {
    generate.mockRejectedValue({ status: 429 });
    await expect(
      new PlateAnalysisService().analyzeMealText('200 g de arroz')
    ).rejects.toMatchObject({ status: 503 });
  });

  it('returns 503 when unconfigured, without producing an analysis', async () => {
    delete process.env.GEMINI_API_KEY;
    const service = new PlateAnalysisService();
    expect(() => service.readiness()).toThrow('no está configurado');
    await expect(analyze(service)).rejects.toMatchObject({ status: 503 });
    expect(generate).not.toHaveBeenCalled();
  });
  it('uses the provider response and always recomputes the total', async () => {
    generate.mockResolvedValue({ text: JSON.stringify(result) });
    const analysis = await analyze(new PlateAnalysisService());
    expect(analysis.items).toEqual(result.items);
    expect(analysis.total_estimated_kcal).toBe(260);
    expect(generate.mock.calls[0][0].config.abortSignal).toBeInstanceOf(
      AbortSignal
    );
    expect(
      generate.mock.calls[0][0].config.httpOptions.retryOptions.attempts
    ).toBe(1);
  });
  it.each([
    ['network', 502],
    [401, 503],
    [403, 503],
    [404, 503],
    [408, 504],
    [429, 503],
    [500, 502],
    [503, 503],
    [504, 504],
  ])(
    'exposes provider failure %s as HTTP %s without invented data',
    async (status, expected) => {
      generate.mockRejectedValue({
        status,
        message: 'sensitive provider payload',
      });
      await expect(analyze(new PlateAnalysisService())).rejects.toMatchObject({
        status: expected,
      });
    }
  );
  it('recovers from one transient provider error using a real second response', async () => {
    generate.mockRejectedValueOnce({ status: 503 });
    generate.mockResolvedValueOnce({ text: JSON.stringify(result) });
    await expect(analyze(new PlateAnalysisService())).resolves.toHaveProperty(
      'total_estimated_kcal',
      260
    );
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[0][0].config.abortSignal).toBe(
      generate.mock.calls[1][0].config.abortSignal
    );
  });
  it('does not retry invalid credentials', async () => {
    generate.mockRejectedValue({ status: 403 });
    await expect(analyze(new PlateAnalysisService())).rejects.toMatchObject({
      status: 503,
    });
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it('counts retries against the provider quota', async () => {
    process.env.MACROFIT_REQUESTS_PER_MINUTE = '2';
    generate.mockRejectedValueOnce({ status: 503 });
    generate.mockResolvedValueOnce({ text: JSON.stringify(result) });
    const service = new PlateAnalysisService();
    await expect(analyze(service)).resolves.toHaveProperty('items');
    await expect(analyze(service)).rejects.toMatchObject({ status: 429 });
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it('does not retry when the provider quota is exhausted', async () => {
    process.env.MACROFIT_REQUESTS_PER_MINUTE = '1';
    generate.mockRejectedValue({ status: 503 });
    await expect(analyze(new PlateAnalysisService())).rejects.toMatchObject({
      status: 503,
    });
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it('keeps one deadline across both attempts and releases the concurrency slot', async () => {
    jest.useFakeTimers();
    process.env.MACROFIT_MAX_CONCURRENT_ANALYSES = '1';
    generate.mockRejectedValueOnce({ status: 503 });
    generate.mockImplementationOnce(() => new Promise(() => undefined));
    const service = new PlateAnalysisService();
    const assertion = expect(analyze(service)).rejects.toMatchObject({
      status: 504,
    });
    await jest.advanceTimersByTimeAsync(15000);
    await assertion;
    expect(generate).toHaveBeenCalledTimes(2);
    generate.mockResolvedValue({ text: JSON.stringify(result) });
    await expect(analyze(service)).resolves.toHaveProperty('items');
    expect(jest.getTimerCount()).toBe(0);
  });
  it.each([
    '',
    '{invalid',
    JSON.stringify({ ...result, items: [] }),
    JSON.stringify({
      ...result,
      items: [{ ...result.items[0], estimated_grams: -1 }],
    }),
  ])('rejects empty or invalid provider responses', async (text) => {
    generate.mockResolvedValue({ text });
    await expect(analyze(new PlateAnalysisService())).rejects.toMatchObject({
      status: 502,
    });
  });
  it('aborts timed out calls and releases its concurrency slot', async () => {
    jest.useFakeTimers();
    process.env.MACROFIT_MAX_CONCURRENT_ANALYSES = '1';
    generate.mockImplementationOnce(() => new Promise(() => undefined));
    const service = new PlateAnalysisService();
    const pending = analyze(service);
    const assertion = expect(pending).rejects.toMatchObject({ status: 504 });
    await jest.advanceTimersByTimeAsync(15000);
    await assertion;
    expect(generate.mock.calls[0][0].config.abortSignal.aborted).toBe(true);
    generate.mockResolvedValue({ text: JSON.stringify(result) });
    await expect(analyze(service)).resolves.toHaveProperty(
      'total_estimated_kcal',
      260
    );
    expect(jest.getTimerCount()).toBe(0);
  });
  it('limits concurrent and per-minute provider requests', async () => {
    process.env.MACROFIT_MAX_CONCURRENT_ANALYSES = '1';
    process.env.MACROFIT_REQUESTS_PER_MINUTE = '1';
    let finish!: (value: { text: string }) => void;
    generate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const service = new PlateAnalysisService();
    const first = analyze(service);
    await expect(analyze(service)).rejects.toMatchObject({ status: 429 });
    finish({ text: JSON.stringify(result) });
    await first;
    await expect(analyze(service)).rejects.toMatchObject({ status: 429 });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
