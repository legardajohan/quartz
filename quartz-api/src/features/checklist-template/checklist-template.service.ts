import { ChecklistTemplateModel, IChecklistTemplateDocument } from './checklist-template.model';
import { CreateChecklistTemplateData, IChecklistTemplateResponse, IChecklistTemplateForSession } from './checklist-template.types';
import { LearningModel } from '../learning/learning.model';
import { FilterQuery, Types } from 'mongoose';
import {
    findScoped,
    findByIdScoped,
    createScoped,
} from '../../repositories/base.repository';

interface PopulatedLearning {
    _id: Types.ObjectId;
    subjectId: {
        _id: Types.ObjectId;
        name: string;
    };
    description: string;
}

export const getChecklistTemplatesByTeacherId = async (
    teacherId: string,
    institutionId: string,
    templateId?: string
): Promise<IChecklistTemplateResponse[]> => {
    const filter: FilterQuery<IChecklistTemplateDocument> = {
        teacherId: new Types.ObjectId(teacherId),
    };

    if (templateId) filter._id = new Types.ObjectId(templateId);

    const template = await findScoped(ChecklistTemplateModel, institutionId, filter)
        .lean<IChecklistTemplateResponse[]>()
        .exec();

    return template;
};

export const getChecklistTemplatesForSession = async (
    teacherId: string,
    institutionId: string
): Promise<IChecklistTemplateForSession[]> => {
    const templates = await findScoped(ChecklistTemplateModel, institutionId, { teacherId })
        .select('_id name periodId')
        .lean();

    return templates.map(t => ({
        _id: (t._id as Types.ObjectId).toString(),
        name: (t as any).name,
        periodId: (t as any).periodId.toString(),
    }));
};

export const createChecklistTemplate = async (
    data: CreateChecklistTemplateData,
    institutionId: string,
    teacherId: string
): Promise<IChecklistTemplateResponse> => {

    const learningsInPeriod = await findScoped(LearningModel, institutionId, {
        periodId: data.periodId,
    })
        .select('subjectId description')
        .populate('subjectId', 'name')
        .lean<PopulatedLearning[]>();

    if (learningsInPeriod.length === 0) {
        throw new Error(`No learnings found for periodId: ${data.periodId}. Cannot create an empty template.`);
    }

    // Map keys are Subject IDs (string)
    const subjectsMap = new Map<string, { name: string, learnings: string[] }>();

    for (const learning of learningsInPeriod) {
        // Ensure subjectId is populated and has a name
        if (learning.subjectId && 'name' in learning.subjectId) {
            const subjectIdStr = learning.subjectId._id.toString();
            const subjectName = learning.subjectId.name;

            if (!subjectsMap.has(subjectIdStr)) {
                subjectsMap.set(subjectIdStr, {
                    name: subjectName,
                    learnings: []
                });
            }
            subjectsMap.get(subjectIdStr)!.learnings.push(learning.description);
        }
    }

    const subjectsArray = Array.from(subjectsMap.entries()).map(([subjectId, subjectData]) => ({
        subject: {
            _id: new Types.ObjectId(subjectId),
            name: subjectData.name
        },
        learnings: subjectData.learnings.map(desc => ({ description: desc })),
    }));

    const newTemplate = await createScoped(ChecklistTemplateModel, institutionId, {
        name: data.name,
        periodId: data.periodId,
        subjects: subjectsArray,
        teacherId: new Types.ObjectId(teacherId),
    });

    const createdTemplate = await findByIdScoped(ChecklistTemplateModel, institutionId, newTemplate._id)
        .lean<IChecklistTemplateResponse>()
        .exec();

    if (!createdTemplate) {
        throw new Error('Failed to retrieve newly created template.');
    }

    return createdTemplate;
};
