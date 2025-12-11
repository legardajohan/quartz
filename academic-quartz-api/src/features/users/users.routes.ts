import { Router } from 'express';
import { getUsers } from './users.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { getUsersSchema } from './users.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

/**
 * GET /api/users
 * Query params: id, role, schoolId
 * Only accessible by Jefe de Área. Returns students belonging to the same institution as req.user.
 */
router.get(
  '/',
  authenticateJWT,
  authorize([UserRole.JEFE_DE_AREA]),
  validate(getUsersSchema),
  getUsers
);

export default router;
