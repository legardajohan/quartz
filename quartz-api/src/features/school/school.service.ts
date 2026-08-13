import { SchoolModel } from './school.model';
import { LeanDocument } from '../../types/mongoose';
import { User } from '../auth/auth.model';
import {
    findScoped,
    findOneScoped,
    createScoped,
    findOneAndUpdateScoped,
    findOneAndDeleteScoped,
} from '../../repositories/base.repository';
import { CreateSchoolData, UpdateSchoolData } from './school.types';
import AppError from '../../utils/AppError';

export type PlainSchoolObject = LeanDocument<{ institutionId: unknown; schoolNumber: number; name: string }>;

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactNameFilter(name: string) {
    return { name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' } };
}

export const getSchoolsByInstitution = async (institutionId: string): Promise<PlainSchoolObject[]> => {
    return findScoped(SchoolModel, institutionId).sort({ schoolNumber: 1 }).lean<PlainSchoolObject[]>();
};

export const createSchool = async (
    institutionId: string,
    data: CreateSchoolData
): Promise<PlainSchoolObject> => {
    const duplicate = await findOneScoped(SchoolModel, institutionId, exactNameFilter(data.name)).lean();
    if (duplicate) {
        throw new AppError('Ya existe una sede con ese nombre en la institución.', 409);
    }

    const lastSchool = await findScoped(SchoolModel, institutionId)
        .sort({ schoolNumber: -1 })
        .limit(1)
        .lean<PlainSchoolObject[]>();
    const schoolNumber = (lastSchool[0]?.schoolNumber ?? 0) + 1;

    try {
        const school = await createScoped(SchoolModel, institutionId, { name: data.name.trim(), schoolNumber });
        return school.toObject() as PlainSchoolObject;
    } catch (error: unknown) {
        const mongoError = error as { code?: number };
        if (mongoError.code === 11000) {
            throw new AppError('No se pudo crear la sede, intenta nuevamente.', 409);
        }
        throw error;
    }
};

export const updateSchool = async (
    schoolId: string,
    institutionId: string,
    data: UpdateSchoolData
): Promise<PlainSchoolObject> => {
    if (data.name !== undefined) {
        const duplicate = await findOneScoped(SchoolModel, institutionId, {
            ...exactNameFilter(data.name),
            _id: { $ne: schoolId },
        }).lean();
        if (duplicate) {
            throw new AppError('Ya existe una sede con ese nombre en la institución.', 409);
        }
    }

    const school = await findOneAndUpdateScoped(
        SchoolModel,
        institutionId,
        { _id: schoolId },
        data.name !== undefined ? { name: data.name.trim() } : {},
        { new: true, runValidators: true }
    ).lean<PlainSchoolObject>();

    if (!school) {
        throw new AppError('Sede no encontrada o no pertenece a la institución.', 404);
    }

    return school;
};

export const deleteSchool = async (schoolId: string, institutionId: string): Promise<void> => {
    const associatedUsers = await User.countDocuments({ institutionId, schoolId });
    if (associatedUsers > 0) {
        throw new AppError(
            `La sede tiene ${associatedUsers} usuario(s) asociado(s). Reasígnalos antes de eliminarla.`,
            409
        );
    }

    const totalSchools = await SchoolModel.countDocuments({ institutionId });
    if (totalSchools <= 1) {
        throw new AppError('La institución debe tener al menos una sede.', 409);
    }

    const deleted = await findOneAndDeleteScoped(SchoolModel, institutionId, { _id: schoolId }).lean<PlainSchoolObject>();

    if (!deleted) {
        throw new AppError('Sede no encontrada o no pertenece a la institución.', 404);
    }
};
