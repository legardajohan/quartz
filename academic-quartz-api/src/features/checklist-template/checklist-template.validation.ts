import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const getTemplatesByTeacherSchema = z.object({
  query: z.object({
    periodId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del período no es un ObjectId válido.',
    }).optional(),
    templateId: z.string().refine((val) => objectIdRegex.test(val), {
        message: 'El ID del template no es un ObjectId válido.',
    }).optional(),
  }).strict().optional(),

  params: z.object({
    id: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del template no es un ObjectId válido.',
    }).optional(), 
  }).optional(),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string()
      .min(3, { message: 'El nombre es requerido' }),
    periodId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID del período no es un ObjectId válido.',
    }),
  }).strict(),
});
