import { Router } from 'express';
import { learningController } from './learning.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createLearningSchema } from './learning.validation';

const router = Router();

// Protected route to create Learning
router.post(
  '/',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(createLearningSchema),
  learningController
);

export default router;