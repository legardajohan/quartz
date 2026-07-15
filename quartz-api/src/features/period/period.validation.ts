import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'ID inválido.' });

const periodBodySchema = z.object({
  name: z.string().trim().min(1, { message: 'El nombre es obligatorio.' }).max(120),
  year: z.number().int().min(2000).max(2100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  closingAlertDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
}).strict();

export const createPeriodSchema = z.object({
  body: periodBodySchema.refine((data) => data.endDate > data.startDate, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
    path: ['endDate'],
  }).refine((data) => !data.closingAlertDate || data.closingAlertDate >= data.endDate, {
    message: 'La alerta de cierre no puede ser anterior a la fecha de fin.',
    path: ['closingAlertDate'],
  }),
});

export const updatePeriodSchema = z.object({
  params: z.object({
    periodId: objectIdSchema,
  }),
  body: periodBodySchema.partial(),
});

export const deletePeriodSchema = z.object({
  params: z.object({
    periodId: objectIdSchema,
  }),
});
