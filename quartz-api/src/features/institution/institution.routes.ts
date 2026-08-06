import { Router } from 'express';
import { getMyInstitutionController, getMyInstitutionBrandingController, updateMyInstitutionController, uploadShieldController } from './institution.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { uploadImageSingle } from '../../middlewares/upload.middleware';
import { updateInstitutionSettingsSchema } from './institution.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.get(
  '/me',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA]),
  asyncHandler(getMyInstitutionController)
);

router.get(
  '/me/branding',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  asyncHandler(getMyInstitutionBrandingController)
);

router.patch(
  '/me',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA]),
  validate(updateInstitutionSettingsSchema),
  asyncHandler(updateMyInstitutionController)
);

router.patch(
  '/me/shield',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA]),
  uploadImageSingle,
  asyncHandler(uploadShieldController)
);

export default router;
