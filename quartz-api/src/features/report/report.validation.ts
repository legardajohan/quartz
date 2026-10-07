import { z } from 'zod';
import { GradeLevel } from '../auth/auth.types';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'ID inválido.' });

export const getChecklistReportSchema = z.object({
  params: z.object({
    valuationId: objectIdSchema,
  }).strict(),
});

export const getCommunicativeLetterSchema = z.object({
  params: z.object({
    valuationId: objectIdSchema,
  }).strict(),
});

export const getLetterAvailabilitySchema = z.object({
  query: z.object({
    periodId: objectIdSchema,
  }).strict(),
});

// Lote (RPT-07)

export const BULK_REPORT_MAX_ITEMS = 50;

const bulkReportBody = z.object({
  valuationIds: z.array(objectIdSchema).min(1).max(BULK_REPORT_MAX_ITEMS),
}).strict();

const consolidatedReportBody = z.object({
  schoolId: objectIdSchema.optional(),
  grade: z.nativeEnum(GradeLevel),
  shiftId: objectIdSchema.optional(),
  periodId: objectIdSchema,
}).strict();

// Sin `.strict()` en el envoltorio: `validate()` siempre parsea `{ body, query, params }`, así que
// un wrapper estricto rechazaría `query` y `params` como llaves no reconocidas y devolvería 400 en
// TODAS las peticiones. El `.strict()` de `bulkReportBody` / `consolidatedReportBody` ya protege el
// body, que es lo que se busca. Ver `quartz-api/docs/known-issues.md`.
export const getBulkChecklistReportSchema = z.object({ body: bulkReportBody });
export const getBulkCommunicativeLetterSchema = z.object({ body: bulkReportBody });
export const getConsolidatedChecklistReportSchema = z.object({ body: consolidatedReportBody });
export const getConsolidatedCommunicativeLetterSchema = z.object({ body: consolidatedReportBody });
