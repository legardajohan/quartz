import { z } from 'zod';
import { ReportKind } from './institution.types';

export const updateInstitutionSettingsSchema = z.object({
  body: z.object({
    settings: z.object({
      // Vacío se acepta aquí: el service lo traduce a AppError(422), no a un 400 de validación.
      enabledReports: z.array(z.nativeEnum(ReportKind)).optional(),
    }).strict(),
  }),
});
