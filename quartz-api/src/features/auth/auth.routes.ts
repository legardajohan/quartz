import { Router } from 'express';
import {
  loginController,
  getProfileController,
  getSessionController,
  verifyActivationController,
  activateAccountController,
  requestPasswordResetController,
  verifyPasswordResetController,
  resetPasswordController,
} from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import {
  loginSchema,
  verifyActivationSchema,
  activateAccountSchema,
  requestPasswordResetSchema,
  verifyPasswordResetSchema,
  resetPasswordSchema,
} from './auth.validation';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';

const router = Router();

router.post('/login', validate(loginSchema), asyncHandler(loginController));
// Activación por invitación (USR-04): públicas, pre-tenant. POST para que el token no
// quede en logs de acceso ni en caché de la URL.
router.post('/activation/verify', validate(verifyActivationSchema), asyncHandler(verifyActivationController));
router.post('/activation', validate(activateAccountSchema), asyncHandler(activateAccountController));
// Recuperación de contraseña (AUTH-04): públicas, pre-tenant, mismo criterio que la activación.
router.post('/password-reset/request', validate(requestPasswordResetSchema), asyncHandler(requestPasswordResetController));
router.post('/password-reset/verify', validate(verifyPasswordResetSchema), asyncHandler(verifyPasswordResetController));
router.post('/password-reset', validate(resetPasswordSchema), asyncHandler(resetPasswordController));
router.get('/profile', authenticateJWT, requireTenant, asyncHandler(getProfileController));
router.get('/session', authenticateJWT, requireTenant, asyncHandler(getSessionController));

export default router;
