import { z } from 'zod';
import { GradeLevel } from '../auth/auth.types';

export const createLearningSchema = z.object({
  body: z.object({
    subjectId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID de la materia no es un ObjectId válido.',
    }),
    periodId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID del período no es un ObjectId válido.',
    }),
    description: z.string().min(1, { message:'La descripción es obligatoria y no puede estar vacía.' }),
    grade: z.nativeEnum(GradeLevel, { message: 'El grado no es un nivel válido.' }),
  }).strict(),
});

export const updateLearningSchema = z.object({
  params: z.object({
    learningId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID del aprendizaje no es un ObjectId válido.',
    }),
  }),
  body: z.object({
    subjectId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID de la materia no es un ObjectId válido.',
    }).optional(),
    periodId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID del período no es un ObjectId válido.',
    }).optional(),
    description: z.string().min(1, { message: 'La descripción no puede estar vacía.' }).optional(),
    grade: z.nativeEnum(GradeLevel, { message: 'El grado no es un nivel válido.' }).optional(),
    version: z.number().int().nonnegative(),
  }),
});

export const deleteLearningSchema = z.object({
  params: z.object({
    learningId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID del aprendizaje no es un ObjectId válido.',
    }),
  }),
});

export const getAllLearningsSchema = z.object({
  query: z.object({
    subjectId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID de la materia no es un ObjectId válido.',
    }).optional(),
    periodId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID del período no es un ObjectId válido.',
    }).optional(),
    userId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID del usuario no es un ObjectId válido.',
    }).optional(),
    grade: z.nativeEnum(GradeLevel, { message: 'El grado no es un nivel válido.' }).optional(),
  }).strict(),
});