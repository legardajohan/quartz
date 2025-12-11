import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// Schema for the nested learning valuation update
const learningValuationUpdateSchema = z.object({
  learningId: objectIdSchema,
  qualitativeValuation: z.enum(['Logrado', 'En proceso', 'Con dificultad']).nullable(),
});

// Schema for the nested subject valuation update
const valuationBySubjectUpdateSchema = z.object({
  subjectId: objectIdSchema,
  learningValuations: z.array(learningValuationUpdateSchema),
});


export const studentValuationValidation = {
  initializeValuation: z.object({
    params: z.object({
      studentId: objectIdSchema,
      periodId: objectIdSchema,
    }),
  }),

  getValuationById: z.object({
    params: z.object({
      valuationId: objectIdSchema,
    }),
  }),

  getValuationsByStudent: z.object({
    params: z.object({
      studentId: objectIdSchema,
    }),
  }),

  updateValuation: z.object({
    params: z.object({
      valuationId: objectIdSchema,
    }),
    body: z.object({
      valuationsBySubject: z.array(valuationBySubjectUpdateSchema),
    }),
  }),

  deleteValuation: z.object({
    params: z.object({
      valuationId: objectIdSchema,
    }),
  }),
};
