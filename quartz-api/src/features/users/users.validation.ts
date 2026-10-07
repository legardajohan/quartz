import { z } from 'zod';
import { UserRole, IdentificationType, GradeLevel } from '../auth/auth.types';
import { strongPasswordSchema } from '../auth/auth.validation';
import { STAFF_ROLES, IMPORT_KINDS, IMPORT_MAX_ROWS } from './users.types';

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
    // CSV de roles del Equipo docente, p. ej. `Docente,Jefe de Área`.
    roles: z.string().refine(
      (val) => val.split(',').every((r) => (STAFF_ROLES as readonly string[]).includes(r)),
      { message: 'Los roles no son válidos.' }
    ).optional(),
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
  email: z.string().trim().email('El correo no es válido.'),
}).strict();

const createAreaLeadSchema = z.object({
  ...baseUserFields,
  role: z.literal(UserRole.JEFE_DE_AREA),
  gradesTaught: z.array(z.nativeEnum(GradeLevel)).optional(),
  email: z.string().trim().email('El correo no es válido.'),
}).strict();

export const createUserSchema = z.object({
  body: z.discriminatedUnion('role', [createStudentSchema, createTeacherSchema, createAreaLeadSchema]),
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
    gradesTaught: z.array(z.nativeEnum(GradeLevel)).optional(),
    email: z.string().trim().email('El correo no es válido.').optional(),
    shiftId: objectId('El ID de la jornada no es un ObjectId válido.').nullable().optional(),
  }).strict(),
});

export const updateOwnProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'El nombre no puede estar vacío.').optional(),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'El apellido no puede estar vacío.').optional(),
    secondLastName: z.string().optional(),
    identificationType: z.nativeEnum(IdentificationType).optional(),
    identificationNumber: z.number().int('La identificación debe ser un número entero.').positive('La identificación debe ser un número positivo.').optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email('El correo no es válido.').optional(),
    schoolId: objectId('El ID de la sede no es un ObjectId válido.').optional(),
  }).strict(),
});

export const changeOwnPasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria.'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Debe confirmar la nueva contraseña.'),
  }).strict()
    .refine((b) => b.newPassword === b.confirmPassword, {
      message: 'Las contraseñas nuevas no coinciden.',
      path: ['confirmPassword'],
    })
    .refine((b) => b.newPassword !== b.currentPassword, {
      message: 'La nueva contraseña debe ser distinta de la actual.',
      path: ['newPassword'],
    }),
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

export const resendInvitationSchema = z.object({
  params: z.object({
    userId: objectId('El ID del usuario no es un ObjectId válido.'),
  }).strict(),
});

// ─── Cargue masivo (USR-05) ──────────────────────────────────────────────────

const importKindQuery = z.object({ kind: z.enum(IMPORT_KINDS) });

export const importTemplateSchema = z.object({ query: importKindQuery });

export const previewImportSchema = z.object({ query: importKindQuery });

// `schoolName` solo sirve para mostrar la preview: el confirm re-resuelve la sede por `schoolId`.
const importRowSchema = z.object({
  row: z.number().int().min(2),
  role: z.enum([UserRole.ESTUDIANTE, UserRole.DOCENTE, UserRole.JEFE_DE_AREA]),
  firstName: z.string().trim().min(1),
  middleName: z.string().optional(),
  lastName: z.string().trim().min(1),
  secondLastName: z.string().optional(),
  identificationType: z.nativeEnum(IdentificationType),
  identificationNumber: z.number().int().positive(),
  phoneNumber: z.string().optional(),
  email: z.string().trim().email().optional(),
  schoolId: objectId('El ID de la sede no es un ObjectId válido.'),
  schoolName: z.string().optional(),
  shiftId: objectId('El ID de la jornada no es un ObjectId válido.').optional(),
  gradesTaught: z.array(z.nativeEnum(GradeLevel)).max(Object.values(GradeLevel).length),
}).strict();

export const confirmImportSchema = z.object({
  body: z.object({
    kind: z.enum(IMPORT_KINDS),
    rows: z.array(importRowSchema).min(1).max(Math.max(...Object.values(IMPORT_MAX_ROWS))),
  }).strict().refine((b) => b.rows.length <= IMPORT_MAX_ROWS[b.kind], {
    message: 'Se superó el máximo de filas permitido para este tipo de cargue.',
    path: ['rows'],
  }),
});
