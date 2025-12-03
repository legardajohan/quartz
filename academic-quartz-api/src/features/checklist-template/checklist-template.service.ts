import { ChecklistTemplateModel, IChecklistTemplateDocument } from './checklist-template.model';
import { CreateChecklistTemplateData, IChecklistTemplateResponse } from './checklist-template.types';
import { LearningModel } from '../learning/learning.model';
import { Types } from 'mongoose';
import { create } from '../../repositories/base.repository'; // <-- 1. 

interface LeanLearning {
  _id: Types.ObjectId;
  subjectId: Types.ObjectId;
}

export const createChecklistTemplate = async (
    data: CreateChecklistTemplateData,
    institutionId: string,
    teacherId: string
): Promise<IChecklistTemplateDocument> => {
    
    const learningsInPeriod = await LearningModel.find({
        periodId: data.periodId,
        institutionId: institutionId
    }).select('_id subjectId').lean<LeanLearning[]>();

    if (learningsInPeriod.length === 0) {
        throw new Error(`No learnings found for periodId: ${data.periodId}. Cannot create an empty template.`);
    }

    const subjectsMap = new Map<string, Types.ObjectId[]>();
    for (const learning of learningsInPeriod) {
        const subjectIdStr = learning.subjectId.toString();
        if (!subjectsMap.has(subjectIdStr)) {
            subjectsMap.set(subjectIdStr, []);
        }
        subjectsMap.get(subjectIdStr)!.push(learning._id);
    }

    const subjectsArray = Array.from(subjectsMap.entries()).map(([subjectId, learnings]) => ({
        subjectId: new Types.ObjectId(subjectId),
        learnings: learnings,
    }));

    const newTemplate = await create(ChecklistTemplateModel, {
        name: data.name,
        periodId: data.periodId,
        subjects: subjectsArray,
        institutionId: new Types.ObjectId(institutionId), 
        teacherId: new Types.ObjectId(teacherId),       
    });

    return newTemplate;
};

export const getChecklistTemplateById = async (
    templateId: string,
    institutionId: string
): Promise<IChecklistTemplateResponse | null> => {
    const template = await ChecklistTemplateModel.findOne({ _id: templateId, institutionId })
        .populate<{ subjects: IChecklistTemplateResponse['subjects'] }>([
            {
                path: 'subjects.subjectId',
                select: 'name'
            },
            {
                path: 'subjects.learnings',
                select: 'description'
            }
        ])
        .lean<IChecklistTemplateResponse>();

    return template;
};