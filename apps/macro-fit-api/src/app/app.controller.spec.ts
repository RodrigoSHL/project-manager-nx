import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) },
        },
      ],
    }).compile();
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });
  });
  it('checks database connectivity and reports an outage as unavailable', async () => {
    const controller = app.get(AppController);
    await expect(controller.health()).resolves.toEqual({
      status: 'ok',
      database: 'ok',
    });
    jest
      .spyOn(app.get(DataSource), 'query')
      .mockRejectedValueOnce(new Error('offline'));
    await expect(controller.health()).rejects.toMatchObject({ status: 503 });
  });
});
