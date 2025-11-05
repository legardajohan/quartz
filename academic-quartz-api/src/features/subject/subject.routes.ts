import { Router } from 'express';
import { getSubjects } from './subject.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getSubjects);

export default router;