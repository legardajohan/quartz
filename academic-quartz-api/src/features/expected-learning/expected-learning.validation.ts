import { z } from 'zod';

export const createExpectedLearningSchema = z.object({
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
    description: z.string({
      required_error: 'La descripción es obligatoria.',
    }).min(1, 'La descripción no puede estar vacía.'),
    grade: z.string({
      required_error: 'El grado es obligatorio.',
    }).min(1, 'El grado no puede estar vacío.'),
  }),
});