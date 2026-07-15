import { Router } from 'express';
import { getAllLearningsController, createLearningController, updateLearningController, deleteLearningController } from './learning.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { getAllLearningsSchema, createLearningSchema, updateLearningSchema, deleteLearningSchema } from './learning.validation';

const router = Router();

router.get(
  '/',
  authenticateJWT,
  requireTenant,
  authorize(['Jefe de Área', 'Docente']),
  validate(getAllLearningsSchema),
  asyncHandler(getAllLearningsController)
);

router.post(
  '/',
  authenticateJWT,
  requireTenant,
  authorize(['Jefe de Área']),
  validate(createLearningSchema),
  asyncHandler(createLearningController)
);

router.patch(
  '/:learningId',
  authenticateJWT,
  requireTenant,
  authorize(['Jefe de Área']),
  validate(updateLearningSchema),
  asyncHandler(updateLearningController)
);

router.delete(
  '/:learningId',
  authenticateJWT,
  requireTenant,
  authorize(['Jefe de Área']),
  validate(deleteLearningSchema),
  asyncHandler(deleteLearningController)
);

export default router;
