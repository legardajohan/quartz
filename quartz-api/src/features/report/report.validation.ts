import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'ID inválido.' });

export const getChecklistReportSchema = z.object({
  params: z.object({
    valuationId: objectIdSchema,
  }).strict(),
});

export const getChecklistReportImageSchema = z.object({
  params: z.object({
    valuationId: objectIdSchema,
    kind: z.enum(['shield', 'photo']),
  }).strict(),
});
