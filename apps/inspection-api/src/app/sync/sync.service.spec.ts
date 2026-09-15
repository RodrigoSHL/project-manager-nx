import { BadRequestException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import {
  SyncEntityType,
  SyncOperation,
  type SyncPushRequestDto,
} from './dto/sync-push.dto';
import {
  SyncOperationEntity,
  SyncOperationStatus,
} from './entities/sync-operation.entity';
import { SyncService } from './sync.service';
import type { SyncChangeParser } from './sync-change.parser';
import type { SyncWorkProcessor } from './sync-work.processor';

const tenantId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const outboxId = '33333333-3333-4333-8333-333333333333';
const workId = '44444444-4444-4444-8444-444444444444';

describe('SyncService idempotency', () => {
  it('returns success without applying an outboxId already processed', async () => {
    const transaction = jest.fn();
    const operations = {
      find: jest.fn().mockResolvedValue([
        {
          tenantId,
          outboxId,
          status: SyncOperationStatus.PROCESSED,
          processedAt: new Date('2026-09-15T12:01:00.000Z'),
        },
      ]),
    };
    const service = new SyncService(
      { transaction } as unknown as DataSource,
      {} as SyncWorkProcessor,
      {} as SyncChangeParser,
      operations as unknown as Repository<SyncOperationEntity>
    );

    await expect(service.push(tenantId, request())).resolves.toEqual([
      {
        outboxId,
        entityId: workId,
        success: true,
        serverTimestamp: '2026-09-15T12:01:00.000Z',
      },
    ]);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects a body that attempts to use another tenant', async () => {
    const service = new SyncService(
      {} as DataSource,
      {} as SyncWorkProcessor,
      {} as SyncChangeParser,
      {} as Repository<SyncOperationEntity>
    );

    await expect(
      service.push('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', request())
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function request(): SyncPushRequestDto {
  return {
    tenantId,
    deviceId,
    changes: [
      {
        outboxId,
        entityType: SyncEntityType.WORK,
        entityId: workId,
        operation: SyncOperation.CREATE,
        payload: { id: workId, tenantId },
        clientTimestamp: '2026-09-15T12:00:00.000Z',
      },
    ],
  };
}
