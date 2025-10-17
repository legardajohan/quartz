import { FilterQuery, Model, Types } from 'mongoose';
import { getAll, create, updateById, deleteById } from '../../repositories/base.repository';
import { LearningModel, ILearning, ILearningDocument } from "./learning.model";
import { Institution } from '../institution/institution.model';
import { Subject } from '../subject/subject.model';
import { Period } from '../period/period.model';
import { User } from '../auth/auth.model';
import { validateAllExist } from '../../services/document-validator.service';
import { ILearningResponse } from './learning.types';

export async function getAllLearnings(
    filter: FilterQuery<ILearningDocument>
): Promise<ILearningDocument[]> {
    const learnings = await LearningModel.find(filter)
        .populate({
            path: 'subjectId',
            model: Subject,
            select: 'name type' 
        })
        .populate({
            path: 'periodId',
            model: Period,
            select: 'name startDate endDate isActive' 
        })
        .populate({
            path: 'userId',
            model: User,
            select: 'firstName lastName role' 
        })
        .exec();

    return learnings;
}

export async function createLearning(
    institutionId: string,
    subjectId: string,
    periodId: string,
    userId: string,
    description: string,
    grade: string
): Promise<ILearningDocument> {

    // 1. Validate existence of related documents (business logic)
    await validateAllExist([
        [Institution, institutionId, 'Institution'],
        [Subject, subjectId, 'Subject'],
        [Period, periodId, 'Period'],
        [User, userId, 'User'],
    ]);

    // 2. Use the generic service to create the document
    const payload = {
        institutionId: new Types.ObjectId(institutionId),
        subjectId: new Types.ObjectId(subjectId),
        periodId: new Types.ObjectId(periodId),
        userId: new Types.ObjectId(userId),
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
    updateData: Partial<ILearning>
): Promise<ILearningDocument | null> {

    // 1. Constructing validations array based on provided IDs
    const validations: [Model<any>, string | Types.ObjectId, string][] = [];

    if (updateData.subjectId) {
        validations.push([Subject, updateData.subjectId, 'Subject']);
    }

    if (updateData.periodId) {
        validations.push([Period, updateData.periodId, 'Period']);
    }

    if (updateData.userId) {
        validations.push([User, updateData.userId, 'User']);
    }

    // 2. Ejecuting validations if there are any
    if (validations.length > 0) {
        await validateAllExist(validations);
    }

    // 3. Use the generic service to update the document
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

export function mapLearningToResponse(learning: any): ILearningResponse {
    // toObject() converts the Mongoose document to a plain JavaScript object.
    const { subjectId, periodId, userId, ...restOfLearning } = learning.toObject();

    return {
        ...restOfLearning,
        subject: subjectId, // subjectId is already the populated object
        period: periodId,   // periodId is already the populated object
        user: {
            _id: userId._id,
            name: `${userId.firstName} ${userId.lastName}`.trim(), // trim() for safety
            role: userId.role
        }
    };
}
