import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user-api/user-api.client';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
