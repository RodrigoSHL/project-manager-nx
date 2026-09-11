export type UserRole = 'user' | 'admin';

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  roles: UserRole[];
}

export interface AuthSession {
  accessToken: string;
  user: CurrentUser;
}
