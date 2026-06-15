import { Request, Response } from 'express';
import { createChecklistTemplate, getChecklistTemplatesByTeacherId } from './checklist-template.service';
import AppError from '../../utils/AppError';

export const getTemplatesByTeacherController = async (req: Request, res: Response) => {
    const { institutionId, _id: teacherId } = req.user!;
    const { templateId } = req.query;
    const templates = await getChecklistTemplatesByTeacherId(
        teacherId.toString(),
        institutionId.toString(),
        templateId as string | undefined
    );

    if (templateId && templates.length === 0) {
        throw new AppError('Checklist template not found.', 404);
    }

    res.status(200).json(templates);
};

export const createTemplateController = async (req: Request, res: Response) => {
    const { institutionId, _id: teacherId } = req.user!;
    const newTemplate = await createChecklistTemplate(req.body, institutionId.toString(), teacherId.toString());
    res.status(201).json(newTemplate);
};
