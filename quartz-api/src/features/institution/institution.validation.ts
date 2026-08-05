import { z } from 'zod';
import { ReportKind } from './institution.types';

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
    }).strict(),
  }),
});
