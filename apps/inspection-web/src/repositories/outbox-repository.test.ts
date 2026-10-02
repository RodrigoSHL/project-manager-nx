import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectionDb } from '../db/inspection-db';
import { enqueueOutboxChange } from './outbox-repository';

describe('enqueueOutboxChange', () => {
  beforeEach(async () => {
    await inspectionDb.delete();
    await inspectionDb.open();
  });

  afterEach(async () => inspectionDb.delete());

  it('consolida CREATE seguido de varios UPDATE en un CREATE final', async () => {
    await enqueueOutboxChange(change('CREATE', { title: 'Inicial' }));
    await enqueueOutboxChange(change('UPDATE', { title: 'Segundo' }));
    await enqueueOutboxChange(change('UPDATE', { title: 'Final' }));

    const items = await inspectionDb.outbox.toArray();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      entityId: 'work-1',
      operation: 'CREATE',
      payload: { title: 'Final' },
      status: 'PENDING',
      attempts: 0,
    });
  });

  it('cancela un CREATE que se elimina antes de ser enviado', async () => {
    await enqueueOutboxChange(change('CREATE', { title: 'Temporal' }));
    await enqueueOutboxChange(change('DELETE', { title: 'Temporal' }));

    await expect(inspectionDb.outbox.count()).resolves.toBe(0);
  });

  it('conserva una modificación nueva mientras la anterior está enviándose', async () => {
    const sending = await enqueueOutboxChange(
      change('CREATE', { title: 'Enviando' })
    );
    await inspectionDb.outbox.update(sending!.id, { status: 'SENDING' });

    await enqueueOutboxChange(change('UPDATE', { title: 'Cambio posterior' }));

    const items = await inspectionDb.outbox.toArray();
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.status).sort()).toEqual([
      'PENDING',
      'SENDING',
    ]);
  });
});

function change(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  payload: Record<string, unknown>
) {
  return {
    tenantId: 'tenant-1',
    entityType: 'WORK' as const,
    entityId: 'work-1',
    operation,
    payload,
    timestamp: '2026-09-15T12:00:00.000Z',
  };
}
