import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type {
  Finding,
  FindingCandidate,
  Work,
  WorkTemplateSnapshot,
} from '../models';
import { FindingReview } from './finding-review';

const work = { id: 'work-1', tenantId: 'tenant-1', status: 'FINISHED' } as Work;
const snapshot = {
  sections: [
    {
      items: [
        {
          id: 'item-1',
          assetNameSnapshot: 'Radiador R2',
          concept: { name: 'Temperatura', unit: '°C' },
        },
      ],
    },
  ],
} as WorkTemplateSnapshot;
const candidate = {
  id: 'candidate-1',
  tenantId: 'tenant-1',
  workId: 'work-1',
  workItemId: 'item-1',
  source: 'ANALOG',
  title: 'Temperatura alta',
  measuredValue: '95 °C',
  minValue: 0,
  maxValue: 80,
  status: 'PENDING',
} as FindingCandidate;
const finding = {
  id: 'finding-1',
  tenantId: 'tenant-1',
  workId: 'work-1',
  sourceCandidateId: 'candidate-1',
  title: 'Temperatura elevada',
  assetNameSnapshot: 'Radiador R2',
  manHours: 4,
  materials: 'Revisar refrigeración',
  sortOrder: 0,
} as Finding;

describe('FindingReview', () => {
  it('shows child asset context, analog difference and blocks finalization while pending', () => {
    const html = renderToStaticMarkup(
      <FindingReview
        work={work}
        snapshot={snapshot}
        candidates={[candidate]}
        findings={[]}
        severities={[]}
        canReview
        online
        busy={false}
        onConfirm={vi.fn()}
        onDiscard={vi.fn()}
        onFinalize={vi.fn()}
      />
    );
    expect(html).toContain('Radiador R2');
    expect(html).toContain('95 °C');
    expect(html).toContain('Diferencia: +15 °C');
    expect(html).toMatch(
      /<button[^>]*disabled[^>]*>Cerrar revisión de hallazgos/
    );
  });

  it('renders the final summary with hours and materials', () => {
    const html = renderToStaticMarkup(
      <FindingReview
        work={{ ...work, status: 'REVIEWED' }}
        snapshot={snapshot}
        candidates={[{ ...candidate, status: 'CONFIRMED' }]}
        findings={[finding]}
        severities={[]}
        canReview={false}
        online
        busy={false}
        onConfirm={vi.fn()}
        onDiscard={vi.fn()}
        onFinalize={vi.fn()}
      />
    );
    expect(html).toContain('Hallazgos aprobados');
    expect(html).toContain('Temperatura elevada');
    expect(html).toContain('Revisar refrigeración');
    expect(html).toContain('>4</td>');
  });
});
