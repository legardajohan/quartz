import { Router } from "express";
import { getSchoolsByInstitutionController } from "./school.controller";
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

router.get("/", authenticateJWT, getSchoolsByInstitutionController);

export default router;
