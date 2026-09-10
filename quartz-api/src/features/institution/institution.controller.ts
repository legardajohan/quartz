import { Request, Response } from 'express';
import {
  getInstitutionById,
  getInstitutionBranding,
  getInstitutionShieldJpg,
  updateInstitutionSettings,
  uploadInstitutionShield,
} from './institution.service';
import AppError from '../../utils/AppError';

export const getMyInstitutionController = async (req: Request, res: Response) => {
  const institutionId = req.user!.institutionId.toString();
  const institution = await getInstitutionById(institutionId);
  res.status(200).json(institution);
};

export const getMyInstitutionBrandingController = async (req: Request, res: Response) => {
  const institutionId = req.user!.institutionId.toString();
  const branding = await getInstitutionBranding(institutionId);
  res.status(200).json(branding);
};

export const updateMyInstitutionController = async (req: Request, res: Response) => {
  const institutionId = req.user!.institutionId.toString();
  const institution = await updateInstitutionSettings(institutionId, req.body.settings);
  res.status(200).json(institution);
};

export const getMyInstitutionShieldController = async (req: Request, res: Response) => {
  const institutionId = req.user!.institutionId.toString();
  const { buffer, contentType, version } = await getInstitutionShieldJpg(institutionId);
  const etag = `W/"${version}"`;

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'private, max-age=86400, must-revalidate');

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.type(contentType).send(buffer);
};

export const uploadShieldController = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Debe adjuntar una imagen.', 422);
  }

  const institutionId = req.user!.institutionId.toString();
  const institution = await uploadInstitutionShield(institutionId, req.file);
  res.status(200).json(institution);
};
