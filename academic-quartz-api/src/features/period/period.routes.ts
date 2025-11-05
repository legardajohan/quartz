import { Router } from 'express';
import { getPeriods } from './period.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getPeriods);

export default router;
