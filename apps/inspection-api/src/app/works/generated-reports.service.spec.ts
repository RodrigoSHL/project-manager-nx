import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GeneratedReportsService } from './generated-reports.service';
import { GeneratedReportStatus } from './entities/generated-report.entity';
import { WorkStatus } from './entities/work.entity';

const snapshot = {
  header: { tenantId: 'tenant', workId: 'work' },
  sections: [],
  findings: [],
};

describe('GeneratedReportsService', () => {
  function setup(status: WorkStatus, pending = 0, latestVersion = 0) {
    const manager = {
      findOne: jest.fn().mockImplementation((entity) => {
        if (entity.name === 'WorkEntity') return Promise.resolve({ status });
        return Promise.resolve(
          latestVersion ? { version: latestVersion } : null
        );
      }),
      count: jest.fn().mockResolvedValue(pending),
      create: jest.fn().mockImplementation((_entity, value) => value),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const db = {
      transaction: jest
        .fn()
        .mockImplementation((callback) => callback(manager)),
    };
    return {
      service: new GeneratedReportsService(db as unknown as DataSource),
      manager,
    };
  }

  it('refuses FINAL before review is complete', async () => {
    const { service } = setup(WorkStatus.FINISHED);
    await expect(
      service.create('tenant', 'work', GeneratedReportStatus.FINAL, snapshot)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses FINAL when any candidate remains pending', async () => {
    const { service } = setup(WorkStatus.REVIEWED, 1);
    await expect(
      service.create('tenant', 'work', GeneratedReportStatus.FINAL, snapshot)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('stores an immutable new version once reviewed', async () => {
    const { service, manager } = setup(WorkStatus.REVIEWED, 0, 2);
    const result = await service.create(
      'tenant',
      'work',
      GeneratedReportStatus.FINAL,
      snapshot,
      'Rodrigo'
    );
    expect(result).toMatchObject({
      tenantId: 'tenant',
      workId: 'work',
      version: 3,
      status: 'FINAL',
      reportSnapshot: snapshot,
      generatedBy: 'Rodrigo',
    });
    expect(manager.save).toHaveBeenCalledTimes(1);
  });
});
