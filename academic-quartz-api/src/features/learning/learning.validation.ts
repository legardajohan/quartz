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
    description: z.string().min(1, { message:'La descripción es obligatoria y no puede estar vacía.' }),
    grade: z.string().min(1, { message: 'El grado es obligatorio y no puede estar vacío.' }),
  }),
});