import { Request, Response } from 'express';
import { getPeriodsByInstitution } from './period.service';

export const getPeriods = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user || !user.institutionId) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const institutionId = user.institutionId.toString();
        const periods = await getPeriodsByInstitution(institutionId);

        res.status(200).json(periods);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching periods', error: error instanceof Error ? error.message : String(error) });
    }
};
