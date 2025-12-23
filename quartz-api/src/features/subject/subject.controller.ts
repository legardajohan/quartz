import { Request, Response } from 'express';
import { getSubjectsByInstitution } from './subject.service';

export const getSubjects = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user || !user.institutionId) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const institutionId = user.institutionId.toString();
        const subjects = await getSubjectsByInstitution(institutionId);

        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subjects', error: error instanceof Error ? error.message : String(error) });
    }
};
