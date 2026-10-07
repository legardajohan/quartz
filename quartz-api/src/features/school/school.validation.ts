import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'ID inválido.' });

const schoolBodySchema = z.object({
  name: z.string().trim().min(1, { message: 'El nombre es obligatorio.' }).max(120),
}).strict();

export const createSchoolSchema = z.object({
  body: schoolBodySchema,
});

export const updateSchoolSchema = z.object({
  params: z.object({
    schoolId: objectIdSchema,
  }).strict(),
  body: schoolBodySchema.partial(),
});

export const deleteSchoolSchema = z.object({
  params: z.object({
    schoolId: objectIdSchema,
  }).strict(),
});
