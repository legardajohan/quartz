import { Router } from 'express';
import { expectedLearningController } from './expected-learning.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createExpectedLearningSchema } from './expected-learning.validation';

const router = Router();

// Protected route to create Expected Learning
router.post(
  '/',
  authenticateJWT,
  authorize(['Jefe de Área']),
  validate(createExpectedLearningSchema),
  expectedLearningController
);

export default router;