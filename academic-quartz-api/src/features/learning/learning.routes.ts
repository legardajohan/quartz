import { Router } from 'express';
import { getAllLearningsController, createLearningController, updateLearningController, deleteLearningController } from './learning.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { getAllLearningsSchema, createLearningSchema, updateLearningSchema, deleteLearningSchema } from './learning.validation';

const router = Router();

// Protected route to get all Learnings
router.get(
  '/',
  authenticateJWT,
  authorize(['Jefe de Área', 'Docente']),
  validate(getAllLearningsSchema),
  getAllLearningsController
);

// Protected route to create Learning
router.post(
  '/',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(createLearningSchema),
  createLearningController
);

// Protected route to update Learning
router.patch(
  '/:learningId',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(updateLearningSchema),
  updateLearningController
);

// Protected route to delete Learning
router.delete(
  '/:learningId',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(deleteLearningSchema),
  deleteLearningController
);

export default router;