import { SafeUser } from '../../features/auth/auth.model';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}