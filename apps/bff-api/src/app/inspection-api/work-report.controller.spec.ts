import { WorkReportController } from './work-report.controller';
import { WorkReportBuilder } from './work-report';
import { WorkReportPdf } from './work-report-pdf';
import { InspectionApiClient } from './inspection-api.client';
import type { ExpressRequestWithUser } from '../auth/types/express-request-with-user';

describe('WorkReportController approval', () => {
  it('records the authenticated approver on a final report version', async () => {
    const builder = {
      buildWorkReport: jest.fn().mockResolvedValue({ header: {} }),
    };
    const inspection = {
      createReport: jest.fn().mockResolvedValue({ id: 'report' }),
    };
    const controller = new WorkReportController(
      builder as unknown as WorkReportBuilder,
      {} as WorkReportPdf,
      inspection as unknown as InspectionApiClient
    );
    const user = {
      user: { name: 'María Supervisora' },
    } as ExpressRequestWithUser;

    await controller.create('tenant', 'work', user, {
      status: 'FINAL',
      options: { approvedBy: 'Someone else', content: 'Maintenance' },
    });

    expect(builder.buildWorkReport).toHaveBeenCalledWith(
      'tenant',
      'work',
      user.user,
      { approvedBy: 'María Supervisora', content: 'Maintenance' }
    );
    expect(inspection.createReport).toHaveBeenCalledWith(
      'tenant',
      'work',
      expect.objectContaining({
        status: 'FINAL',
        generatedBy: 'María Supervisora',
      })
    );
  });

  it('never marks a draft as approved from client supplied text', async () => {
    const builder = {
      buildWorkReport: jest.fn().mockResolvedValue({ header: {} }),
    };
    const inspection = {
      createReport: jest.fn().mockResolvedValue({ id: 'draft' }),
    };
    const controller = new WorkReportController(
      builder as unknown as WorkReportBuilder,
      {} as WorkReportPdf,
      inspection as unknown as InspectionApiClient
    );
    const request = {
      user: { name: 'María Supervisora' },
    } as ExpressRequestWithUser;

    await controller.create('tenant', 'work', request, {
      status: 'DRAFT',
      options: { approvedBy: 'Someone else' },
    });

    expect(builder.buildWorkReport).toHaveBeenCalledWith(
      'tenant',
      'work',
      request.user,
      {
        approvedBy: null,
      }
    );
  });
});
