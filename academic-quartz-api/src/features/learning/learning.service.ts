import { FilterQuery, Types } from 'mongoose';
import { create, updateById, deleteById, getById, getAll } from '../../services/crud.service';
import { LearningModel, ILearning, ILearningDocument } from "./learning.model";
import { Institution } from '../institution/institution.model';
import { Subject } from '../subject/subject.model';
import { Period } from '../period/period.model';

export async function createLearning(
    institutionId: string,
    subjectId: string,
    periodId: string,
    description: string,
    grade: string
): Promise<ILearningDocument> {

    // 1. Validate existence of related documents (business logic)
    // Posiblemente refactorizarlo a futuro para validar desde otras entidades
    const institutionExists = await Institution.exists({ _id: institutionId });
    if (!institutionExists) {
        throw new Error('El institutionId proporcionado no existe.');
    }

    const subjectExists = await Subject.exists({ _id: subjectId });
    if (!subjectExists) {
        throw new Error('El subjectId proporcionado no existe.');
    }

    const periodExists = await Period.exists({ _id: periodId });
    if (!periodExists) {
        throw new Error('El periodId proporcionado no existe.');
    }

    // 2. Use the generic service to create the document
    const payload = {
        institutionId: new Types.ObjectId(institutionId),
        subjectId: new Types.ObjectId(subjectId),
        periodId: new Types.ObjectId(periodId),
        description,
        grade
    };

    return create(
        LearningModel, 
        payload
    );
}

export async function updateLearning(
    learningId: string,
    updateData: Partial<ILearning> // <Ilearning> revisar si revienta
): Promise<ILearningDocument | null> {

    // 1. Validate existence of related documents if they are being updated (business logic)
    if (updateData.subjectId) {
        const subjectExists = await Subject.exists({ _id: updateData.subjectId });
        if (!subjectExists) {
            throw new Error('El subjectId proporcionado no existe.');
        }
    }

    if (updateData.periodId) {
        const periodExists = await Period.exists({ _id: updateData.periodId });
        if (!periodExists) {
            throw new Error('El periodId proporcionado no existe.');
        }
    }

    // 2. Use the generic service to update the document
    return updateById(
        LearningModel, 
        learningId, 
        updateData
    );
}

export async function deleteLearning(
    learningId: string
): Promise<ILearningDocument | null> {
    return deleteById(LearningModel, learningId);
}

// export async function getLearningById(learningId: string): Promise<ILearningDocument | null> {
//     return getById(LearningModel, learningId);
// }

// export async function getAllLearnings(filter: FilterQuery<ILearningDocument>): Promise<ILearningDocument[]> {
//     return getAll(LearningModel, filter);
// }
