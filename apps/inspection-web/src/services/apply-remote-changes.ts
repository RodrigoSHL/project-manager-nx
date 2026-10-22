import type { Table } from 'dexie';
import { normalizeCatalogOrder } from '../db/repair-local-form-order';
import {
  inspectionDb,
  offlineSiteKey,
  syncCheckpointKey,
} from '../db/inspection-db';
import type {
  PullChange,
  PullEntityType,
  SyncPullResponse,
} from '../features/offline/models';

type StoredRecord = Record<string, unknown> & {
  id: string;
  tenantId: string;
  syncStatus?: string;
};

type ApplyRemoteChangesInput = {
  tenantId: string;
  deviceId: string;
  currentCheckpoint: number;
  response: SyncPullResponse;
};

export async function applyRemoteChanges({
  tenantId,
  deviceId,
  currentCheckpoint,
  response,
}: ApplyRemoteChangesInput) {
  assertSequenceOrder(currentCheckpoint, response);
  let conflicts = 0;

  await inspectionDb.transaction(
    'rw',
    [
      inspectionDb.sites,
      inspectionDb.assets,
      inspectionDb.assetTypes,
      inspectionDb.workTypes,
      inspectionDb.concepts,
      inspectionDb.conceptOptions,
      inspectionDb.severityLevels,
      inspectionDb.findingCandidates,
      inspectionDb.findings,
      inspectionDb.formTemplates,
      inspectionDb.formSections,
      inspectionDb.formItems,
      inspectionDb.works,
      inspectionDb.conceptResponses,
      inspectionDb.taskCompletions,
      inspectionDb.annotations,
      inspectionDb.snapshots,
      inspectionDb.offlineSites,
      inspectionDb.outbox,
      inspectionDb.syncConflictCandidates,
      inspectionDb.syncCheckpoints,
    ],
    async () => {
      for (const change of response.changes) {
        if (await applyChange(tenantId, deviceId, change)) conflicts += 1;
      }
      await inspectionDb.syncCheckpoints.put({
        id: syncCheckpointKey(tenantId, deviceId),
        tenantId,
        deviceId,
        checkpoint: response.checkpoint,
        updatedAt: new Date().toISOString(),
      });
    }
  );

  return { applied: response.changes.length - conflicts, conflicts };
}

async function applyChange(
  tenantId: string,
  deviceId: string,
  change: PullChange
) {
  const table = domainTable(change.entityType);
  const existing = await table.get(change.entityId);
  const outstanding = await outstandingOutboxChanges(tenantId, change);
  const acknowledged = outstanding.filter(
    (item) => item.status === 'ACKNOWLEDGED'
  );
  const unsent = outstanding.filter((item) => item.status !== 'ACKNOWLEDGED');
  const isOwnDeviceChange = change.sourceDeviceId === deviceId;
  const isConfirmedPushEcho = isOwnDeviceChange && acknowledged.length > 0;

  if (isOwnDeviceChange && acknowledged.length > 0) {
    for (const item of acknowledged) {
      await inspectionDb.outbox.update(item.id, { status: 'SYNCED' });
    }
  }
  if (isOwnDeviceChange && unsent.length > 0) {
    // Un cambio nuevo, creado mientras el Pull estaba en curso, gana sobre el
    // eco ya confirmado de este mismo dispositivo.
    return false;
  }
  const isDirty =
    !isConfirmedPushEcho &&
    (existing?.syncStatus === 'LOCAL_ONLY' ||
      existing?.syncStatus === 'MODIFIED' ||
      outstanding.length > 0);

  if (isDirty) {
    await inspectionDb.syncConflictCandidates.put({
      id: conflictKey(tenantId, change),
      tenantId,
      entityType: change.entityType,
      entityId: change.entityId,
      localData: existing ?? outstanding.at(-1)?.payload ?? null,
      remoteData:
        change.operation === 'DELETE'
          ? { operation: 'DELETE' }
          : change.payload ?? null,
      remoteSequence: change.sequence,
      detectedAt: new Date().toISOString(),
      status: 'PENDING',
    });
    return true;
  }

  if (change.operation === 'DELETE') {
    await table.delete(change.entityId);
    if (change.entityType === 'WORK') {
      await inspectionDb.snapshots.delete(change.entityId);
    }
    if (change.entityType === 'SITE') {
      await inspectionDb.offlineSites.delete(
        offlineSiteKey(tenantId, change.entityId)
      );
    }
    return false;
  }

  const payload = normalizeCatalogOrder(
    change.entityType,
    requirePayload(tenantId, change)
  );
  if (change.entityType === 'WORK') {
    const { formSnapshot, ...work } = payload;
    await table.put({ ...work, syncStatus: 'SYNCED' } as StoredRecord);
    if (formSnapshot && typeof formSnapshot === 'object') {
      await inspectionDb.snapshots.put({
        ...(formSnapshot as Record<string, unknown>),
        workId: change.entityId,
        tenantId,
      } as never);
    }
    return false;
  }

  if (isMutableEntity(change.entityType)) {
    await table.put({ ...payload, syncStatus: 'SYNCED' } as StoredRecord);
  } else {
    await table.put(payload as StoredRecord);
  }
  return false;
}

