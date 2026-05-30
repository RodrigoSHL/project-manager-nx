import { UserRole } from '../../user-api/user-api.client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  roles: UserRole[];
}
