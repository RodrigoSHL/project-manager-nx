import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import sharp from 'sharp';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InspectionApiClient } from './inspection-api.client';
import { InspectionTenantAccessGuard } from './inspection-tenant-access.guard';
import { ReportSettingsController } from './report-settings.controller';
import { TENANT_ROLES_KEY } from './tenant-roles.decorator';
import { TenantRolesGuard } from './tenant-roles.guard';

describe('ReportSettingsController', () => {
  const client = {
    saveReportDefaults: jest.fn(),
    saveReportLogo: jest.fn(),
  };
  const controller = new ReportSettingsController(
    client as unknown as InspectionApiClient
  );

  beforeEach(() => jest.clearAllMocks());

  it('limits cover changes to tenant administrators and verifies tenant access', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ReportSettingsController)
    ).toEqual([JwtAuthGuard, InspectionTenantAccessGuard, TenantRolesGuard]);
    for (const method of [
      'saveDefaults',
      'uploadLogo',
      'removeLogo',
    ] as const) {
      expect(
        Reflect.getMetadata(
          TENANT_ROLES_KEY,
          ReportSettingsController.prototype[method]
        )
      ).toEqual(['TENANT_ADMIN']);
    }
  });

  it('accepts only supported defaults and trims the saved values', () => {
    controller.saveDefaults('tenant', {
      defaults: {
        requestedBy: '  Operaciones  ',
        content: '',
        unauthorized: 'ignored',
      } as never,
    });
    expect(client.saveReportDefaults).toHaveBeenCalledWith('tenant', {
      requestedBy: 'Operaciones',
      content: null,
    });
  });

  it('normalizes a valid uploaded logo before saving it', async () => {
    const buffer = await sharp({
      create: { width: 900, height: 400, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();
    await controller.uploadLogo('tenant', {
      buffer,
      mimetype: 'image/png',
      size: buffer.length,
    });
    expect(client.saveReportLogo).toHaveBeenCalledWith(
      'tenant',
      expect.stringMatching(/^data:image\/webp;base64,/)
    );
    await expect(
      controller.uploadLogo('tenant', {
        buffer,
        mimetype: 'image/svg+xml',
        size: buffer.length,
      })
    ).rejects.toThrow(BadRequestException);
  });
});
