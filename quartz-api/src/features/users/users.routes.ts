import { Router } from 'express';
import {
  getUsers,
  createUserController,
  updateUserController,
  deleteUserController,
  uploadUserPhotoController,
  getOwnProfileController,
  updateOwnProfileController,
  changeOwnPasswordController,
  uploadOwnPhotoController,
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
  updateOwnProfileSchema,
  changeOwnPasswordSchema,
} from './users.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

/**
 * Mi cuenta (USR-03). Declaradas antes de `/:userId` para que "me" nunca se lea como id.
 * El usuario objetivo es siempre el del token (`req.user._id`).
 * Docente: no puede cambiar su correo ni su sede (403 en el service).
 */
const OWN_ACCOUNT_ROLES = [UserRole.JEFE_DE_AREA, UserRole.DOCENTE];

router.get(
  '/me',
  authenticateJWT,
  requireTenant,
  authorize(OWN_ACCOUNT_ROLES),
  asyncHandler(getOwnProfileController)
);

router.patch(
  '/me',
  authenticateJWT,
  requireTenant,
  authorize(OWN_ACCOUNT_ROLES),
  validate(updateOwnProfileSchema),
  asyncHandler(updateOwnProfileController)
);

router.patch(
  '/me/password',
  authenticateJWT,
  requireTenant,
  authorize(OWN_ACCOUNT_ROLES),
  validate(changeOwnPasswordSchema),
  asyncHandler(changeOwnPasswordController)
);

router.patch(
  '/me/photo',
  authenticateJWT,
  requireTenant,
  authorize(OWN_ACCOUNT_ROLES),
  uploadImageSingle,
  asyncHandler(uploadOwnPhotoController)
);

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
 * Actualiza datos de un usuario (rol inmutable).
 * Jefe de Área: cualquier usuario del tenant.
 * Docente: solo estudiantes de su propia sede; no puede cambiar la sede.
 */
router.patch(
  '/:userId',
  authenticateJWT,
  requireTenant,
  authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]),
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