async function outstandingOutboxChanges(tenantId: string, change: PullChange) {
  const outboxType = toOutboxType(change.entityType);
  if (!outboxType) return [];
  return inspectionDb.outbox
    .where('[tenantId+entityType+entityId]')
    .equals([tenantId, outboxType, change.entityId])
    .filter((item) => item.status !== 'SYNCED')
    .sortBy('updatedAt');
}

function requirePayload(tenantId: string, change: PullChange) {
  if (!change.payload) {
    throw new Error(
      `El cambio ${change.sequence} no contiene el registro remoto.`
    );
  }
  if (
    change.payload.id !== change.entityId ||
    change.payload.tenantId !== tenantId
  ) {
    throw new Error(
      `El cambio ${change.sequence} no coincide con el tenant o entidad solicitada.`
    );
  }
  return change.payload as StoredRecord;
}

function assertSequenceOrder(
  currentCheckpoint: number,
  response: SyncPullResponse
) {
  if (response.checkpoint < currentCheckpoint) {
    throw new Error('El servidor devolvió un checkpoint anterior al local.');
  }
  let previous = currentCheckpoint;
  for (const change of response.changes) {
    if (
      !Number.isSafeInteger(change.sequence) ||
      change.sequence <= previous ||
      change.sequence > response.checkpoint
    ) {
      throw new Error('Los cambios remotos no respetan el orden de sequence.');
    }
    previous = change.sequence;
  }
}

function domainTable(type: PullEntityType): Table<StoredRecord, string> {
  const table =
    type === 'SITE'
      ? inspectionDb.sites
      : type === 'ASSET'
      ? inspectionDb.assets
      : type === 'ASSET_TYPE'
      ? inspectionDb.assetTypes
      : type === 'WORK_TYPE'
      ? inspectionDb.workTypes
      : type === 'CONCEPT'
      ? inspectionDb.concepts
      : type === 'CONCEPT_OPTION'
      ? inspectionDb.conceptOptions
      : type === 'SEVERITY_LEVEL'
      ? inspectionDb.severityLevels
      : type === 'FINDING_CANDIDATE'
      ? inspectionDb.findingCandidates
      : type === 'FINDING'
      ? inspectionDb.findings
      : type === 'FORM_TEMPLATE'
      ? inspectionDb.formTemplates
      : type === 'FORM_SECTION'
      ? inspectionDb.formSections
      : type === 'FORM_ITEM'
      ? inspectionDb.formItems
      : type === 'WORK'
      ? inspectionDb.works
      : type === 'RESPONSE'
      ? inspectionDb.conceptResponses
      : type === 'TASK_COMPLETION'
      ? inspectionDb.taskCompletions
      : inspectionDb.annotations;
  return table as unknown as Table<StoredRecord, string>;
}

function isMutableEntity(type: PullEntityType) {
  return ['WORK', 'RESPONSE', 'TASK_COMPLETION', 'ANNOTATION'].includes(type);
}

function toOutboxType(type: PullEntityType) {
  return ['WORK', 'RESPONSE', 'TASK_COMPLETION', 'ANNOTATION'].includes(type)
    ? (type as 'WORK' | 'RESPONSE' | 'TASK_COMPLETION' | 'ANNOTATION')
    : undefined;
}

function conflictKey(tenantId: string, change: PullChange) {
  return `${tenantId}:${change.entityType}:${change.entityId}:${change.sequence}`;
}
