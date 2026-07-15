import { Router } from 'express';
import {
    getSubjects,
    createSubjectController,
    updateSubjectController,
    deleteSubjectController,
} from './subject.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { createSubjectSchema, updateSubjectSchema, deleteSubjectSchema } from './subject.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.get('/', authenticateJWT, requireTenant, asyncHandler(getSubjects));

router.post(
    '/',
    authenticateJWT,
    requireTenant,
    authorize([UserRole.JEFE_DE_AREA]),
    validate(createSubjectSchema),
    asyncHandler(createSubjectController)
);

router.patch(
    '/:subjectId',
    authenticateJWT,
    requireTenant,
    authorize([UserRole.JEFE_DE_AREA]),
    validate(updateSubjectSchema),
    asyncHandler(updateSubjectController)
);

router.delete(
    '/:subjectId',
    authenticateJWT,
    requireTenant,
    authorize([UserRole.JEFE_DE_AREA]),
    validate(deleteSubjectSchema),
    asyncHandler(deleteSubjectController)
);

export default router;
