import { Request, Response } from 'express';
import { getPeriodsByInstitution } from './period.service';

export const getPeriods = async (req: Request, res: Response) => {
    const institutionId = req.user!.institutionId.toString();
    const periods = await getPeriodsByInstitution(institutionId);
    res.status(200).json(periods);
};
