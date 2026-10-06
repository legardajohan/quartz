import { z } from 'zod';
import { ReportKind } from './institution.types';
import { GradeLevel } from '../auth/auth.types';

const objectId = (message: string) =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, { message });

const shiftInputSchema = z.object({
  _id: objectId('El ID de la jornada no es un ObjectId válido.').optional(),
  name: z.string().trim().min(1, 'El nombre de la jornada es obligatorio.').max(60),
}).strict();

export const updateInstitutionSettingsSchema = z.object({
  body: z.object({
    settings: z.object({
      // Vacío se acepta aquí: el service lo traduce a AppError(422), no a un 400 de validación.
      enabledReports: z.array(z.nativeEnum(ReportKind)).optional(),
      multipleShifts: z.boolean().optional(),
      shifts: z.array(shiftInputSchema).max(10).optional(),
      // Vacío también llega al service (422); duplicados o valores fuera del enum son 400.
      offeredLevels: z
        .array(z.nativeEnum(GradeLevel))
        .refine((levels) => new Set(levels).size === levels.length, 'Hay niveles repetidos.')
        .optional(),
    }).strict(),
  }),
});
