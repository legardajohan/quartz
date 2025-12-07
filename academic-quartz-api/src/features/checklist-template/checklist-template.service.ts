import { ChecklistTemplateModel, IChecklistTemplateDocument } from './checklist-template.model';
import { CreateChecklistTemplateData, IChecklistTemplateResponse, IChecklistTemplateForSession } from './checklist-template.types';
import { LearningModel } from '../learning/learning.model';
import { FilterQuery, Types, Query } from 'mongoose';
import { create } from '../../repositories/base.repository';

interface LeanLearning {
    _id: Types.ObjectId;
    subjectId: Types.ObjectId;
}

function populateChecklistTemplateDetails<T>(query: Query<T, IChecklistTemplateDocument>) {
    return query
        .populate<{ subjects: IChecklistTemplateResponse['subjects'] }>([
            {
                path: 'subjects.subjectId',
                select: 'name'
            },
            {
                path: 'subjects.learnings',
                select: 'description'
            }
        ]);
}

export const getChecklistTemplatesByTeacherId = async (
    teacherId: string,
    institutionId: string,
    templateId?: string
): Promise<IChecklistTemplateResponse[]> => {
    const query: FilterQuery<IChecklistTemplateDocument> = {
        teacherId: new Types.ObjectId(teacherId),
        institutionId: new Types.ObjectId(institutionId),
    };

    if (templateId) query._id = new Types.ObjectId(templateId);

    const template = await populateChecklistTemplateDetails(
        ChecklistTemplateModel.find(query)
    )
        .lean<IChecklistTemplateResponse[]>()
        .exec();

    return template;
};

export const getChecklistTemplatesForSession = async (
    teacherId: string,
    institutionId: string
): Promise<IChecklistTemplateForSession[]> => {
    const templates = await ChecklistTemplateModel.find({
        teacherId,
        institutionId,
    })
        .select('_id name periodId')
        .lean();

    return templates.map(t => ({
        _id: t._id.toString(),
        name: t.name,
        periodId: t.periodId.toString(),
    }));
};

export const createChecklistTemplate = async (
    data: CreateChecklistTemplateData,
    institutionId: string,
    teacherId: string
): Promise<IChecklistTemplateResponse> => {

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

    const populatedTemplate = await populateChecklistTemplateDetails(
        ChecklistTemplateModel.findById(newTemplate._id) 
    ).lean<IChecklistTemplateResponse>().exec();

    if (!populatedTemplate) {
         throw new Error('Failed to retrieve and populate newly created template.');
    }

    return populatedTemplate;
};
