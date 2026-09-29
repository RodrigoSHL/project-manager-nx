import { FindingCandidateService } from './finding-candidate.service';
import { ConceptType } from '../catalog/entities/concept.entity';
import {
  FindingCandidateEntity,
  FindingStatus,
} from './entities/finding-candidate.entity';
import { ConceptResponseEntity } from './entities/concept-response.entity';
import { WorkItemAnnotationEntity } from './entities/work-item-annotation.entity';
import { WorkEntity } from './entities/work.entity';
import type { EntityManager } from 'typeorm';

const tenantId = '00000000-0000-4000-8000-000000000001';
const workId = '00000000-0000-4000-8000-000000000002';
const itemId = '00000000-0000-4000-8000-000000000003';
const work = {
  id: workId,
  tenantId,
  assetId: '00000000-0000-4000-8000-000000000004',
  formSnapshot: {
    sections: [
      {
        items: [
          {
            id: itemId,
            type: 'CONCEPT',
            concept: {
              id: '00000000-0000-4000-8000-000000000005',
              name: 'Temperatura',
              type: ConceptType.ANALOG,
              unit: '°C',
              minValue: 0,
              maxValue: 40,
              options: [],
            },
          },
        ],
      },
    ],
  },
} as WorkEntity;

describe('FindingCandidateService', () => {
  function setup(valueNumber: number, old: FindingCandidateEntity[] = []) {
    const responses = {
      find: jest.fn().mockResolvedValue([{ formItemId: itemId, valueNumber }]),
    };
    const annotations = { find: jest.fn().mockResolvedValue([]) };
    const candidates = {
      find: jest.fn().mockResolvedValue(old),
      save: jest.fn(async (value) => value),
      remove: jest.fn(async (value) => value),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === ConceptResponseEntity
          ? responses
          : entity === WorkItemAnnotationEntity
          ? annotations
          : candidates
      ),
    } as unknown as EntityManager;
    return { manager, responses, annotations, candidates };
  }

  it('creates a pending analog candidate with work and tenant scoping', async () => {
    const { manager, responses, candidates } = setup(51);
    await new FindingCandidateService().reconcile(manager, work);
    expect(responses.find).toHaveBeenCalledWith({
      where: { tenantId, workId },
    });
    expect(candidates.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        workId,
        workItemId: itemId,
        measuredValue: '51 °C',
        status: FindingStatus.PENDING,
      })
    );
  });

  it('updates the same candidate and removes it only while pending', async () => {
    const first = setup(51);
    await new FindingCandidateService().reconcile(first.manager, work);
    const old = first.candidates.save.mock
      .calls[0][0] as FindingCandidateEntity;
    const changed = setup(52, [old]);
    await new FindingCandidateService().reconcile(changed.manager, work);
    expect(changed.candidates.save.mock.calls[0][0].id).toBe(old.id);
    const normal = setup(35, [old]);
    await new FindingCandidateService().reconcile(normal.manager, work);
    expect(normal.candidates.remove).toHaveBeenCalledWith(old);
    const reviewed = { ...old, status: FindingStatus.CONFIRMED };
    const preserved = setup(35, [reviewed]);
    await new FindingCandidateService().reconcile(preserved.manager, work);
    expect(preserved.candidates.remove).not.toHaveBeenCalled();
  });
});
