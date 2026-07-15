import { Request, Response } from 'express';
import {
    getPeriodsByInstitution,
    createPeriod,
    updatePeriod,
    deletePeriod,
} from './period.service';
import { PlainPeriodObject } from './period.model';
import { IPeriodDTO } from './period.types';

function mapPeriodToDTO(period: PlainPeriodObject): IPeriodDTO {
    return {
        _id: period._id.toString(),
        name: period.name,
        year: period.year,
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        closingAlertDate: period.closingAlertDate ? period.closingAlertDate.toISOString() : null,
        isActive: period.isActive,
    };
}

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
