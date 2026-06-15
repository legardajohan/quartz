import { Router } from 'express';
import { getUsers } from './users.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { getUsersSchema } from './users.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

/**
 * GET /api/users
 * Query params: id, role, schoolId
 * Only accessible by Jefe de Área and Docente.
 * Jefe de Área: Returns all students in the institution, strictly filtered by schoolId if provided.
 * Docente: Returns students strictly from their assigned school.
 */
router.get(
  '/',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getUsersSchema),
  asyncHandler(getUsers)
);

export default router;
