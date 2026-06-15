import { FilterQuery, Types, Query } from 'mongoose';
import {
    findScoped,
    findByIdScoped,
    createScoped,
    findOneAndUpdateScoped,
    findOneAndDeleteScoped,
} from '../../repositories/base.repository';
import { LearningModel, ILearningDocument } from "./learning.model";
import { Subject } from '../subject/subject.model';
import { Period } from '../period/period.model';
import { User } from '../auth/auth.model';
import type { LearningData, UpdateLearningData } from './learning.types';
import { validateAllExist } from '../../services/document-validator.service';
import AppError from '../../utils/AppError';

// --- Helper Function ---
function populateLearningDetails<T>(query: Query<T, ILearningDocument>) {
    return query
        .populate({
            path: 'subjectId',
            model: Subject,
            select: 'name'
        })
        .populate({
            path: 'periodId',
            model: Period,
            select: 'name'
        })
        .populate({
            path: 'userId',
            model: User,
            select: 'firstName lastName role'
        });
}

export async function getAllLearnings(
    institutionId: string,
    filter: FilterQuery<ILearningDocument>
): Promise<ILearningDocument[]> {
    const query = findScoped(LearningModel, institutionId, filter);
    const learnings = await populateLearningDetails(query).exec();
    return learnings;
}

export async function createLearning(
    institutionId: string,
    userId: string,
    learningData: LearningData
): Promise<ILearningDocument> {

    const { subjectId, periodId, description, grade } = learningData;

    try {
        await validateAllExist([
            [Subject, subjectId, 'Subject'],
            [Period, periodId, 'Period'],
        ]);
    } catch (error: unknown) {
        throw new AppError(error instanceof Error ? error.message : 'Referencia inválida', 400);
    }

    const payload = {
        userId: new Types.ObjectId(userId),
        subjectId: new Types.ObjectId(subjectId),
        periodId: new Types.ObjectId(periodId),
        description,
        grade
    };

    const newLearning = await createScoped(LearningModel, institutionId, payload);

    const populatedLearning = await populateLearningDetails(
        findByIdScoped(LearningModel, institutionId, newLearning._id as Types.ObjectId)
    ).exec();

    if (!populatedLearning) {
        throw new Error('Failed to populate the newly created learning.');
    }

    return populatedLearning;
}

export async function updateLearning(
    learningId: string,
    institutionId: string,
    updateData: UpdateLearningData
): Promise<ILearningDocument | null> {

    const validations: Parameters<typeof validateAllExist>[0] = [];
    if (updateData.subjectId) {
        validations.push([Subject, updateData.subjectId, 'Subject']);
    }
    if (updateData.periodId) {
        validations.push([Period, updateData.periodId, 'Period']);
    }
    if (validations.length > 0) {
        try {
            await validateAllExist(validations);
        } catch (error: unknown) {
            throw new AppError(error instanceof Error ? error.message : 'Referencia inválida', 400);
        }
    }

    const updatedLearning = await findOneAndUpdateScoped(
        LearningModel,
        institutionId,
        { _id: new Types.ObjectId(learningId) },
        updateData,
        { new: true }
    );

    if (!updatedLearning) {
        return null;
    }

    const populatedLearning = await populateLearningDetails(
        findByIdScoped(LearningModel, institutionId, updatedLearning._id as Types.ObjectId)
    ).exec();

    return populatedLearning;
}

export async function deleteLearning(
    learningId: string,
    institutionId: string
): Promise<ILearningDocument | null> {
    return findOneAndDeleteScoped(LearningModel, institutionId, {
        _id: new Types.ObjectId(learningId)
    });
}
