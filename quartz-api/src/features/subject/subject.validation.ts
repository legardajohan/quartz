import { z } from 'zod';
import { SubjectType, SubjectEvaluationMode } from './subject.types';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'ID inválido.' });

const subjectBodySchema = z.object({
  name: z.string().trim().min(1, { message: 'El nombre es obligatorio.' }).max(120),
  type: z.nativeEnum(SubjectType),
  evaluationMode: z.nativeEnum(SubjectEvaluationMode).optional(),
}).strict();

export const createSubjectSchema = z.object({
  body: subjectBodySchema,
});

export const updateSubjectSchema = z.object({
  params: z.object({
    subjectId: objectIdSchema,
  }),
  body: subjectBodySchema.partial(),
});

export const deleteSubjectSchema = z.object({
  params: z.object({
    subjectId: objectIdSchema,
  }),
});
