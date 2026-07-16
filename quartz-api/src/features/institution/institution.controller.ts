import { Request, Response } from 'express';
import { getInstitutionById, updateInstitutionSettings, uploadInstitutionShield } from './institution.service';
import AppError from '../../utils/AppError';

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

export const uploadShieldController = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Debe adjuntar una imagen.', 422);
  }

  const institutionId = req.user!.institutionId.toString();
  const institution = await uploadInstitutionShield(institutionId, req.file);
  res.status(200).json(institution);
};
