import { FilterQuery, Model, Types } from 'mongoose';
import { getAll, create, updateById, deleteById } from '../../repositories/base.repository';
import { LearningModel, ILearning, ILearningDocument } from "./learning.model";
import { Institution } from '../institution/institution.model';
import { Subject } from '../subject/subject.model';
import { Period } from '../period/period.model';
import { validateAllExist } from '../../services/document-validator.service';

export async function getAllLearnings(
    filter: FilterQuery<ILearningDocument>
): Promise<ILearningDocument[]> {
    return getAll(LearningModel, filter);
}

export async function createLearning(
    institutionId: string,
    subjectId: string,
    periodId: string,
    description: string,
    grade: string
): Promise<ILearningDocument> {

    // 1. Validate existence of related documents (business logic)
    await validateAllExist([
        [Institution, institutionId, 'Institution'],
        [Subject, subjectId, 'Subject'],
        [Period, periodId, 'Period']
    ]);

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