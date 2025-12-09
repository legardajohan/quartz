import { Router } from 'express';
import { initializeValuationController, updateValuationController } from './student-valuation.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { studentValuationValidation } from './student-valuation.validation';

const router = Router();

router.get(
  '/by-student/:studentId/period/:periodId',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(studentValuationValidation.getValuationParams),
  initializeValuationController
);

router.put(
  '/:id',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(studentValuationValidation.updateValuation),
  updateValuationController
);

export default router;
