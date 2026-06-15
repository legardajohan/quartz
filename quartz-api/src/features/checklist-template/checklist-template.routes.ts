import { Router } from 'express';
import { createTemplateController, getTemplatesByTeacherController } from './checklist-template.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { createTemplateSchema, getTemplatesByTeacherSchema } from './checklist-template.validation';

const router = Router();
const allowedRoles = ['Jefe de Área', 'Docente'];

router.get(
  '/',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(getTemplatesByTeacherSchema),
  asyncHandler(getTemplatesByTeacherController)
);

router.post(
  '/',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(createTemplateSchema),
  asyncHandler(createTemplateController)
);

export default router;
