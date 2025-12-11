import { Router } from 'express';
import { 
  initializeValuationController, 
  updateValuationController,
  deleteValuationController,
  getValuationByIdController,
  getValuationsByStudentController,
} from './student-valuation.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { studentValuationValidation } from './student-valuation.validation';

const router = Router();

// Initialize a student valuation for a period
router.post(
  '/student/:studentId/period/:periodId',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(studentValuationValidation.initializeValuation),
  initializeValuationController
);

// Get all valuations for a specific student
router.get(
  '/student/:studentId',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(studentValuationValidation.getValuationsByStudent),
  getValuationsByStudentController
);

// Get a single valuation by its ID
router.get(
  '/:valuationId',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(studentValuationValidation.getValuationById),
  getValuationByIdController
);

// Update a valuation
router.patch(
  '/:valuationId',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(studentValuationValidation.updateValuation),
  updateValuationController
);

// Delete a valuation
router.delete(
  '/:valuationId',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(studentValuationValidation.deleteValuation),
  deleteValuationController
);

export default router;
