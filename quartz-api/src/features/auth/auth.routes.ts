import { Router } from 'express';
import {
  loginController,
  getProfileController,
  getSessionController,
  verifyActivationController,
  activateAccountController,
} from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { loginSchema, verifyActivationSchema, activateAccountSchema } from './auth.validation';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';

const router = Router();

router.post('/login', validate(loginSchema), asyncHandler(loginController));
// Activación por invitación (USR-04): públicas, pre-tenant. POST para que el token no
// quede en logs de acceso ni en caché de la URL.
router.post('/activation/verify', validate(verifyActivationSchema), asyncHandler(verifyActivationController));
router.post('/activation', validate(activateAccountSchema), asyncHandler(activateAccountController));
router.get('/profile', authenticateJWT, requireTenant, asyncHandler(getProfileController));
router.get('/session', authenticateJWT, requireTenant, asyncHandler(getSessionController));

export default router;
