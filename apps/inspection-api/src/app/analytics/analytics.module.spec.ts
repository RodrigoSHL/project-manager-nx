import { Global, Module } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsModule } from './analytics.module';

const dataSource = {
  entityMetadatas: [],
  options: { type: 'postgres' },
  getRepository: jest.fn(() => ({ exist: jest.fn() })),
  query: jest.fn(),
};

@Global()
@Module({
  providers: [{ provide: getDataSourceToken(), useValue: dataSource }],
  exports: [getDataSourceToken()],
})
class FakeDataSourceModule {}

describe('AnalyticsModule', () => {
  it('resolves the active-tenant guard and its tenant repository on startup', async () => {
    const app = await Test.createTestingModule({
      imports: [FakeDataSourceModule, AnalyticsModule],
    }).compile();

    expect(app.get(AnalyticsController)).toBeDefined();
    await app.close();
  });
});
