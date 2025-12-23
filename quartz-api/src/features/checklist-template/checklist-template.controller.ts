import { Request, Response } from 'express';
import { createChecklistTemplate, getChecklistTemplatesByTeacherId } from './checklist-template.service';

export const getTemplatesByTeacherController = async (req: Request, res: Response) => {
    try {
        const { institutionId, _id: teacherId } = req.user!;
        const { templateId } = req.query;
        const templates = await getChecklistTemplatesByTeacherId(
            teacherId.toString(), 
            institutionId.toString(), 
            templateId as string | undefined
        );

        if (templateId && templates.length === 0) {
            return res.status(404).json({ message: 'Checklist template not found.' });
        }

        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching checklist template', error: error instanceof Error ? error.message : String(error) });
    }
};

export const createTemplateController = async (req: Request, res: Response) => {
    try {
        const { institutionId, _id: teacherId } = req.user!;
        const newTemplate = await createChecklistTemplate(req.body, institutionId.toString(), teacherId.toString());
        res.status(201).json(newTemplate);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.startsWith('No learnings found')) {
            return res.status(422).json({ message: 'Unprocessable Entity', error: errorMessage });
        }
        res.status(500).json({ message: 'Error creating checklist template', error: errorMessage });
    }
};
