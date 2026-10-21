import { PlateAnalysisService } from './plate-analysis.service';

describe('PlateAnalysisService', () => {
  let service: PlateAnalysisService;

  beforeEach(() => {
    // Delete GEMINI_API_KEY to test clinical simulation fallback
    delete process.env.GEMINI_API_KEY;
    service = new PlateAnalysisService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return simulated analysis for breakfast porridge', async () => {
    const dummyBuffer = Buffer.from('test-image-content');
    const result = await service.analyzePlate(dummyBuffer, 'image/jpeg', 'porridge con avena');

    expect(result.dish_name).toContain('Porridge');
    expect(result.plate_type_detected).toBe('bowl');
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total_estimated_kcal).toBeGreaterThan(0);
    expect(result.clinical_tip).toBeDefined();
  });

  it('should return simulated analysis for chicken dish', async () => {
    const dummyBuffer = Buffer.from('test-image-content');
    const result = await service.analyzePlate(dummyBuffer, 'image/jpeg', 'pollo con arroz');

    expect(result.dish_name).toContain('Pechuga');
    expect(result.plate_type_detected).toBe('plato_extendido');
    expect(result.items.some((i) => i.category === 'proteina')).toBe(true);
    expect(result.items.some((i) => i.category === 'carbohidrato')).toBe(true);
  });
});
