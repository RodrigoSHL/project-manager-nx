import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ClipboardList } from 'lucide-react';
import { MetricCard } from './metric-card';
import { MeasurementsStatusCard } from './measurements-status-card';
import { TopAssetsByFindings } from './dashboard-rankings';
import type { AnalyticsSummary } from '../models';

const summary: AnalyticsSummary = {
  totalWorks: 182,
  totalInspectedAssets: 74,
  totalFindings: 31,
  measurementsEvaluable: 1200,
  measurementsInRange: 1092,
  measurementsOutOfRange: 108,
  percentageInRange: 91,
  findingsBySeverity: [
    { severityId: 'high', code: 'HIGH', name: 'Alta', count: 11 },
  ],
};

describe('dashboard presentation', () => {
  it('renders the backend KPI values and measurement context', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MetricCard
          label="Trabajos realizados"
          value={summary.totalWorks.toLocaleString('es-CL')}
          detail="Trabajos finalizados o revisados"
          icon={ClipboardList}
        />
        <MetricCard
          label="Activos inspeccionados"
          value={summary.totalInspectedAssets.toLocaleString('es-CL')}
          detail="Activos únicos"
          icon={ClipboardList}
        />
        <MetricCard
          label="Hallazgos"
          value={summary.totalFindings.toLocaleString('es-CL')}
          detail="11 en Alta"
          icon={ClipboardList}
          to="/findings"
        />
        <MetricCard
          label="Mediciones en rango"
          value={`${summary.percentageInRange} %`}
          detail="1.092 de 1.200 mediciones evaluables"
          icon={ClipboardList}
        />
        <MeasurementsStatusCard summary={summary} />
      </MemoryRouter>
    );
    expect(html).toContain('182');
    expect(html).toContain('74');
    expect(html).toContain('31');
    expect(html).toContain('91 %');
    expect(html).toContain('1.092 de 1.200');
    expect(html).toContain('Fuera de rango');
    expect(html).toContain('108');
  });

  it('attributes a child Finding to the child asset and links to its history', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <TopAssetsByFindings
          rows={[
            { assetId: 'radiador-r2', assetName: 'Radiador R2', count: 3 },
          ]}
          search="?tenantId=tenant-1&siteId=north"
        />
      </MemoryRouter>
    );
    expect(html).toContain('Radiador R2');
    expect(html).toContain(
      '/assets/radiador-r2/history?tenantId=tenant-1&amp;siteId=north'
    );
  });

  it('does not present zero percent when there are no evaluable readings', () => {
    const empty = {
      ...summary,
      measurementsEvaluable: 0,
      measurementsInRange: 0,
      measurementsOutOfRange: 0,
      percentageInRange: undefined,
    };
    const html = renderToStaticMarkup(
      <MetricCard
        label="Mediciones en rango"
        value="—"
        detail={
          empty.measurementsEvaluable
            ? 'Porcentaje'
            : 'Sin mediciones evaluables'
        }
        icon={ClipboardList}
      />
    );
    expect(html).toContain('Sin mediciones evaluables');
    expect(html).not.toContain('0 %');
  });
});
