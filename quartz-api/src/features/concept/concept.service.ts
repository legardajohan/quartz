import { FilterQuery, Query, Types } from 'mongoose';
import {
  findScoped,
  findByIdScoped,
  createScoped,
  findOneAndUpdateScoped,
  findOneAndDeleteScoped,
} from '../../repositories/base.repository';
import { ConceptModel, IConceptDocument } from './concept.model';
import { Subject } from '../subject/subject.model';
import { Period } from '../period/period.model';
import { User } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';
import type { ConceptData, UpdateConceptData, IConceptFilter } from './concept.types';
import AppError from '../../utils/AppError';

function populateConceptDetails<T>(query: Query<T, IConceptDocument>) {
  return query
    .populate({ path: 'subjectId', model: Subject, select: 'name' })
    .populate({ path: 'periodId', model: Period, select: 'name' })
    .populate({ path: 'authorId', model: User, select: 'firstName lastName role' });
}

async function ensureReferencesBelongToInstitution(
  institutionId: string,
  subjectId?: string,
  periodId?: string
): Promise<void> {
  if (subjectId) {
    const subject = await findByIdScoped(Subject, institutionId, subjectId).lean();
    if (!subject) {
      throw new AppError('La dimensión no existe o no pertenece a la institución.', 400);
    }
  }
  if (periodId) {
    const period = await findByIdScoped(Period, institutionId, periodId).lean();
    if (!period) {
      throw new AppError('El período no existe o no pertenece a la institución.', 400);
    }
  }
}

function ensureCanManageConcept(
  concept: { authorId: Types.ObjectId },
  userId: string,
  userRole: UserRole
): void {
  const isAuthor = concept.authorId.toString() === userId;
  const isAreaLead = userRole === UserRole.JEFE_DE_AREA;
  if (!isAuthor && !isAreaLead) {
    throw new AppError('No tienes permiso para gestionar este concepto.', 403);
  }
}

export async function getConcepts(
  institutionId: string,
  filter: IConceptFilter
): Promise<IConceptDocument[]> {
  const query: FilterQuery<IConceptDocument> = {};
  if (filter.subjectId) query.subjectId = new Types.ObjectId(filter.subjectId);
  if (filter.periodId) query.periodId = new Types.ObjectId(filter.periodId);
  if (filter.valuationType) query.valuationType = filter.valuationType;

  const baseQuery = findScoped(ConceptModel, institutionId, query);
  return populateConceptDetails(baseQuery).exec();
}

export async function createConcept(
  institutionId: string,
  authorId: string,
  data: ConceptData
): Promise<IConceptDocument> {
  await ensureReferencesBelongToInstitution(institutionId, data.subjectId, data.periodId);

  const newConcept = await createScoped(ConceptModel, institutionId, {
    description: data.description,
    valuationType: data.valuationType,
    subjectId: new Types.ObjectId(data.subjectId),
    periodId: new Types.ObjectId(data.periodId),
    authorId: new Types.ObjectId(authorId),
  });

  const populatedConcept = await populateConceptDetails(
    findByIdScoped(ConceptModel, institutionId, newConcept._id as Types.ObjectId)
  ).exec();

  if (!populatedConcept) {
    throw new Error('Failed to populate the newly created concept.');
  }

  return populatedConcept;
}

export async function updateConcept(
  conceptId: string,
  institutionId: string,
  userId: string,
  userRole: UserRole,
  data: UpdateConceptData
): Promise<IConceptDocument> {
  const existingConcept = await findByIdScoped(ConceptModel, institutionId, conceptId).lean();
  if (!existingConcept) {
    throw new AppError('Concepto no encontrado.', 404);
  }

  ensureCanManageConcept(existingConcept, userId, userRole);
  await ensureReferencesBelongToInstitution(institutionId, data.subjectId, data.periodId);

  const updatePayload: Record<string, unknown> = { ...data };
  if (data.subjectId) updatePayload.subjectId = new Types.ObjectId(data.subjectId);
  if (data.periodId) updatePayload.periodId = new Types.ObjectId(data.periodId);

  await findOneAndUpdateScoped(
    ConceptModel,
    institutionId,
    { _id: new Types.ObjectId(conceptId) },
    updatePayload,
    { new: true }
  );

  const populatedConcept = await populateConceptDetails(
    findByIdScoped(ConceptModel, institutionId, new Types.ObjectId(conceptId))
  ).exec();

  if (!populatedConcept) {
    throw new AppError('Concepto no encontrado.', 404);
  }

  return populatedConcept;
}

export async function deleteConcept(
  conceptId: string,
  institutionId: string,
  userId: string,
  userRole: UserRole
): Promise<void> {
  const existingConcept = await findByIdScoped(ConceptModel, institutionId, conceptId).lean();
  if (!existingConcept) {
    throw new AppError('Concepto no encontrado.', 404);
  }

  ensureCanManageConcept(existingConcept, userId, userRole);

  await findOneAndDeleteScoped(ConceptModel, institutionId, { _id: new Types.ObjectId(conceptId) });
}
