import { Request, Response } from 'express';
import { createChecklistTemplate, getChecklistTemplateById } from './checklist-template.service';

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

export const getTemplateByIdController = async (req: Request, res: Response) => {
    try {
        const { institutionId } = req.user!;
        const { id: templateId } = req.params;
        const template = await getChecklistTemplateById(templateId, institutionId.toString());

        if (!template) {
            return res.status(404).json({ message: 'Checklist template not found.' });
        }
        res.status(200).json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching checklist template', error: error instanceof Error ? error.message : String(error) });
    }
};