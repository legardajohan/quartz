import { Router } from 'express';
import {
  getTemplatesController,
  createTemplateController,
  updateTemplateController,
  deleteTemplateController,
} from './checklist-template.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import {
  getTemplatesByTeacherSchema,
  createTemplateSchema,
  updateTemplateSchema,
  deleteTemplateSchema,
} from './checklist-template.validation';

const router = Router();
const allowedRoles = ['Jefe de Área', 'Docente'];

router.get(
  '/',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(getTemplatesByTeacherSchema),
  asyncHandler(getTemplatesController)
);

router.post(
  '/',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(createTemplateSchema),
  asyncHandler(createTemplateController)
);

router.patch(
  '/:id',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(updateTemplateSchema),
  asyncHandler(updateTemplateController)
);

router.delete(
  '/:id',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(deleteTemplateSchema),
  asyncHandler(deleteTemplateController)
);

export default router;
