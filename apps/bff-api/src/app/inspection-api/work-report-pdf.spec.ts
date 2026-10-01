import { writeFileSync } from 'fs';
import sharp from 'sharp';
import { FilesApiService } from '../files-api/files-api.service';
import { WorkReportPdf } from './work-report-pdf';
import { WorkReport } from './work-report';

describe('WorkReportPdf', () => {
  it('renders a multipage report with a photo and findings', async () => {
    const png = await sharp({
      create: { width: 800, height: 500, channels: 3, background: '#aaccee' },
    })
      .png()
      .toBuffer();
    const logo = await sharp({
      create: { width: 300, height: 100, channels: 3, background: '#008a96' },
    })
      .webp()
      .toBuffer();
    const files = {
      content: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve(new Response(new Blob([png], { type: 'image/png' })))
        ),
    };
    const renderer = new WorkReportPdf(files as unknown as FilesApiService);
    const report: WorkReport = {
      header: {
        tenantId: 'tenant',
        workId: 'work',
        title: 'Mantenimiento preventivo',
        executionDate: '2026-09-29',
        site: 'Faena Norte',
        asset: 'Transformador T1',
        workType: 'Inspección visual',
        responsible: 'Rodrigo',
        company: 'Contratista',
        status: 'REVIEWED',
        content: null,
        requestedBy: null,
        preparedBy: 'Rodrigo',
        approvedBy: null,
        distribution: null,
        receivedBy: null,
        introduction: 'Revisión del equipo.',
      },
      branding: {
        tenantId: 'tenant',
        companyName: 'Minera de prueba',
        logoUrl: `data:image/webp;base64,${logo.toString('base64')}`,
      },
      sections: Array.from({ length: 5 }, (_, section) => ({
        id: String(section),
        title: `Sección ${section + 1}`,
        assetPath: `Transformador T1 › Componente ${(section % 4) + 1}`,
        items: Array.from({ length: 5 }, (_, item) => ({
          id: `${section}-${item}`,
          type: item === 4 ? ('TASK' as const) : ('CONCEPT' as const),
          title: item === 4 ? 'Revisar equipo' : 'Temperatura',
          assetPath: `Transformador T1 › Componente ${(section % 4) + 1}`,
          value: '51 °C',
          completed: item === 4,
          observation: section < 3 && item === 0 ? 'Medición realizada' : null,
          photos:
            section < 4 && item < 2
              ? [
                  {
                    id: `photo-${section}-${item}`,
                    caption: `Componente ${(section % 4) + 1} · Temperatura`,
                  },
                ]
              : [],
        })),
      })),
      observations: 'Equipo sin novedades adicionales.',
      findings: Array.from({ length: 4 }, (_, index) => ({
        number: index + 1,
        id: `finding-${index}`,
        assetPath: `Transformador T1 › Componente ${index + 1}`,
        title: 'Temperatura elevada',
        description: 'Revisar ventilación',
        severity: 'ALTA',
        manHours: 2,
        materials: 'Filtro',
      })),
    };
    const buffer = await renderer.render(report, {} as never, {
      version: 1,
      status: 'DRAFT',
    });
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(3000);
    expect(
      (buffer.toString('latin1').match(/\/Type \/Page\b/g) || []).length
    ).toBeGreaterThanOrEqual(3);
    expect(files.content).toHaveBeenCalledTimes(8);
    expect(
      (buffer.toString('latin1').match(/\/Type \/Page\b/g) || []).length
    ).toBeLessThan(15);
    if (process.env.REPORT_PDF_SAMPLE_PATH)
      writeFileSync(process.env.REPORT_PDF_SAMPLE_PATH, buffer);
    const defaultLogo = await renderer.render(
      { ...report, branding: { ...report.branding, logoUrl: null } },
      {} as never
    );
    expect(defaultLogo.subarray(0, 4).toString()).toBe('%PDF');
    if (process.env.REPORT_PDF_SAMPLE_PATH)
      writeFileSync(
        process.env.REPORT_PDF_SAMPLE_PATH.replace(/\.pdf$/, '-default.pdf'),
        defaultLogo
      );
  });
});
