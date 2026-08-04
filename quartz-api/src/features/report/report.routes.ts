import { Router } from 'express';
import { getChecklistReportController, getChecklistReportShieldController } from './report.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { getChecklistReportSchema, getChecklistReportShieldSchema } from './report.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.get(
  '/checklist/:valuationId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getChecklistReportSchema),
  asyncHandler(getChecklistReportController)
);

router.get(
  '/checklist/:valuationId/shield',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getChecklistReportShieldSchema),
  asyncHandler(getChecklistReportShieldController)
);

export default router;
