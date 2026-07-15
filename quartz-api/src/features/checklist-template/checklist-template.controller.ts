import { Request, Response } from 'express';
import {
  getChecklistTemplates,
  createChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
} from './checklist-template.service';
import { IChecklistTemplateResponse, CreateChecklistTemplateData, UpdateChecklistTemplateData } from './checklist-template.types';
import { IChecklistTemplateDocument } from './checklist-template.model';
import { UserRole } from '../auth/auth.types';

function mapTemplateToResponse(template: IChecklistTemplateDocument): IChecklistTemplateResponse {
  const t = template.toObject();
  const period = t.periodId as any;
  const teacher = t.teacherId as any;

  return {
    _id: t._id.toString(),
    institutionId: t.institutionId.toString(),
    grade: t.grade,
    name: t.name,
    period: {
      _id: period._id.toString(),
      name: period.name,
    },
    author: {
      _id: teacher._id.toString(),
      firstName: teacher.firstName,
      lastName: teacher.lastName,
    },
    subjects: t.subjects.map((s: any) => ({
      subject: {
        _id: s.subject._id.toString(),
        name: s.subject.name,
        evaluationMode: s.subject.evaluationMode,
      },
      learnings: s.learnings.map((l: any) => ({
        _id: l._id.toString(),
        description: l.description,
      })),
    })),
  };
}

export async function getTemplatesController(req: Request, res: Response) {
  const { institutionId, _id: userId, role: userRole } = req.user!;
  const templates = await getChecklistTemplates(
    institutionId.toString(),
    userId.toString(),
    userRole as UserRole
  );
  res.status(200).json(templates.map(mapTemplateToResponse));
}

export async function createTemplateController(req: Request, res: Response) {
  const { institutionId, _id: teacherId } = req.user!;
  const newTemplate = await createChecklistTemplate(
    req.body as CreateChecklistTemplateData,
    institutionId.toString(),
    teacherId.toString()
  );
  res.status(201).json(mapTemplateToResponse(newTemplate));
}

export async function updateTemplateController(req: Request, res: Response) {
  const { id } = req.params;
  const { institutionId, _id: userId, role: userRole } = req.user!;
  const updated = await updateChecklistTemplate(
    id,
    institutionId.toString(),
    userId.toString(),
    userRole as UserRole,
    req.body as UpdateChecklistTemplateData
  );
  res.status(200).json(mapTemplateToResponse(updated));
}

export async function deleteTemplateController(req: Request, res: Response) {
  const { id } = req.params;
  const { institutionId, _id: userId, role: userRole } = req.user!;
  await deleteChecklistTemplate(id, institutionId.toString(), userId.toString(), userRole as UserRole);
  res.status(200).json({ message: 'Plantilla eliminada exitosamente.' });
}
