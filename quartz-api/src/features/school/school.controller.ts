import { Request, Response } from "express";
import { getSchoolsByInstitution } from "./school.service";

export const getSchoolsByInstitutionController = async (req: Request, res: Response) => {
    const institutionId = req.user!.institutionId.toString();
    const schools = await getSchoolsByInstitution(institutionId);
    res.status(200).json(schools);
};
