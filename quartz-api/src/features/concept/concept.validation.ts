import { z } from 'zod';
import { QualitativeValuation } from './concept.types';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const getConceptsSchema = z.object({
  query: z.object({
    subjectId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID de la dimensión no es un ObjectId válido.',
    }).optional(),
    periodId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del período no es un ObjectId válido.',
    }).optional(),
    valuationType: z.nativeEnum(QualitativeValuation).optional(),
  }).strict().optional(),
});

export const createConceptSchema = z.object({
  body: z.object({
    description: z.string().min(1, { message: 'La descripción es obligatoria y no puede estar vacía.' }),
    valuationType: z.nativeEnum(QualitativeValuation),
    subjectId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID de la dimensión no es un ObjectId válido.',
    }),
    periodId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del período no es un ObjectId válido.',
    }),
  }).strict(),
});

export const updateConceptSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del concepto no es un ObjectId válido.',
    }),
  }).strict(),
  body: z.object({
    description: z.string().min(1, { message: 'La descripción no puede estar vacía.' }).optional(),
    valuationType: z.nativeEnum(QualitativeValuation).optional(),
    subjectId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID de la dimensión no es un ObjectId válido.',
    }).optional(),
    periodId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del período no es un ObjectId válido.',
    }).optional(),
  }).strict(),
});

export const deleteConceptSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del concepto no es un ObjectId válido.',
    }),
  }).strict(),
});
