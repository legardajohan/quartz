import { Request, Response } from 'express';
import {
    getPeriodsByInstitution,
    createPeriod,
    updatePeriod,
    deletePeriod,
    mapPeriodToDTO,
} from './period.service';

export const getPeriods = async (req: Request, res: Response) => {
    const institutionId = req.user!.institutionId.toString();
    const periods = await getPeriodsByInstitution(institutionId);
    res.status(200).json(periods.map(mapPeriodToDTO));
};

export const createPeriodController = async (req: Request, res: Response) => {
    const institutionId = req.user!.institutionId.toString();
    const period = await createPeriod(institutionId, req.body);
    res.status(201).json(mapPeriodToDTO(period));
};

export const updatePeriodController = async (req: Request, res: Response) => {
    const { periodId } = req.params;
    const institutionId = req.user!.institutionId.toString();
    const period = await updatePeriod(periodId, institutionId, req.body);
    res.status(200).json(mapPeriodToDTO(period));
};

export const deletePeriodController = async (req: Request, res: Response) => {
    const { periodId } = req.params;
    const institutionId = req.user!.institutionId.toString();
    await deletePeriod(periodId, institutionId);
    res.status(204).send();
};
