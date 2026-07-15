import { Request, Response } from 'express';
import { getInstitutionById, updateInstitutionSettings } from './institution.service';

export const getMyInstitutionController = async (req: Request, res: Response) => {
  const institutionId = req.user!.institutionId.toString();
  const institution = await getInstitutionById(institutionId);
  res.status(200).json(institution);
};

export const updateMyInstitutionController = async (req: Request, res: Response) => {
  const institutionId = req.user!.institutionId.toString();
  const institution = await updateInstitutionSettings(institutionId, req.body.settings);
  res.status(200).json(institution);
};
