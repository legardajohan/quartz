import { z } from 'zod';
import { UserRole, IdentificationType, GradeLevel } from '../auth/auth.types';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectId = (message: string) =>
  z.string().refine((val) => objectIdRegex.test(val), { message });

export const getUsersSchema = z.object({
  query: z.object({
    id: objectId('El ID no es un ObjectId válido.').optional(),
    role: z.string().refine((val) => Object.values(UserRole).includes(val as UserRole), {
      message: 'El rol no es válido.',
    }).optional(),
    schoolId: objectId('El ID de la escuela no es un ObjectId válido.').optional(),
  }),
});

const baseUserFields = {
  firstName: z.string().min(1, 'El nombre es obligatorio.'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'El apellido es obligatorio.'),
  secondLastName: z.string().optional(),
  identificationType: z.nativeEnum(IdentificationType),
  identificationNumber: z.number().int('La identificación debe ser un número entero.').positive('La identificación debe ser un número positivo.'),
  phoneNumber: z.string().optional(),
  schoolId: objectId('El ID de la sede no es un ObjectId válido.'),
};

const createStudentSchema = z.object({
  ...baseUserFields,
  role: z.literal(UserRole.ESTUDIANTE),
  gradesTaught: z.array(z.nativeEnum(GradeLevel)).length(1, 'El estudiante debe tener exactamente un grado.'),
  shiftId: objectId('El ID de la jornada no es un ObjectId válido.').optional(),
}).strict();

const createTeacherSchema = z.object({
  ...baseUserFields,
  role: z.literal(UserRole.DOCENTE),
  gradesTaught: z.array(z.nativeEnum(GradeLevel)).min(1, 'El docente debe tener al menos un grado.'),
  email: z.string().email('El correo no es válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
}).strict();

export const createUserSchema = z.object({
  body: z.discriminatedUnion('role', [createStudentSchema, createTeacherSchema]),
});

export const updateUserSchema = z.object({
  params: z.object({
    userId: objectId('El ID del usuario no es un ObjectId válido.'),
  }).strict(),
  body: z.object({
    firstName: z.string().min(1, 'El nombre no puede estar vacío.').optional(),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'El apellido no puede estar vacío.').optional(),
    secondLastName: z.string().optional(),
    identificationType: z.nativeEnum(IdentificationType).optional(),
    identificationNumber: z.number().int('La identificación debe ser un número entero.').positive('La identificación debe ser un número positivo.').optional(),
    phoneNumber: z.string().optional(),
    schoolId: objectId('El ID de la sede no es un ObjectId válido.').optional(),
    gradesTaught: z.array(z.nativeEnum(GradeLevel)).min(1, 'Debe indicar al menos un grado.').optional(),
    email: z.string().email('El correo no es válido.').optional(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').optional(),
    shiftId: objectId('El ID de la jornada no es un ObjectId válido.').nullable().optional(),
  }).strict(),
});

export const deleteUserSchema = z.object({
  params: z.object({
    userId: objectId('El ID del usuario no es un ObjectId válido.'),
  }).strict(),
});

export const uploadUserPhotoSchema = z.object({
  params: z.object({
    userId: objectId('El ID del usuario no es un ObjectId válido.'),
  }),
});
