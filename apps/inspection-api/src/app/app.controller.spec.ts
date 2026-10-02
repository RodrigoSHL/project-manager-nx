import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('service information', () => {
    it('should identify the service', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Inspection API' });
    });

    it('should expose its health state', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.health()).toEqual({
        status: 'ok',
        service: 'inspection-api',
      });
    });
  });
});
