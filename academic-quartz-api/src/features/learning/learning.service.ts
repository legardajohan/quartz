import { FilterQuery, Model, Types } from 'mongoose';
import { create, updateById, deleteById } from '../../repositories/base.repository';
import { LearningModel, ILearningDocument } from "./learning.model";
import { Subject } from '../subject/subject.model';
import { Period } from '../period/period.model';
import type { LearningData, UpdateLearningData } from './learning.types';
import { validateAllExist } from '../../services/document-validator.service';

export async function getAllLearnings(
    institutionId: string,
    filter: FilterQuery<ILearningDocument>
): Promise<ILearningDocument[]> {
    const query: FilterQuery<ILearningDocument> = {
        ...filter,
        institutionId: new Types.ObjectId(institutionId),
    };
    const learnings = await LearningModel.find(query)
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
        .exec();

    return learnings;
}

export async function createLearning(
    institutionId: string,
    userId: string,
    learningData: LearningData
): Promise<ILearningDocument> {

    const { subjectId, periodId, description, grade } = learningData;

    // 1. Validate existence of related documents (business logic)
    // Institution and User are validated implicitly by using the user from the token
    await validateAllExist([
        [Subject, subjectId, 'Subject'],
        [Period, periodId, 'Period'],
    ]);

    // 2. Use the generic service to create the document
    const payload = {
        institutionId: new Types.ObjectId(institutionId),
        userId: new Types.ObjectId(userId),
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
    institutionId: string,
    updateData: UpdateLearningData
): Promise<ILearningDocument | null> {

    // 1. Constructing validations array based on provided IDs
    const validations: [Model<any>, string | Types.ObjectId, string][] = [];

    if (updateData.subjectId) {
        validations.push([Subject, updateData.subjectId, 'Subject']);
    }

    if (updateData.periodId) {
        validations.push([Period, updateData.periodId, 'Period']);
    }

    // 2. Ejecuting validations if there are any
    if (validations.length > 0) {
        await validateAllExist(validations);
    }

    // 3. Use the generic service to update the document
    const query = {
        _id: new Types.ObjectId(learningId),
        institutionId: new Types.ObjectId(institutionId)
    };
    return LearningModel.findOneAndUpdate(
        query,
        updateData,
        { new: true }
    );

    // return updateById(
    //     LearningModel, 
    //     learningId, 
    //     updateData
    // );
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
