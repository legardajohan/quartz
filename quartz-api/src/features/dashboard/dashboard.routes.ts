import { Router } from 'express';
import { getDashboardController } from './dashboard.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { getDashboardSchema } from './dashboard.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.get(
  '/',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getDashboardSchema),
  asyncHandler(getDashboardController)
);

export default router;
