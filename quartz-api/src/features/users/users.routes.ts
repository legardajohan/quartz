import { Router } from 'express';
import {
  getUsers,
  createUserController,
  updateUserController,
  deleteUserController,
  uploadUserPhotoController,
} from './users.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { uploadImageSingle } from '../../middlewares/upload.middleware';
import {
  getUsersSchema,
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  uploadUserPhotoSchema,
} from './users.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

/**
 * GET /api/users
 * Query params: id, role, schoolId
 * Only accessible by Jefe de Área and Docente.
 * Jefe de Área: Returns all students or teachers in the institution, strictly filtered by schoolId if provided.
 * Docente: Returns students strictly from their assigned school (cannot list teachers).
 */
router.get(
  '/',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(getUsersSchema),
  asyncHandler(getUsers)
);

/**
 * POST /api/users
 * Crea un Estudiante o Docente. Solo Jefe de Área.
 */
router.post(
  '/',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA]),
  validate(createUserSchema),
  asyncHandler(createUserController)
);

/**
 * PATCH /api/users/:userId
 * Actualiza datos de un usuario (rol inmutable). Solo Jefe de Área.
 */
router.patch(
  '/:userId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA]),
  validate(updateUserSchema),
  asyncHandler(updateUserController)
);

/**
 * DELETE /api/users/:userId
 * Elimina un usuario. Solo Jefe de Área.
 */
router.delete(
  '/:userId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA]),
  validate(deleteUserSchema),
  asyncHandler(deleteUserController)
);

/**
 * PATCH /api/users/:userId/photo
 * Sube la foto de un usuario. Jefe de Área: cualquier usuario del tenant.
 * Docente: solo estudiantes de su propia sede.
 */
router.patch(
  '/:userId/photo',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
  validate(uploadUserPhotoSchema),
  uploadImageSingle,
  asyncHandler(uploadUserPhotoController)
);

export default router;
