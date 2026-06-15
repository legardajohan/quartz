import { Router } from 'express';
import { getPeriods } from './period.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/require-tenant.middleware';
import { asyncHandler } from '../../middlewares/async-handler.middleware';

const router = Router();

router.get('/', authenticateJWT, requireTenant, asyncHandler(getPeriods));

export default router;
