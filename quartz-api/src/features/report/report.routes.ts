import { Router } from 'express';
import {
  getChecklistReportController,
  getChecklistReportShieldController,
  getCommunicativeLetterReportController,
  getLetterAvailabilityController,
} from './report.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import {
  getChecklistReportSchema,
  getChecklistReportShieldSchema,
  getCommunicativeLetterSchema,
  getLetterAvailabilitySchema,
} from './report.validation';
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

// Registrada antes de "/communicative-letter/:valuationId": de lo contrario Express
// captura "availability" como valuationId y validate() la rechaza por la regex de ObjectId.
router.get(
  '/communicative-letter/availability',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getLetterAvailabilitySchema),
  asyncHandler(getLetterAvailabilityController)
);

router.get(
  '/communicative-letter/:valuationId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getCommunicativeLetterSchema),
  asyncHandler(getCommunicativeLetterReportController)
);

export default router;
