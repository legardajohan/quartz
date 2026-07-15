import { Router } from 'express';
import {
    getPeriods,
    createPeriodController,
    updatePeriodController,
    deletePeriodController,
} from './period.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { createPeriodSchema, updatePeriodSchema, deletePeriodSchema } from './period.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.get('/', authenticateJWT, requireTenant, asyncHandler(getPeriods));

router.post(
    '/',
    authenticateJWT,
    requireTenant,
    authorize([UserRole.JEFE_DE_AREA]),
    validate(createPeriodSchema),
    asyncHandler(createPeriodController)
);

router.patch(
    '/:periodId',
    authenticateJWT,
    requireTenant,
    authorize([UserRole.JEFE_DE_AREA]),
    validate(updatePeriodSchema),
    asyncHandler(updatePeriodController)
);

router.delete(
    '/:periodId',
    authenticateJWT,
    requireTenant,
    authorize([UserRole.JEFE_DE_AREA]),
    validate(deletePeriodSchema),
    asyncHandler(deletePeriodController)
);

export default router;
