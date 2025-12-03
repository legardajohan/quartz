import { Router } from 'express';
import { createTemplateController, getTemplateByIdController } from './checklist-template.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createTemplateSchema, getTemplateByIdSchema } from './checklist-template.validation';

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
  '/:id',
  authenticateJWT,
  authorize(allowedRoles),
  validate(getTemplateByIdSchema),
  getTemplateByIdController
);

export default router;
