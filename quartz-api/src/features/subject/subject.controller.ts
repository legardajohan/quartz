import { Request, Response } from 'express';
import { getSubjectsByInstitution } from './subject.service';

export const getSubjects = async (req: Request, res: Response) => {
    const institutionId = req.user!.institutionId.toString();
    const subjects = await getSubjectsByInstitution(institutionId);
    res.status(200).json(subjects);
};
