import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InspectionDatabase } from './inspection-db';

const databases: InspectionDatabase[] = [];
const names = new Set<string>();
function token(userId: string, expiry = Date.now() / 1000 + 3600) {
  return `header.${btoa(
    JSON.stringify({
      sub: userId,
      email: `${userId}@example.com`,
      roles: ['user'],
      exp: expiry,
    })
  )}.signature`;
}
async function boot(userId: string | null) {
  if (userId) localStorage.setItem('access_token', token(userId));
  else localStorage.removeItem('access_token');
  vi.resetModules();
  const { inspectionDb } = await import('./inspection-db');
  databases.push(inspectionDb);
  names.add(inspectionDb.name);
  return inspectionDb;
}
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});
afterEach(async () => {
  vi.unstubAllGlobals();
  for (const db of databases.splice(0)) db.close();
  for (const name of names) await Dexie.delete(name);
  names.clear();
  localStorage.clear();
});

describe('offline account boundaries', () => {
  it('isolates caches, pending changes and photos, and preserves A on offline return', async () => {
    const a = await boot('account-A');
    await a.tenants.put({ id: 'private', name: 'Private A' });
    await a.fileBlobs.put({ id: 'photo-A', blob: new Blob(['A photo']) });
    await a.outbox.put({
      id: 'pending-A',
      tenantId: 'private',
      entityType: 'WORK',
      entityId: 'work-A',
      operation: 'CREATE',
      payload: { name: 'A work' },
      createdAt: '2026-10-08',
      updatedAt: '2026-10-08',
      status: 'PENDING',
      attempts: 0,
    });
    const sessionA = await import('../features/auth/document-session');
    localStorage.setItem(
      sessionA.accountStorageKey('inspection-data-source'),
      'LOCAL'
    );
    const b = await boot('account-B');
    expect(await b.tenants.toArray()).toEqual([]);
    expect(await b.outbox.toArray()).toEqual([]);
    expect(await b.fileBlobs.toArray()).toEqual([]);
    const sessionB = await import('../features/auth/document-session');
    expect(
      localStorage.getItem(sessionB.accountStorageKey('inspection-data-source'))
    ).toBeNull();
    await expect(a.tenants.toArray()).rejects.toThrow('La cuenta cambió');
    await expect(
      a.outbox.put({ id: 'late', tenantId: 'private' } as never)
    ).rejects.toThrow('La cuenta cambió');
    const returningA = await boot('account-A');
    expect((await returningA.tenants.get('private'))?.name).toBe('Private A');
    expect((await returningA.outbox.get('pending-A'))?.status).toBe('PENDING');
    expect((await returningA.fileBlobs.get('photo-A'))?.blob.size).toBe(7);
    expect(
      localStorage.getItem(sessionA.accountStorageKey('inspection-data-source'))
    ).toBe('LOCAL');
    // An invalidated old document cannot resume even after the same user returns.
    await expect(a.tenants.toArray()).rejects.toThrow('La cuenta cambió');
  });

  it('rejects an in-flight A download and subsequent A network requests after B login', async () => {
    const a = await boot('account-A');
    const { authenticatedFetch } = await import(
      '../features/auth/authenticated-fetch'
    );
    const tokenA = localStorage.getItem('access_token');
    let finish!: (response: Response) => void;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    const download = authenticatedFetch('/api/inspection/tenants').then(
      async (response) => {
        const tenant = await response.json();
        await a.tenants.put(tenant);
      }
    );
    const rejection = expect(download).rejects.toThrow('La cuenta cambió');
    const b = await boot('account-B');
    finish(new Response(JSON.stringify({ id: 'private', name: 'Private A' })));
    await rejection;
    await expect(
      authenticatedFetch('/api/inspection/sync/push', { method: 'POST' })
    ).rejects.toThrow('La cuenta cambió');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      `Bearer ${tokenA}`
    );
    expect(await b.tenants.count()).toBe(0);
  });

  it('does not clear a newer token when an old request returns 401', async () => {
    await boot('account-A');
    const { authenticatedFetch } = await import(
      '../features/auth/authenticated-fetch'
    );
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          })
      )
    );
    const request = authenticatedFetch('/api/inspection/works');
    const newerToken = token('account-A', Date.now() / 1000 + 7200);
    localStorage.setItem('access_token', newerToken);
    finish(new Response(null, { status: 401 }));
    expect((await request).status).toBe(401);
    expect(localStorage.getItem('access_token')).toBe(newerToken);
  });

  it('stops an actual outbox sync across an account change and retains retryable work for A', async () => {
    const a = await boot('account-A');
    const { outboxRepository } = await import(
      '../repositories/outbox-repository'
    );
    const { syncService } = await import('../services/sync-service');
    const tokenA = localStorage.getItem('access_token');
    const pending = await outboxRepository.enqueue({
      tenantId: 'private',
      entityType: 'WORK',
      entityId: 'work-A',
      operation: 'CREATE',
      payload: { name: 'Private work A' },
    });
    if (!pending) throw new Error('Expected a queued create');
    let finish!: (response: Response) => void;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    const sync = syncService.pushPendingChanges('private');
    const rejection = expect(sync).rejects.toThrow('La cuenta cambió');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const b = await boot('account-B');
    finish(
      new Response(
        JSON.stringify([
          { outboxId: pending.id, success: true, entityId: 'work-A' },
        ])
      )
    );
    await rejection;
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      `Bearer ${tokenA}`
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await b.outbox.count()).toBe(0);
    const returningA = await boot('account-A');
    const { syncService: resumedSync } = await import(
      '../services/sync-service'
    );
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { outboxId: pending.id, success: true, entityId: 'work-A' },
        ])
      )
    );
    expect(await resumedSync.pushPendingChanges('private')).toMatchObject({
      total: 1,
      synced: 1,
      failed: 0,
    });
    expect((await returningA.outbox.get(pending.id))?.status).toBe(
      'ACKNOWLEDGED'
    );
    await expect(a.outbox.count()).rejects.toThrow('La cuenta cambió');
  });

  it('quarantines the unowned legacy database without deleting its contents', async () => {
    names.add('gridassets-inspection');
    const legacy = new Dexie('gridassets-inspection');
    legacy.version(1).stores({ tenants: 'id' });
    await legacy.table('tenants').put({ id: 'legacy', name: 'Unknown owner' });
    const b = await boot('account-B');
    expect(b.name).not.toBe(legacy.name);
    expect(await b.tenants.count()).toBe(0);
    expect(await legacy.table('tenants').get('legacy')).toMatchObject({
      name: 'Unknown owner',
    });
    legacy.close();
  });

  it('selects an empty anonymous namespace for expired sessions', async () => {
    const a = await boot('account-A');
    await a.tenants.put({ id: 'private', name: 'A' });
    localStorage.setItem('access_token', token('account-A', 1));
    vi.resetModules();
    const { inspectionDb: anonymous } = await import('./inspection-db');
    databases.push(anonymous);
    names.add(anonymous.name);
    expect(anonymous.name).toContain(':anonymous');
    expect(await anonymous.tenants.count()).toBe(0);
  });
});
