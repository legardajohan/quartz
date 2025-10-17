import { z } from 'zod';

export const createLearningSchema = z.object({
  body: z.object({
    institutionId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID de la institución no es un ObjectId válido.',
    }),
    subjectId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID de la materia no es un ObjectId válido.',
    }),
    periodId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID del período no es un ObjectId válido.',
    }),
    userId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID del usuario no es un ObjectId válido.',
    }),
    description: z.string().min(1, { message:'La descripción es obligatoria y no puede estar vacía.' }),
    grade: z.string().min(1, { message: 'El grado es obligatorio y no puede estar vacío.' }),
  }),
});

export const updateLearningSchema = z.object({
  params: z.object({
    learningId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID del aprendizaje no es un ObjectId válido.',
    }),
  }),
  body: z.object({
    description: z.string().min(1, { message: 'La descripción no puede estar vacía.' }).optional(),
    grade: z.string().min(1, { message: 'El grado no puede estar vacío.' }).optional(),
    subjectId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID de la materia no es un ObjectId válido.',
    }).optional(),
    periodId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID del período no es un ObjectId válido.',
    }).optional(),
    userId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID del usuario no es un ObjectId válido.',
    }).optional(),
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
    institutionId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'El ID de la institución no es un ObjectId válido.',
    }).optional(),
    subjectId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID de la materia no es un ObjectId válido.',
    }).optional(),
    periodId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID del período no es un ObjectId válido.',
    }).optional(),
    userId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'El ID del usuario no es un ObjectId válido.',
    }).optional(),
    grade: z.string().min(1, { message: 'El grado no puede estar vacío.' }).optional(),
  }),
});