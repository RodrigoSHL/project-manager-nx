import { describe, expect, it } from 'vitest';
import type { WorkTemplateSnapshot } from './models';
import { toWorkResponsesPayload } from './work-api';

const snapshot: WorkTemplateSnapshot = {
  workId: 'work',
  tenantId: 'tenant',
  formTemplateId: 'template',
  formTemplateVersion: 1,
  name: 'Inspección',
  sections: [
    {
      id: 'section',
      title: 'Mediciones',
      order: 1,
      items: [
        {
          id: 'item',
          type: 'CONCEPT',
          order: 1,
          required: false,
          concept: {
            id: 'concept',
            code: 'RPM',
            name: 'Velocidad',
            type: 'ANALOG',
            options: [],
          },
        },
      ],
    },
  ],
};

describe('work response payload', () => {
  it('sends the measurement day and optional time for an analog response', () => {
    const payload = toWorkResponsesPayload(snapshot, {
      item: {
        valueNumber: 900,
        measuredAt: '2026-09-23',
        measuredAtTime: '14:35',
      },
    });
    expect(payload.responses).toEqual([
      {
        formItemId: 'item',
        valueNumber: 900,
        measuredAt: '2026-09-23',
        measuredAtTime: '14:35',
      },
    ]);
  });

  it('can clear a recorded time without changing its measurement day', () => {
    const payload = toWorkResponsesPayload(snapshot, {
      item: {
        valueNumber: 900,
        measuredAt: '2026-09-23',
        measuredAtTime: null,
      },
    });
    expect(payload.responses[0]).toMatchObject({
      measuredAt: '2026-09-23',
      measuredAtTime: null,
    });
  });
});
