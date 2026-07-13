import { Router } from 'express';
import {
  getConceptsController,
  createConceptController,
  updateConceptController,
  deleteConceptController,
} from './concept.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import {
  getConceptsSchema,
  createConceptSchema,
  updateConceptSchema,
  deleteConceptSchema,
} from './concept.validation';

const router = Router();
const allowedRoles = ['Jefe de Área', 'Docente'];

router.get(
  '/',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(getConceptsSchema),
  asyncHandler(getConceptsController)
);

router.post(
  '/',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(createConceptSchema),
  asyncHandler(createConceptController)
);

router.patch(
  '/:id',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(updateConceptSchema),
  asyncHandler(updateConceptController)
);

router.delete(
  '/:id',
  authenticateJWT,
  requireTenant,
  authorize(allowedRoles),
  validate(deleteConceptSchema),
  asyncHandler(deleteConceptController)
);

export default router;
