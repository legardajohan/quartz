import { Router } from 'express';
import { loginController, getProfileController, getSessionController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { loginSchema } from './auth.validation';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';

const router = Router();

router.post('/login', validate(loginSchema), asyncHandler(loginController));
router.get('/profile', authenticateJWT, requireTenant, asyncHandler(getProfileController));
router.get('/session', authenticateJWT, requireTenant, asyncHandler(getSessionController));

export default router;
