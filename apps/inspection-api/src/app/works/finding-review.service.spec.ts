import { BadRequestException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { SeverityLevelEntity } from '../catalog/entities/severity-level.entity';
import { FindingReviewService } from './finding-review.service';
import {
  FindingCandidateEntity,
  FindingSource,
  FindingStatus,
} from './entities/finding-candidate.entity';
import { FindingEntity } from './entities/finding.entity';
import { WorkEntity, WorkStatus } from './entities/work.entity';

const tenantId = '00000000-0000-4000-8000-000000000001';
const workId = '00000000-0000-4000-8000-000000000002';
const candidateId = '00000000-0000-4000-8000-000000000003';
const childAssetId = '00000000-0000-4000-8000-000000000004';
const itemId = '00000000-0000-4000-8000-000000000005';

function setup() {
  const work = {
    id: workId,
    tenantId,
    status: WorkStatus.FINISHED,
    title: 'Transformador T1',
    formSnapshot: {
      sections: [
        {
          items: [
            {
              id: itemId,
              assetNameSnapshot: 'Radiador R2',
              concept: { name: 'Temperatura', unit: '°C' },
            },
          ],
        },
      ],
    },
  } as WorkEntity;
  const candidate = {
    id: candidateId,
    tenantId,
    workId,
    workItemId: itemId,
    assetId: childAssetId,
    source: FindingSource.ANALOG,
    title: 'Temperatura alta',
    measuredValue: '95 °C',
    maxValue: 80,
    status: FindingStatus.PENDING,
  } as FindingCandidateEntity;
  const candidates = [candidate];
  const findings: FindingEntity[] = [];
  const manager = {
    findOne: jest.fn(
      async (
        entity: unknown,
        options?: { where?: { id?: string; sourceCandidateId?: string } }
      ) =>
        entity === WorkEntity
          ? work
          : entity === FindingCandidateEntity
          ? candidates.find((item) => item.id === options?.where?.id) ?? null
          : entity === FindingEntity
          ? findings.find(
              (item) =>
                item.sourceCandidateId === options?.where?.sourceCandidateId
            ) ?? null
          : entity === SeverityLevelEntity
          ? { id: options?.where?.id, tenantId }
          : null
    ),
    create: jest.fn((_entity: unknown, value: FindingEntity) => value),
    save: jest.fn(
      async (
        entity: unknown,
        value: FindingEntity | FindingCandidateEntity | WorkEntity
      ) => {
        if (entity === FindingEntity) {
          const row = value as FindingEntity;
          const previous = findings.findIndex(
            (item) => item.sourceCandidateId === row.sourceCandidateId
          );
          const saved = {
            id:
              previous < 0
                ? `finding-${findings.length + 1}`
                : findings[previous].id,
            ...row,
          } as FindingEntity;
          if (previous < 0) findings.push(saved);
          else findings[previous] = saved;
          return saved;
        }
        return value;
      }
    ),
    count: jest.fn(
      async () =>
        candidates.filter((item) => item.status === FindingStatus.PENDING)
          .length
    ),
  };
  const dataSource = {
    transaction: (action: (value: unknown) => Promise<unknown>) =>
      action(manager),
  } as unknown as DataSource;
  return {
    service: new FindingReviewService(dataSource),
    manager,
    work,
    candidate,
    candidates,
    findings,
    getFinding: () => findings[0],
  };
}

describe('FindingReviewService', () => {
  it('confirms the same candidate idempotently and keeps its child asset and snapshots', async () => {
    const { service, candidate, getFinding } = setup();
    await service.confirm(tenantId, workId, candidateId, {
      title: 'Temperatura elevada',
      manHours: 4,
      materials: '-',
    });
    const firstId = getFinding()?.id;
    expect(candidate.status).toBe(FindingStatus.CONFIRMED);
    expect(getFinding()).toMatchObject({
      assetId: childAssetId,
      assetNameSnapshot: 'Radiador R2',
      conceptNameSnapshot: 'Temperatura',
      manHours: 4,
      sourceCandidateId: candidateId,
    });
    await service.confirm(tenantId, workId, candidateId, {
      title: 'Temperatura validada',
      manHours: 2.5,
    });
    expect(getFinding()).toMatchObject({
      id: firstId,
      title: 'Temperatura validada',
      manHours: 2.5,
    });
  });

  it('blocks finalization with pending candidates and allows it after discard', async () => {
    const { service, work, candidate } = setup();
    await expect(service.finalize(tenantId, workId)).rejects.toThrow(
      BadRequestException
    );
    await service.discard(tenantId, workId, candidateId, {
      reason: 'Lectura incorrecta',
    });
    expect(candidate).toMatchObject({
      status: FindingStatus.DISCARDED,
      discardReason: 'Lectura incorrecta',
    });
    await service.finalize(tenantId, workId);
    expect(work.status).toBe(WorkStatus.REVIEWED);
    await expect(
      service.confirm(tenantId, workId, candidateId, { title: 'Tardío' })
    ).rejects.toThrow(BadRequestException);
  });

  it('does not allow discarding a confirmed candidate', async () => {
    const { service } = setup();
    await service.confirm(tenantId, workId, candidateId, {
      title: 'Confirmado',
    });
    await expect(
      service.discard(tenantId, workId, candidateId, {})
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps the suggested severity while saving the reviewer severity separately', async () => {
    const { service, candidate, getFinding } = setup();
    const suggested = '00000000-0000-4000-8000-000000000008';
    const final = '00000000-0000-4000-8000-000000000009';
    candidate.suggestedSeverityId = suggested;
    await service.confirm(tenantId, workId, candidateId, {
      title: 'Temperatura validada',
      severityId: final,
    });
    expect(candidate.suggestedSeverityId).toBe(suggested);
    expect(getFinding()?.severityId).toBe(final);
  });

  it('reviews three candidates into two findings and one discard', async () => {
    const { service, work, candidates, findings } = setup();
    const secondId = '00000000-0000-4000-8000-000000000006';
    const thirdId = '00000000-0000-4000-8000-000000000007';
    candidates.push(
      {
        ...candidates[0],
        id: secondId,
        source: FindingSource.DIGITAL,
        title: 'Ventilador no operativo',
        status: FindingStatus.PENDING,
      },
      {
        ...candidates[0],
        id: thirdId,
        source: FindingSource.MANUAL,
        title: 'Observación manual',
        status: FindingStatus.PENDING,
      }
    );
    await service.confirm(tenantId, workId, candidateId, {
      title: 'Temperatura elevada',
      manHours: 4,
      materials: '-',
    });
    await service.confirm(tenantId, workId, secondId, {
      title: 'Ventilador detenido',
      manHours: 2.5,
    });
    await expect(service.finalize(tenantId, workId)).rejects.toThrow(
      'Aún existen 1'
    );
    await service.discard(tenantId, workId, thirdId, {
      reason: 'No corresponde',
    });
    await service.finalize(tenantId, workId);
    expect(candidates.map((item) => item.status)).toEqual([
      FindingStatus.CONFIRMED,
      FindingStatus.CONFIRMED,
      FindingStatus.DISCARDED,
    ]);
    expect(findings).toHaveLength(2);
    expect(work.status).toBe(WorkStatus.REVIEWED);
  });
});
