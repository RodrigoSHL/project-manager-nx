import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user-api/user-api.client';
import { PlatformAdminController } from './platform-admin.controller';

describe('PlatformAdminController authorization', () => {
  it('requires an authenticated global administrator', () => {
    expect(Reflect.getMetadata(ROLES_KEY, PlatformAdminController)).toEqual([
      UserRole.ADMIN,
    ]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, PlatformAdminController)
    ).toEqual([JwtAuthGuard, RolesGuard]);
  });
});
