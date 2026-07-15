import { Router } from 'express';
import {
  initializeValuationController,
  updateValuationController,
  deleteValuationController,
  getValuationByIdController,
  getValuationsByStudentController,
} from './student-valuation.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { studentValuationValidation } from './student-valuation.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.post(
  '/student/:studentId/period/:periodId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(studentValuationValidation.initializeValuation),
  asyncHandler(initializeValuationController)
);

router.get(
  '/student/:studentId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(studentValuationValidation.getValuationsByStudent),
  asyncHandler(getValuationsByStudentController)
);

router.get(
  '/:valuationId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(studentValuationValidation.getValuationById),
  asyncHandler(getValuationByIdController)
);

router.patch(
  '/:valuationId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(studentValuationValidation.updateValuation),
  asyncHandler(updateValuationController)
);

router.delete(
  '/:valuationId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA]),
  validate(studentValuationValidation.deleteValuation),
  asyncHandler(deleteValuationController)
);

export default router;
