import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user';

export interface ExpressRequestWithUser extends Request {
  user: AuthenticatedUser;
}
