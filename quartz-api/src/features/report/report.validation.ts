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

export const getBulkChecklistReportSchema = z.object({ body: bulkReportBody }).strict();
export const getBulkCommunicativeLetterSchema = z.object({ body: bulkReportBody }).strict();
export const getConsolidatedChecklistReportSchema = z.object({ body: consolidatedReportBody }).strict();
export const getConsolidatedCommunicativeLetterSchema = z.object({ body: consolidatedReportBody }).strict();
