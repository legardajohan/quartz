import { z } from 'zod';
import { SubjectEvaluationMode } from '../subject/subject.types';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const learningItemSchema = z.object({
  description: z.string().min(1, { message: 'La descripción del ítem no puede estar vacía.' })
});

const subjectSnapshotSchema = z.object({
  subject: z.object({
    _id: z.string().refine((v) => objectIdRegex.test(v), { message: 'ID de dimensión inválido.' }),
    name: z.string().min(1, { message: 'El nombre de la dimensión es obligatorio.' }),
    evaluationMode: z.nativeEnum(SubjectEvaluationMode)
  }),
  learnings: z.array(learningItemSchema)
}).refine(
  (data) => data.subject.evaluationMode !== SubjectEvaluationMode.CHECKLIST || data.learnings.length > 0,
  { message: 'Cada dimensión en modo checklist debe tener al menos un aprendizaje.', path: ['learnings'] }
);

export const getTemplatesByTeacherSchema = z.object({
  query: z.object({
    periodId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del período no es un ObjectId válido.',
    }).optional(),
    templateId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del template no es un ObjectId válido.',
    }).optional(),
  }).strict().optional(),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    periodId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del período no es un ObjectId válido.',
    }),
    grade: z.string().min(1, { message: 'El grado es obligatorio.' }),
  }).strict(),
});

export const updateTemplateSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del template no es un ObjectId válido.',
    })
  }).strict(),
  body: z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }).optional(),
    subjects: z.array(subjectSnapshotSchema).min(1).optional()
  }).strict(),
});

export const deleteTemplateSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del template no es un ObjectId válido.',
    })
  }).strict(),
});
