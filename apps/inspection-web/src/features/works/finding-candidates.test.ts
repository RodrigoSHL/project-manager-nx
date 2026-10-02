import { describe, expect, it } from 'vitest';
import { deriveFindingCandidates } from './finding-candidates';
import type { Work, WorkTemplateSnapshot } from './models';

const tenantId = '00000000-0000-4000-8000-000000000001';
const workId = '00000000-0000-4000-8000-000000000002';
const assetId = '00000000-0000-4000-8000-000000000003';
const childId = '00000000-0000-4000-8000-000000000004';
const digitalId = '00000000-0000-4000-8000-000000000005';
const analogId = '00000000-0000-4000-8000-000000000006';
const work = { id: workId, tenantId, assetId } as Work;
const snapshot = {
  workId,
  tenantId,
  sections: [
    {
      items: [
        {
          id: digitalId,
          assetId: childId,
          type: 'CONCEPT',
          concept: {
            id: 'digital',
            name: 'Estado',
            type: 'DIGITAL',
            options: [
              { id: 'normal', label: 'Operativo' },
              {
                id: 'bad',
                label: 'No operativo',
                generatesFinding: true,
                suggestedSeverityId: 'high',
              },
            ],
          },
        },
        {
          id: analogId,
          assetId: childId,
          type: 'CONCEPT',
          concept: {
            id: 'analog',
            name: 'Temperatura',
            type: 'ANALOG',
            unit: '°C',
            minValue: 0,
            maxValue: 40,
            options: [],
          },
        },
      ],
    },
  ],
} as unknown as WorkTemplateSnapshot;

describe('finding candidate rules', () => {
  it('ignores normal digital and analog answers', () => {
    expect(
      deriveFindingCandidates(work, snapshot, {
        [digitalId]: { selectedOptionId: 'normal' },
        [analogId]: { valueNumber: 35 },
      })
    ).toEqual([]);
  });

  it('creates one candidate per anomalous response and keeps the descendant asset', () => {
    const values = {
      [digitalId]: { selectedOptionId: 'bad' },
      [analogId]: { valueNumber: 51 },
    };
    const first = deriveFindingCandidates(work, snapshot, values);
    expect(first.map((item) => item.source)).toEqual(['DIGITAL', 'ANALOG']);
    expect(
      first.every(
        (item) => item.assetId === childId && item.status === 'PENDING'
      )
    ).toBe(true);
    expect(first[0].suggestedSeverityId).toBe('high');
    const updated = deriveFindingCandidates(
      work,
      snapshot,
      { ...values, [analogId]: { valueNumber: 52 } },
      first
    );
    expect(updated[1].id).toBe(first[1].id);
    expect(updated[1].measuredValue).toBe('52 °C');
  });

  it('creates a manual candidate only when explicitly marked with a comment', () => {
    expect(
      deriveFindingCandidates(work, snapshot, {
        [analogId]: { comment: 'Olor a quemado' },
      })
    ).toEqual([]);
    const found = deriveFindingCandidates(work, snapshot, {
      [analogId]: { comment: 'Olor a quemado', isFinding: true },
    });
    expect(found).toHaveLength(1);
    expect(found[0].source).toBe('MANUAL');
  });

  it('removes a pending candidate when normal, preserving a reviewed one', () => {
    const abnormal = deriveFindingCandidates(work, snapshot, {
      [analogId]: { valueNumber: 51 },
    });
    expect(
      deriveFindingCandidates(
        work,
        snapshot,
        { [analogId]: { valueNumber: 35 } },
        abnormal
      )
    ).toEqual([]);
    const confirmed = [{ ...abnormal[0], status: 'CONFIRMED' as const }];
    expect(
      deriveFindingCandidates(
        work,
        snapshot,
        { [analogId]: { valueNumber: 52 } },
        confirmed
      )
    ).toEqual(confirmed);
    expect(
      deriveFindingCandidates(
        work,
        snapshot,
        { [analogId]: { valueNumber: 35 } },
        confirmed
      )
    ).toEqual(confirmed);
  });
});
