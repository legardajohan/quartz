import { Router } from "express";
import {
    getSchoolsByInstitutionController,
    createSchoolController,
    updateSchoolController,
    deleteSchoolController,
} from "./school.controller";
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';
import { createSchoolSchema, updateSchoolSchema, deleteSchoolSchema } from './school.validation';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.get("/", authenticateJWT, requireTenant, asyncHandler(getSchoolsByInstitutionController));

router.post(
    "/",
    authenticateJWT,
    requireTenant,
    authorize([UserRole.JEFE_DE_AREA]),
    validate(createSchoolSchema),
    asyncHandler(createSchoolController)
);

router.patch(
    "/:schoolId",
    authenticateJWT,
    requireTenant,
    authorize([UserRole.JEFE_DE_AREA]),
    validate(updateSchoolSchema),
    asyncHandler(updateSchoolController)
);

router.delete(
    "/:schoolId",
    authenticateJWT,
    requireTenant,
    authorize([UserRole.JEFE_DE_AREA]),
    validate(deleteSchoolSchema),
    asyncHandler(deleteSchoolController)
);

export default router;
