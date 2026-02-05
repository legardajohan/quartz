import { ChecklistTemplateModel, IChecklistTemplateDocument } from './checklist-template.model';
import { CreateChecklistTemplateData, IChecklistTemplateResponse, IChecklistTemplateForSession } from './checklist-template.types';
import { LearningModel } from '../learning/learning.model';
import { FilterQuery, Types } from 'mongoose';
import { create } from '../../repositories/base.repository';

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
    const query: FilterQuery<IChecklistTemplateDocument> = {
        teacherId: new Types.ObjectId(teacherId),
        institutionId: new Types.ObjectId(institutionId),
    };

    if (templateId) query._id = new Types.ObjectId(templateId);

    const template = await ChecklistTemplateModel.find(query)
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

    const subjectsArray = Array.from(subjectsMap.entries()).map(([subjectId, data]) => ({
        subject: {
            _id: new Types.ObjectId(subjectId),
            name: data.name
        },
        // Map strings to objects for the new schema
        learnings: data.learnings.map(desc => ({ description: desc })),
    }));

    const newTemplate = await create(ChecklistTemplateModel, {
        name: data.name,
        periodId: data.periodId,
        subjects: subjectsArray,
        institutionId: new Types.ObjectId(institutionId),
        teacherId: new Types.ObjectId(teacherId),
    });

    // Since we are storing snapshots, we don't need to populate the result deeply again, 
    // but the generic create returns the document. 
    // We want to return IChecklistTemplateResponse matching the interface.
    // The created document already has the structure we want (strings).

    // We can just findById to ensure we return a plain object/lean if 'create' returns a Mongoose document.
    const createdTemplate = await ChecklistTemplateModel.findById(newTemplate._id)
        .lean<IChecklistTemplateResponse>()
        .exec();

    if (!createdTemplate) {
        throw new Error('Failed to retrieve newly created template.');
    }

    return createdTemplate;
};
