import { z } from 'zod';
import { GradeLevel } from '../auth/auth.types';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identificador inválido.');

export const getDashboardSchema = z.object({
  query: z.object({
    periodId: objectId.optional(),
    schoolId: objectId.optional(),
    shiftId: objectId.optional(),
    grade: z.nativeEnum(GradeLevel).optional(),
  }).strict(),
});

export type GetDashboardQuery = z.infer<typeof getDashboardSchema>['query'];
