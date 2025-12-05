import { Router } from 'express';
import { createTemplateController, getTemplatesByTeacherController } from './checklist-template.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createTemplateSchema, getTemplatesByTeacherSchema } from './checklist-template.validation';

const router = Router();
const allowedRoles = ['Jefe de Área', 'Docente'];

router.post(
  '/',
  authenticateJWT,
  authorize(allowedRoles),
  validate(createTemplateSchema),
  createTemplateController
);

router.get(
  '/',
  authenticateJWT,
  authorize(allowedRoles),
  validate(getTemplatesByTeacherSchema),
  getTemplatesByTeacherController
);

export default router;
