import { FilterQuery, Model, Types, Query } from 'mongoose';
import { create } from '../../repositories/base.repository';
import { LearningModel, ILearningDocument } from "./learning.model";
import { Subject } from '../subject/subject.model';
import { Period } from '../period/period.model';
import type { LearningData, UpdateLearningData } from './learning.types';
import { validateAllExist } from '../../services/document-validator.service';

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
        });
}

export async function getAllLearnings(
    institutionId: string,
    filter: FilterQuery<ILearningDocument>
): Promise<ILearningDocument[]> {
    const query = LearningModel.find({
        ...filter,
        institutionId: new Types.ObjectId(institutionId),
    });
    
    const learnings = await populateLearningDetails(query).exec();
    return learnings;
}

export async function createLearning(
    institutionId: string,
    userId: string,
    learningData: LearningData
): Promise<ILearningDocument> {

    const { subjectId, periodId, description, grade } = learningData;

    await validateAllExist([
        [Subject, subjectId, 'Subject'],
        [Period, periodId, 'Period'],
    ]);

    const payload = {
        institutionId: new Types.ObjectId(institutionId),
        userId: new Types.ObjectId(userId),
        subjectId: new Types.ObjectId(subjectId),
        periodId: new Types.ObjectId(periodId),
        description,
        grade
    };

    const newLearning = await create(
        LearningModel,
        payload
    );

    const populatedLearning = await populateLearningDetails(
        LearningModel.findById(newLearning._id)
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

    const validations: [Model<any>, string | Types.ObjectId, string][] = [];
    if (updateData.subjectId) {
        validations.push([Subject, updateData.subjectId, 'Subject']);
    }
    if (updateData.periodId) {
        validations.push([Period, updateData.periodId, 'Period']);
    }
    if (validations.length > 0) {
        await validateAllExist(validations);
    }

    const query = {
        _id: new Types.ObjectId(learningId),
        institutionId: new Types.ObjectId(institutionId)
    };

    const updatedLearning = await LearningModel.findOneAndUpdate(
        query,
        updateData,
        { new: true }
    );

    if (!updatedLearning) {
        return null;
    }

    const populatedLearning = await populateLearningDetails(
        LearningModel.findById(updatedLearning._id)
    ).exec();
    
    return populatedLearning;
}

export async function deleteLearning(
    learningId: string,
    institutionId: string
): Promise<ILearningDocument | null> {
    const query = {
        _id: new Types.ObjectId(learningId),
        institutionId: new Types.ObjectId(institutionId)
    };
    
    return LearningModel.findOneAndDelete(query);
}
