import { FilterQuery, Query, Types } from 'mongoose';
import {
  findScoped,
  findByIdScoped,
  createScoped,
  findOneAndUpdateScoped,
  findOneAndDeleteScoped,
} from '../../repositories/base.repository';
import { ChecklistTemplateModel, IChecklistTemplateDocument } from './checklist-template.model';
import { LearningModel } from '../learning/learning.model';
import { Period } from '../period/period.model';
import { Subject } from '../subject/subject.model';
import { User } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';
import type {
  CreateChecklistTemplateData,
  UpdateChecklistTemplateData,
  IChecklistTemplateForSession,
  SubjectSnapshotData,
} from './checklist-template.types';
import AppError from '../../utils/AppError';

interface PopulatedLearning {
  _id: Types.ObjectId;
  subjectId: { _id: Types.ObjectId; name: string };
  description: string;
}

function populateTemplateDetails<T>(query: Query<T, IChecklistTemplateDocument>) {
  return query
    .populate({ path: 'periodId', model: Period, select: 'name' })
    .populate({ path: 'teacherId', model: User, select: 'firstName lastName' });
}

function ensureCanManageTemplate(
  template: { teacherId: Types.ObjectId },
  userId: string,
  userRole: UserRole
): void {
  const isAuthor = template.teacherId.toString() === userId;
  const isAreaLead = userRole === UserRole.JEFE_DE_AREA;
  if (!isAuthor && !isAreaLead) {
    throw new AppError('No tienes permiso para gestionar esta plantilla.', 403);
  }
}

function buildSubjectsArray(subjects: SubjectSnapshotData[]) {
  return subjects.map((s) => ({
    subject: {
      _id: new Types.ObjectId(s.subject._id),
      name: s.subject.name,
    },
    learnings: s.learnings.map((l) => ({ description: l.description })),
  }));
}

export async function getChecklistTemplates(
  institutionId: string,
  userId: string,
  userRole: UserRole
): Promise<IChecklistTemplateDocument[]> {
  const filter: FilterQuery<IChecklistTemplateDocument> = {};
  if (userRole === UserRole.DOCENTE) {
    filter.teacherId = new Types.ObjectId(userId);
  }
  return populateTemplateDetails(
    findScoped(ChecklistTemplateModel, institutionId, filter)
  ).exec();
}

export async function getChecklistTemplatesForSession(
  teacherId: string,
  institutionId: string
): Promise<IChecklistTemplateForSession[]> {
  const templates = await findScoped(ChecklistTemplateModel, institutionId, { teacherId })
    .select('_id name periodId')
    .lean();

  return templates.map((t) => ({
    _id: (t._id as Types.ObjectId).toString(),
    name: (t as any).name,
    periodId: (t as any).periodId.toString(),
  }));
}

export async function createChecklistTemplate(
  data: CreateChecklistTemplateData,
  institutionId: string,
  teacherId: string
): Promise<IChecklistTemplateDocument> {
  const existingCount = await ChecklistTemplateModel.countDocuments({
    institutionId: new Types.ObjectId(institutionId),
    periodId: new Types.ObjectId(data.periodId),
    teacherId: new Types.ObjectId(teacherId),
  });

  if (existingCount >= 2) {
    throw new AppError('Máximo 2 plantillas por período alcanzado.', 409);
  }

  const learnings = await findScoped(LearningModel, institutionId, {
    periodId: new Types.ObjectId(data.periodId),
    grade: data.grade,
  })
    .select('subjectId description')
    .populate({ path: 'subjectId', model: Subject, select: 'name' })
    .lean<PopulatedLearning[]>();

  const subjectsMap = new Map<string, { name: string; descriptions: string[] }>();
  for (const l of learnings) {
    if (l.subjectId && 'name' in l.subjectId) {
      const sid = l.subjectId._id.toString();
      if (!subjectsMap.has(sid)) {
        subjectsMap.set(sid, { name: l.subjectId.name, descriptions: [] });
      }
      subjectsMap.get(sid)!.descriptions.push(l.description);
    }
  }

  const subjectsArray = Array.from(subjectsMap.entries()).map(([sid, s]) => ({
    subject: { _id: new Types.ObjectId(sid), name: s.name },
    learnings: s.descriptions.map((desc) => ({ description: desc })),
  }));

  const newTemplate = await createScoped(ChecklistTemplateModel, institutionId, {
    name: data.name,
    periodId: new Types.ObjectId(data.periodId),
    grade: data.grade,
    subjects: subjectsArray,
    teacherId: new Types.ObjectId(teacherId),
  });

  const populated = await populateTemplateDetails(
    findByIdScoped(ChecklistTemplateModel, institutionId, newTemplate._id)
  ).exec();

  if (!populated) {
    throw new Error('Failed to retrieve newly created template.');
  }

  return populated;
}

export async function updateChecklistTemplate(
  id: string,
  institutionId: string,
  userId: string,
  userRole: UserRole,
  data: UpdateChecklistTemplateData
): Promise<IChecklistTemplateDocument> {
  const existing = await findByIdScoped(ChecklistTemplateModel, institutionId, id).lean();
  if (!existing) {
    throw new AppError('Plantilla no encontrada.', 404);
  }

  ensureCanManageTemplate(existing, userId, userRole);

  const updatePayload: Record<string, unknown> = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.subjects !== undefined) updatePayload.subjects = buildSubjectsArray(data.subjects);

  await findOneAndUpdateScoped(
    ChecklistTemplateModel,
    institutionId,
    { _id: new Types.ObjectId(id) },
    updatePayload,
    { new: true }
  );

  const populated = await populateTemplateDetails(
    findByIdScoped(ChecklistTemplateModel, institutionId, new Types.ObjectId(id))
  ).exec();

  if (!populated) {
    throw new AppError('Plantilla no encontrada.', 404);
  }

  return populated;
}

export async function deleteChecklistTemplate(
  id: string,
  institutionId: string,
  userId: string,
  userRole: UserRole
): Promise<void> {
  const existing = await findByIdScoped(ChecklistTemplateModel, institutionId, id).lean();
  if (!existing) {
    throw new AppError('Plantilla no encontrada.', 404);
  }

  ensureCanManageTemplate(existing, userId, userRole);

  await findOneAndDeleteScoped(ChecklistTemplateModel, institutionId, {
    _id: new Types.ObjectId(id),
  });
}
