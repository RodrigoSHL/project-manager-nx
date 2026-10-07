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

  it('returns only one ordered pull batch and advances to its last sequence', async () => {
    const rows = Array.from({ length: 101 }, (_, index) => ({
      sequence: String(index + 1),
      entity_type: 'ASSET_TYPE',
      entity_id: workId,
      operation: index === 0 ? 'CREATE' : 'UPDATE',
      payload: { id: workId, tenant_id: tenantId },
      changed_at: '2026-09-18T12:00:00.000Z',
    }));
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ sequence: '500' }])
      .mockResolvedValueOnce(rows);
    const service = new SyncService(
      { query } as unknown as DataSource,
      {} as SyncWorkProcessor,
      {} as SyncChangeParser,
      {} as Repository<SyncOperationEntity>
    );

    const result = await service.pull(tenantId, {
      checkpoint: 0,
      deviceId,
      siteIds: [],
    });

    expect(result).toMatchObject({ checkpoint: 100, hasMore: true });
    expect(result.changes).toHaveLength(100);
    expect(result.changes[0]).toMatchObject({
      sequence: 1,
      payload: { tenantId },
    });
    // The selected sequence is cast to text; ordering by its output alias
    // would sort 1, 10, 2 and break the client's sequence validation.
    expect(query.mock.calls[1][0]).toContain(
      'ORDER BY "server_changes"."sequence" ASC'
    );
  });

  it('rejects a pull scope containing a site from another tenant', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new SyncService(
      { query } as unknown as DataSource,
      {} as SyncWorkProcessor,
      {} as SyncChangeParser,
      {} as Repository<SyncOperationEntity>
    );

    await expect(
      service.pull(tenantId, {
        checkpoint: 0,
        deviceId,
        siteIds: ['99999999-9999-4999-8999-999999999999'],
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('maps catalog sort_order to order without changing finding or snapshot fields', async () => {
    const entityTypes = [
      'FORM_SECTION',
      'FORM_ITEM',
      'CONCEPT_OPTION',
      'SEVERITY_LEVEL',
      'FINDING',
      'WORK',
    ];
    const rows = entityTypes.map((entityType, index) => ({
      sequence: String(index + 1),
      entity_type: entityType,
      entity_id: workId,
      operation: 'UPDATE',
      changed_at: '2026-10-05T12:00:00Z',
      payload:
        entityType === 'WORK'
          ? {
              id: workId,
              tenant_id: tenantId,
              form_snapshot: { sections: [{ order: 3 }] },
            }
          : { id: workId, tenant_id: tenantId, sort_order: index + 1 },
    }));
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ sequence: '6' }])
      .mockResolvedValueOnce(rows);
    const service = new SyncService(
      { query } as unknown as DataSource,
      {} as SyncWorkProcessor,
      {} as SyncChangeParser,
      {} as Repository<SyncOperationEntity>
    );
    const result = await service.pull(tenantId, {
      checkpoint: 0,
      deviceId,
      siteIds: [],
    });
    result.changes.slice(0, 4).forEach((change, index) => {
      expect(change.payload).toEqual({
        id: workId,
        tenantId,
        order: index + 1,
      });
    });
    expect(result.changes[4].payload).toEqual({
      id: workId,
      tenantId,
      sortOrder: 5,
    });
    expect(result.changes[5].payload).toEqual({
      id: workId,
      tenantId,
      formSnapshot: { sections: [{ order: 3 }] },
    });
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
