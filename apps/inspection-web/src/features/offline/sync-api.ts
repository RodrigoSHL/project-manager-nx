import { authenticatedFetch } from '../auth/authenticated-fetch';
import type { OutboxItem } from './models';

export type SyncPushResult = {
  outboxId: string;
  entityId: string;
  success: boolean;
  serverTimestamp?: string;
  error?: string;
};

const baseUrl = (
  import.meta.env.VITE_INSPECTION_API_URL || '/api/inspection'
).replace(/\/$/, '');

export async function pushSyncBatch(
  tenantId: string,
  deviceId: string,
  changes: OutboxItem[]
) {
  let response: Response;
  try {
    response = await authenticatedFetch(
      `${baseUrl}/tenants/${encodeURIComponent(tenantId)}/sync/push`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          deviceId,
          changes: changes.map((change) => ({
            outboxId: change.id,
            entityType: change.entityType,
            entityId: change.entityId,
            operation: change.operation,
            payload: change.payload,
            clientTimestamp: change.updatedAt,
          })),
        }),
      }
    );
  } catch {
    throw new Error('Se perdió la conexión durante la sincronización.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message;
    throw new Error(message || 'El servidor rechazó el lote de sincronización.');
  }
  return response.json() as Promise<SyncPushResult[]>;
}
