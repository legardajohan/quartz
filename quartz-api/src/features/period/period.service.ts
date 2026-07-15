import { Period, PlainPeriodObject } from './period.model';
import { Institution } from '../institution/institution.model';
import {
    findScoped,
    findOneScoped,
    createScoped,
    findOneAndUpdateScoped,
    deleteOneScoped,
} from '../../repositories/base.repository';
import { CreatePeriodData, UpdatePeriodData } from './period.types';
import AppError from '../../utils/AppError';

const DEFAULT_PERIODS_PER_YEAR = 4;

export const getPeriodsByInstitution = async (institutionId: string): Promise<PlainPeriodObject[]> => {
    return findScoped(Period, institutionId).sort({ name: 1 }).lean<PlainPeriodObject[]>();
};

export const createPeriod = async (
    institutionId: string,
    data: CreatePeriodData
): Promise<PlainPeriodObject> => {
    const institution = await Institution.findById(institutionId).lean();
    const periodsPerYear = institution?.settings?.periodsPerYear ?? DEFAULT_PERIODS_PER_YEAR;

    const existingCount = await Period.countDocuments({ institutionId, year: data.year });
    if (existingCount >= periodsPerYear) {
        throw new AppError('Se alcanzó el máximo de periodos configurado para el año.', 409);
    }

    if (data.isActive) {
        await Period.updateMany({ institutionId, isActive: true }, { isActive: false });
    }

    try {
        const period = await createScoped(Period, institutionId, data);
        return period.toObject() as PlainPeriodObject;
    } catch (error: unknown) {
        const mongoError = error as { code?: number };
        if (mongoError.code === 11000) {
            throw new AppError('Ya existe un periodo activo para esta institución.', 409);
        }
        throw error;
    }
};

export const updatePeriod = async (
    periodId: string,
    institutionId: string,
    data: UpdatePeriodData
): Promise<PlainPeriodObject> => {
    const existing = await findOneScoped(Period, institutionId, { _id: periodId }).lean<PlainPeriodObject>();

    if (!existing) {
        throw new AppError('Periodo no encontrado o no pertenece a la institución.', 404);
    }

    const mergedStartDate = data.startDate ?? existing.startDate;
    const mergedEndDate = data.endDate ?? existing.endDate;
    const mergedClosingAlertDate = data.closingAlertDate !== undefined ? data.closingAlertDate : existing.closingAlertDate;

    if (mergedEndDate <= mergedStartDate) {
        throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio.', 400);
    }
    if (mergedClosingAlertDate && mergedClosingAlertDate < mergedEndDate) {
        throw new AppError('La alerta de cierre no puede ser anterior a la fecha de fin.', 400);
    }

    if (data.isActive === true) {
        await Period.updateMany(
            { institutionId, isActive: true, _id: { $ne: periodId } },
            { isActive: false }
        );
    }

    try {
        const updated = await findOneAndUpdateScoped(
            Period,
            institutionId,
            { _id: periodId },
            data,
            { new: true, runValidators: true }
        ).lean<PlainPeriodObject>();

        if (!updated) {
            throw new AppError('Periodo no encontrado o no pertenece a la institución.', 404);
        }

        return updated;
    } catch (error: unknown) {
        const mongoError = error as { code?: number };
        if (mongoError.code === 11000) {
            throw new AppError('Ya existe un periodo activo para esta institución.', 409);
        }
        throw error;
    }
};

export const deletePeriod = async (periodId: string, institutionId: string): Promise<void> => {
    const { deletedCount } = await deleteOneScoped(Period, institutionId, { _id: periodId });

    if (deletedCount === 0) {
        throw new AppError('Periodo no encontrado o no pertenece a la institución.', 404);
    }
};
