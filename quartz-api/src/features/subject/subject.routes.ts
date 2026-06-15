import { Router } from 'express';
import { getSubjects } from './subject.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';

const router = Router();

router.get('/', authenticateJWT, requireTenant, asyncHandler(getSubjects));

export default router;
