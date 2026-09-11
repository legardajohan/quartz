import { Router } from 'express';
import {
  getChecklistReportController,
  getCommunicativeLetterReportController,
  getLetterAvailabilityController,
  getBulkChecklistReportController,
  getBulkCommunicativeLetterReportController,
  getConsolidatedChecklistReportController,
  getConsolidatedCommunicativeLetterReportController,
} from './report.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import {
  getChecklistReportSchema,
  getCommunicativeLetterSchema,
  getLetterAvailabilitySchema,
  getBulkChecklistReportSchema,
  getBulkCommunicativeLetterSchema,
  getConsolidatedChecklistReportSchema,
  getConsolidatedCommunicativeLetterSchema,
} from './report.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

// Registradas antes de "/checklist/:valuationId": aunque el método (POST) ya evita el choque con
// las rutas GET individuales, se mantiene el mismo orden que "availability" por consistencia.
router.post(
  '/checklist/bulk',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getBulkChecklistReportSchema),
  asyncHandler(getBulkChecklistReportController)
);

router.post(
  '/communicative-letter/bulk',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getBulkCommunicativeLetterSchema),
  asyncHandler(getBulkCommunicativeLetterReportController)
);

router.post(
  '/checklist/consolidated',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getConsolidatedChecklistReportSchema),
  asyncHandler(getConsolidatedChecklistReportController)
);

router.post(
  '/communicative-letter/consolidated',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getConsolidatedCommunicativeLetterSchema),
  asyncHandler(getConsolidatedCommunicativeLetterReportController)
);

router.get(
  '/checklist/:valuationId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getChecklistReportSchema),
  asyncHandler(getChecklistReportController)
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
