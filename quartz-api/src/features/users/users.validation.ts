import { z } from 'zod';
import { UserRole } from '../auth/auth.types';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const getUsersSchema = z.object({
  query: z.object({
    id: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID no es un ObjectId válido.',
    }).optional(),
    role: z.string().refine((val) => Object.values(UserRole).includes(val as UserRole), {
      message: 'El rol no es válido.',
    }).optional(),
    schoolId: z.string().refine((val) => objectIdRegex.test(val), {
      message: 'El ID de la escuela no es un ObjectId válido.',
    }).optional(),
  }),
});
