import { Subject, PlainSubjectObject } from './subject.model';
import {
    findScoped,
    createScoped,
    findOneAndUpdateScoped,
    deleteOneScoped,
} from '../../repositories/base.repository';
import { CreateSubjectData, UpdateSubjectData, ISubjectDTO } from './subject.types';
import AppError from '../../utils/AppError';

// Mismo DTO para `GET /subjects` y para el payload de sesión.
export function mapSubjectToDTO(subject: PlainSubjectObject): ISubjectDTO {
    return {
        _id: subject._id.toString(),
        name: subject.name,
        type: subject.type,
        evaluationMode: subject.evaluationMode,
    };
}

export const getSubjectsByInstitution = async (institutionId: string): Promise<PlainSubjectObject[]> => {
    return findScoped(Subject, institutionId).sort({ name: 1 }).lean<PlainSubjectObject[]>();
};

export const createSubject = async (
    institutionId: string,
    data: CreateSubjectData
): Promise<PlainSubjectObject> => {
    try {
        const subject = await createScoped(Subject, institutionId, data);
        return subject.toObject() as PlainSubjectObject;
    } catch (error: unknown) {
        const mongoError = error as { code?: number };
        if (mongoError.code === 11000) {
            throw new AppError('Ya existe una dimensión con ese nombre en la institución.', 409);
        }
        throw error;
    }
};

export const updateSubject = async (
    subjectId: string,
    institutionId: string,
    data: UpdateSubjectData
): Promise<PlainSubjectObject> => {
    try {
        const subject = await findOneAndUpdateScoped(
            Subject,
            institutionId,
            { _id: subjectId },
            data,
            { new: true, runValidators: true }
        ).lean<PlainSubjectObject>();

        if (!subject) {
            throw new AppError('Dimensión no encontrada o no pertenece a la institución.', 404);
        }

        return subject;
    } catch (error: unknown) {
        const mongoError = error as { code?: number };
        if (mongoError.code === 11000) {
            throw new AppError('Ya existe una dimensión con ese nombre en la institución.', 409);
        }
        throw error;
    }
};

export const deleteSubject = async (subjectId: string, institutionId: string): Promise<void> => {
    const { deletedCount } = await deleteOneScoped(Subject, institutionId, { _id: subjectId });

    if (deletedCount === 0) {
        throw new AppError('Dimensión no encontrada o no pertenece a la institución.', 404);
    }
};
