import { Test, TestingModule } from '@nestjs/testing';
import { PlateAnalysisController } from './plate-analysis.controller';
import { PlateAnalysisService } from './plate-analysis.service';

describe('PlateAnalysisController', () => {
  let controller: PlateAnalysisController;
  let service: PlateAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlateAnalysisController],
      providers: [
        {
          provide: PlateAnalysisService,
          useValue: {
            analyzePlate: jest.fn().mockResolvedValue({
              dish_name: 'Plato Test',
              plate_type_detected: 'plato_extendido',
              total_estimated_kcal: 500,
              items: [],
              clinical_tip: 'Tip clínico',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<PlateAnalysisController>(PlateAnalysisController);
    service = module.get<PlateAnalysisService>(PlateAnalysisService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should analyze plate from multipart file', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg',
    };

    const res = await controller.analyzePlate(mockFile as any, { hints: 'sin sal' });
    expect(res.dish_name).toBe('Plato Test');
    expect(service.analyzePlate).toHaveBeenCalled();
  });

  it('should analyze plate from base64 dataURI', async () => {
    const base64Data = Buffer.from('image-binary').toString('base64');
    const res = await controller.analyzePlate(undefined, {
      image: `data:image/png;base64,${base64Data}`,
      hints: 'lomo saltado',
    });
    expect(res.dish_name).toBe('Plato Test');
    expect(service.analyzePlate).toHaveBeenCalled();
  });
});
