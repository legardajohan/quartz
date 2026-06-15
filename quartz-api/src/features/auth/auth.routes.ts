import { Router } from 'express';
import { loginController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { loginSchema } from './auth.validation';

const router = Router();

router.post('/login', validate(loginSchema), asyncHandler(loginController));

export default router;
