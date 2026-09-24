import { FilterQuery, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserDocument, User, SafeUser } from '../auth/auth.model';
import { UserAccountStatus, UserRole } from '../auth/auth.types';
import { StudentValuationModel } from '../student-valuation/student-valuation.model';
import {
  UserWithValuations,
  School,
  Shift,
  ValuationSummary,
  CreateUserDTO,
  UpdateUserDTO,
  OwnProfile,
  UpdateOwnProfileDTO,
  ChangeOwnPasswordDTO,
  ProfileRequestor,
  CreatedUserResponse,
  STAFF_ROLES,
  StaffRole,
} from './users.types';
import { Institution } from '../institution/institution.model';
import { SchoolModel, ISchoolDocument } from '../school/school.model';
import { getShiftSettings } from '../institution/institution.service';
import {
  findScoped,
  findOneScoped,
  findByIdScoped,
  createScoped,
  findOneAndUpdateScoped,
  findOneAndDeleteScoped,
} from '../../repositories/base.repository';
import AppError from '../../utils/AppError';
import { assertWebp } from '../../utils/assertWebp';
import { uploadImage, deleteImage, keyFromPublicUrl } from '../../services/r2.service';
import { sendMail } from '../../services/mail.service';
import { buildInvitationEmail } from '../../services/invitation-email.template';
import { generateActivationToken, INVITATION_RESEND_COOLDOWN_MS } from '../../utils/activationToken';

export interface GetUsersFilters {
  institutionId: string;
  id?: string;
  role?: string;
  roles?: StaffRole[];
  schoolId?: string;
  requestorRole?: UserRole;
  requestorSchoolId?: string;
}

function mapSchoolToDTO(school: Pick<ISchoolDocument, '_id' | 'schoolNumber' | 'name'>): School {
  return {
    _id: school._id.toString(),
    schoolNumber: school.schoolNumber,
    name: school.name,
  };
}

function mapUserToDTO(
  user: IUser & { _id: Types.ObjectId },
  school: Pick<ISchoolDocument, '_id' | 'schoolNumber' | 'name'>,
  shift: Shift | null = null
): UserWithValuations {
  return {
    _id: user._id.toString(),
    role: user.role,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    secondLastName: user.secondLastName,
    identificationType: user.identificationType,
    identificationNumber: user.identificationNumber,
    email: user.email,
    school: mapSchoolToDTO(school),
    gradesTaught: user.gradesTaught ?? [],
    valuations: [],
    avatarUrl: user.avatarUrl,
    shift,
    ...mapInvitationFields(user),
  };
}

// Estado de la invitación expuesto a la tabla. El hash del token nunca sale de la API.
function mapInvitationFields(
  user: Pick<IUser, 'accountStatus' | 'activationTokenExpiresAt'>
): Pick<UserWithValuations, 'accountStatus' | 'invitationExpiresAt'> {
  if (user.accountStatus !== UserAccountStatus.PENDIENTE) {
    return user.accountStatus ? { accountStatus: user.accountStatus } : {};
  }
  return {
    accountStatus: user.accountStatus,
    invitationExpiresAt: user.activationTokenExpiresAt?.toISOString(),
  };
}

function isStaffRole(role: UserRole): role is StaffRole {
  return (STAFF_ROLES as readonly UserRole[]).includes(role);
}

// Los endpoints /:userId no operan sobre el propio usuario: su cuenta se gestiona en Mi cuenta.
function assertNotSelf(userId: string, requestorId: string): void {
  if (userId === requestorId) {
    throw new AppError('Gestiona tu cuenta desde Mi cuenta.', 403);
  }
}

// El login busca el correo en minúsculas (`useAuthStore.login`): se guarda igual o el usuario queda fuera.
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildActivationUrl(token: string): string {
  const webOrigin = (process.env.WEB_ORIGIN ?? '').replace(/\/+$/, '');
  return `${webOrigin}/activar-cuenta?token=${encodeURIComponent(token)}`;
}

// Emite un token nuevo (invalida el anterior), lo persiste y envía el correo. El token se
// guarda antes del envío: si el SMTP falla, el reenvío emite otro.
async function issueInvitation(institutionId: string, userId: string): Promise<void> {
  const { token, tokenHash, expiresAt } = generateActivationToken();

  const user = await findOneAndUpdateScoped(
    User,
    institutionId,
    { _id: new Types.ObjectId(userId) },
    { $set: { activationTokenHash: tokenHash, activationTokenExpiresAt: expiresAt, invitationSentAt: new Date() } },
    { new: true }
  ).lean();

  if (!user || !user.email) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  const institution = await Institution.findById(institutionId).select('name').lean();

  const email = buildInvitationEmail({
    firstName: user.firstName,
    role: user.role,
    institutionName: institution?.name ?? '',
    activationUrl: buildActivationUrl(token),
    expiresAt,
  });

  await sendMail({ to: user.email, ...email });
}

// Jornadas embebidas en Institution.settings (referencia no poblable): se
// resuelven en memoria con un Map en vez de un populate.
async function resolveShiftMap(institutionId: string): Promise<Map<string, Shift>> {
  const { shifts } = await getShiftSettings(institutionId);
  return new Map(shifts.map((s) => [s._id, s]));
}

type SchoolSummary = Pick<ISchoolDocument, '_id' | 'schoolNumber' | 'name'>;

async function assertUniqueIdentification(
  institutionId: string,
  userId: string,
  identificationNumber: number
): Promise<void> {
  const duplicate = await findOneScoped(User, institutionId, {
    identificationNumber,
    _id: { $ne: new Types.ObjectId(userId) },
  }).lean();
  if (duplicate) {
    throw new AppError('Ya existe un usuario con esa identificación en la institución.', 409);
  }
}

// El correo es la llave de login (pre-tenant), por eso su unicidad es global y no scoped.
async function assertUniqueEmail(userId: string, email: string): Promise<void> {
  const existingEmail = await User.findOne({
    email,
    _id: { $ne: new Types.ObjectId(userId) },
  }).lean();
  if (existingEmail) {
    throw new AppError('Ya existe un usuario registrado con ese correo.', 409);
  }
}

async function assertSchoolInTenant(institutionId: string, schoolId: string): Promise<SchoolSummary> {
  const school = await findByIdScoped(SchoolModel, institutionId, schoolId).lean();
  if (!school) {
    throw new AppError('La sede no existe o no pertenece a la institución.', 422);
  }
  return school;
}

async function assertAssignableShift(institutionId: string, shiftId: string): Promise<Shift> {
  const { multipleShifts, shifts } = await getShiftSettings(institutionId);
  const found = multipleShifts ? shifts.find((s) => s._id === shiftId) : undefined;
  if (!found) {
    throw new AppError('La jornada no existe o no está habilitada en la institución.', 422);
  }
  return found;
}

export const getUsersByFilters = async (filters: GetUsersFilters): Promise<UserWithValuations[]> => {
  try {
    const targetRoles: UserRole[] = filters.roles?.length
      ? filters.roles
      : [(filters.role as UserRole) ?? UserRole.ESTUDIANTE];
    const targetRole = targetRoles.length === 1 ? targetRoles[0] : undefined;

    // Solo Jefe de Área puede listar el Equipo docente; un Docente que lo pida recibe [].
    if (targetRoles.some(isStaffRole) && filters.requestorRole !== UserRole.JEFE_DE_AREA) {
      return [];
    }

    const filter: FilterQuery<IUserDocument> = { role: { $in: targetRoles } };

    if (filters.id) {
      filter._id = new Types.ObjectId(filters.id);
    }

    if (targetRole === UserRole.ESTUDIANTE && filters.requestorRole === UserRole.DOCENTE) {
      // Docentes solo ven estudiantes de su propia sede.
      if (!filters.requestorSchoolId) {
        return [];
      }
      filter.schoolId = new Types.ObjectId(filters.requestorSchoolId);
    } else if (filters.schoolId) {
      filter.schoolId = new Types.ObjectId(filters.schoolId);
    }

    // 1. Fetch the base user data.
    const users = await findScoped(User, filters.institutionId, filter)
      .select({
        role: 1,
        firstName: 1,
        middleName: 1,
        lastName: 1,
        secondLastName: 1,
        identificationType: 1,
        identificationNumber: 1,
        email: 1,
        schoolId: 1,
        gradesTaught: 1,
        avatarUrl: 1,
        shiftId: 1,
        accountStatus: 1,
        activationTokenExpiresAt: 1,
      })
      .lean()
      .exec();

    if (users.length === 0) {
      return [];
    }

    // 2. Fetch all valuations for the found users in a single query (empty for docentes).
    const userIds = users.map(user => user._id);
    const valuations = await findScoped(StudentValuationModel, filters.institutionId, {
      studentId: { $in: userIds },
    })
      .select('_id studentId periodId globalStatus')
      .lean()
      .exec();

    // Fetch schools for the found users in a single query.
    const userSchools = users.map(user => user.schoolId);
    const schools = await findScoped(SchoolModel, filters.institutionId, {
      _id: { $in: userSchools },
    })
      .select('_id schoolNumber name')
      .lean()
      .exec();

    // Jornadas del inquilino (no poblable): un solo Map para toda la respuesta.
    const shiftMap = await resolveShiftMap(filters.institutionId);

    // 3. Group valuations by studentId for efficient lookup.
    const valuationsMap = new Map<string, ValuationSummary[]>();
    for (const valuation of valuations) {
      const studentIdStr = (valuation as any).studentId.toString();
      if (!valuationsMap.has(studentIdStr)) {
        valuationsMap.set(studentIdStr, []);
      }
      valuationsMap.get(studentIdStr)!.push({
        _id: (valuation as any)._id.toString(),
        periodId: (valuation as any).periodId.toString(),
        status: (valuation as any).globalStatus,
      });
    }

    // 4. Map users to the final DTO, enriching them with their valuations.
    const enrichedUsers = users.map(user => {
      const userValuations = valuationsMap.get((user as any)._id.toString()) || [];
      const userSchool = schools.find(s => (s as any)._id.toString() === (user as any).schoolId.toString());

      const schoolDTO = userSchool ? {
        _id: (userSchool as any)._id.toString(),
        schoolNumber: (userSchool as any).schoolNumber,
        name: (userSchool as any).name
      } : undefined;

      const { schoolId, shiftId, accountStatus, activationTokenExpiresAt, ...userWithoutSchoolId } = user as any;
      const shift = shiftId ? shiftMap.get(shiftId.toString()) ?? null : null;

      return {
        ...userWithoutSchoolId,
        _id: (user as any)._id.toString(),
        school: schoolDTO!,
        gradesTaught: (user as any).gradesTaught || [],
        valuations: userValuations,
        shift,
        ...mapInvitationFields({ accountStatus, activationTokenExpiresAt }),
      };
    });

    return enrichedUsers;
  } catch (error) {
    console.error('Error in getUsersByFilters:', error);
    throw error;
  }
};

export const createUser = async (
  institutionId: string,
  data: CreateUserDTO
): Promise<CreatedUserResponse> => {
  const school = await findByIdScoped(SchoolModel, institutionId, data.schoolId).lean();
  if (!school) {
    throw new AppError('La sede no existe o no pertenece a la institución.', 422);
  }

  const existingIdentification = await findOneScoped(User, institutionId, {
    identificationNumber: data.identificationNumber,
  }).lean();
  if (existingIdentification) {
    throw new AppError('Ya existe un usuario con esa identificación en la institución.', 409);
  }

  const userData: Record<string, unknown> = {
    role: data.role,
    firstName: data.firstName,
    middleName: data.middleName,
    lastName: data.lastName,
    secondLastName: data.secondLastName,
    identificationType: data.identificationType,
    identificationNumber: data.identificationNumber,
    phoneNumber: data.phoneNumber,
    schoolId: new Types.ObjectId(data.schoolId),
    gradesTaught: data.gradesTaught ?? [],
  };

  let shift: Shift | null = null;
  if (data.shiftId !== undefined) {
    shift = await assertAssignableShift(institutionId, data.shiftId);
    userData.shiftId = new Types.ObjectId(data.shiftId);
  }

  const isStaff = isStaffRole(data.role);
  if (isStaff) {
    // Sin contraseña: la crea el propio usuario desde el enlace de invitación (USR-04).
    const email = normalizeEmail(data.email as string);
    const existingEmail = await User.findOne({ email }).lean();
    if (existingEmail) {
      throw new AppError('Ya existe un usuario registrado con ese correo.', 409);
    }
    userData.email = email;
    userData.accountStatus = UserAccountStatus.PENDIENTE;
  }

  const created = await createScoped(User, institutionId, userData);
  const createdId = String(created._id);

  let invitationEmailSent = false;
  if (isStaff) {
    try {
      await issueInvitation(institutionId, createdId);
      invitationEmailSent = true;
    } catch (error) {
      // El alta se conserva Pendiente; el Jefe de Área puede reenviar la invitación.
      console.error('No se pudo enviar la invitación del usuario', createdId, error);
    }
  }

  // Tras emitir la invitación el documento ya tiene su vencimiento: se relee para exponerlo.
  const persisted = isStaff ? await findByIdScoped(User, institutionId, createdId).lean() : null;
  const source = (persisted ?? created.toObject()) as unknown as IUser & { _id: Types.ObjectId };

  return { ...mapUserToDTO(source, school, shift), invitationEmailSent };
};

export const resendInvitation = async (
  institutionId: string,
  userId: string,
  requestorId: string
): Promise<void> => {
  assertNotSelf(userId, requestorId);

  const target = await findByIdScoped(User, institutionId, userId).lean();
  if (!target || !isStaffRole(target.role)) {
    throw new AppError('Usuario no encontrado.', 404);
  }
  if (target.accountStatus !== UserAccountStatus.PENDIENTE) {
    throw new AppError('La cuenta ya está activa.', 409);
  }
  const sinceLastSend = target.invitationSentAt ? Date.now() - new Date(target.invitationSentAt).getTime() : Infinity;
  if (sinceLastSend < INVITATION_RESEND_COOLDOWN_MS) {
    throw new AppError('Ya se envió una invitación hace un momento. Espera un minuto antes de reenviarla.', 429);
  }

  try {
    await issueInvitation(institutionId, userId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('No se pudo reenviar la invitación del usuario', userId, error);
    throw new AppError('No se pudo enviar el correo de invitación. Inténtalo de nuevo.', 502);
  }
};

export interface UpdateUserRequestor {
  userId: string;
  role: UserRole;
  schoolId?: string;
}

export const updateUser = async (
  institutionId: string,
  userId: string,
  data: UpdateUserDTO,
  requestor: UpdateUserRequestor
): Promise<UserWithValuations> => {
  assertNotSelf(userId, requestor.userId);

  const existing = await findByIdScoped(User, institutionId, userId).lean();
  if (!existing) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  if (requestor.role === UserRole.DOCENTE) {
    const isOwnStudent = existing.role === UserRole.ESTUDIANTE && existing.schoolId.toString() === requestor.schoolId;
    if (!isOwnStudent) {
      throw new AppError('Usuario no encontrado.', 404);
    }
    if (data.schoolId !== undefined) {
      throw new AppError('No puedes cambiar la sede de un usuario.', 403);
    }
  }

  if (
    data.identificationNumber !== undefined &&
    data.identificationNumber !== existing.identificationNumber
  ) {
    await assertUniqueIdentification(institutionId, userId, data.identificationNumber);
  }

  let school: SchoolSummary | null = null;
  if (data.schoolId !== undefined) {
    school = await assertSchoolInTenant(institutionId, data.schoolId);
  }

  if (existing.role === UserRole.DOCENTE && data.gradesTaught?.length === 0) {
    throw new AppError('El docente debe tener al menos un grado.', 400);
  }

  const email = data.email !== undefined ? normalizeEmail(data.email) : undefined;
  const emailChanged = email !== undefined && email !== existing.email;
  if (emailChanged) {
    await assertUniqueEmail(userId, email);
  }

  const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
  delete updatePayload.shiftId;
  if (email !== undefined) {
    updatePayload.email = email;
  }
  if (data.schoolId !== undefined) {
    updatePayload.schoolId = new Types.ObjectId(data.schoolId);
  }

  // shiftId: undefined → no se toca; null → se desasigna (`$unset`); string → se valida y reasigna.
  let resolvedShift: Shift | null | undefined;
  if (data.shiftId !== undefined) {
    if (data.shiftId === null) {
      resolvedShift = null;
    } else {
      resolvedShift = await assertAssignableShift(institutionId, data.shiftId);
      updatePayload.shiftId = new Types.ObjectId(data.shiftId);
    }
  }

  const updateQuery: Record<string, unknown> = { $set: updatePayload };
  if (data.shiftId === null) {
    updateQuery.$unset = { shiftId: 1 };
  }

  const updated = await findOneAndUpdateScoped(
    User,
    institutionId,
    { _id: new Types.ObjectId(userId) },
    updateQuery,
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  // Pendiente con correo nuevo: el enlace anterior iba a otra bandeja, se reemplaza y reenvía.
  let invitationFields = mapInvitationFields(updated);
  if (emailChanged && existing.accountStatus === UserAccountStatus.PENDIENTE) {
    try {
      await issueInvitation(institutionId, userId);
    } catch (error) {
      console.error('No se pudo enviar la invitación al nuevo correo del usuario', userId, error);
      throw new AppError('Se guardaron los cambios, pero no se pudo enviar la invitación al nuevo correo. Usa "Reenviar invitación".', 502);
    }
    const refreshed = await findByIdScoped(User, institutionId, userId).lean();
    if (refreshed) invitationFields = mapInvitationFields(refreshed);
  }

  const resolvedSchool = school ?? await findByIdScoped(SchoolModel, institutionId, updated.schoolId.toString()).lean();
  if (!resolvedSchool) {
    throw new AppError('La sede no existe o no pertenece a la institución.', 422);
  }

  if (resolvedShift === undefined) {
    const updatedShiftId = (updated as unknown as IUser).shiftId;
    if (updatedShiftId) {
      const shiftMap = await resolveShiftMap(institutionId);
      resolvedShift = shiftMap.get(updatedShiftId.toString()) ?? null;
    } else {
      resolvedShift = null;
    }
  }

  return {
    ...mapUserToDTO(updated as unknown as IUser & { _id: Types.ObjectId }, resolvedSchool, resolvedShift),
    ...invitationFields,
  };
};

export const deleteUser = async (institutionId: string, userId: string, requestorId: string): Promise<void> => {
  assertNotSelf(userId, requestorId);

  const deleted = await findOneAndDeleteScoped(User, institutionId, {
    _id: new Types.ObjectId(userId),
  }).lean();

  if (!deleted) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  if (deleted.avatarUrl) {
    const key = keyFromPublicUrl(deleted.avatarUrl);
    if (key) {
      await deleteImage(key);
    }
  }
};

export interface PhotoUploadRequester {
  role: UserRole;
  schoolId?: string;
}

export const uploadUserPhoto = async (
  institutionId: string,
  userId: string,
  file: Express.Multer.File,
  requester: PhotoUploadRequester
): Promise<SafeUser> => {
  assertWebp(file.buffer);

  const target = await findOneScoped(User, institutionId, {
    _id: new Types.ObjectId(userId),
  }).lean();

  if (!target) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  if (requester.role === UserRole.DOCENTE) {
    const isOwnStudent = target.role === UserRole.ESTUDIANTE && target.schoolId.toString() === requester.schoolId;
    if (!isOwnStudent) {
      throw new AppError('Usuario no encontrado.', 404);
    }
  }

  return replaceUserPhoto(institutionId, userId, file.buffer, target.avatarUrl);
};

// Sube la nueva foto, apunta `avatarUrl` a ella y borra la anterior del almacenamiento.
// El llamador ya validó el WebP, que el usuario existe en el tenant y que puede tocarlo.
async function replaceUserPhoto(
  institutionId: string,
  userId: string,
  buffer: Buffer,
  previousAvatarUrl: string | undefined
): Promise<SafeUser> {
  const key = `institutions/${institutionId}/users/${userId}/photo-${Date.now()}.webp`;
  const avatarUrl = await uploadImage(key, buffer, 'image/webp');

  const updated = await findOneAndUpdateScoped(
    User,
    institutionId,
    { _id: new Types.ObjectId(userId) },
    { $set: { avatarUrl } },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  if (previousAvatarUrl) {
    const previousKey = keyFromPublicUrl(previousAvatarUrl);
    if (previousKey) {
      await deleteImage(previousKey);
    }
  }

  // passwordHash tiene `select: false`; el documento .lean() ya lo excluye.
  return updated as unknown as SafeUser;
}

// ─── Mi cuenta (USR-03) ──────────────────────────────────────────────────────
// `userId` llega siempre de `req.user._id`: estas funciones nunca operan sobre un id del cliente.

function mapOwnProfile(user: SafeUser, school: SchoolSummary): OwnProfile {
  return {
    _id: user._id.toString(),
    role: user.role,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    secondLastName: user.secondLastName,
    identificationType: user.identificationType,
    identificationNumber: user.identificationNumber,
    phoneNumber: user.phoneNumber,
    email: user.email,
    school: mapSchoolToDTO(school),
    avatarUrl: user.avatarUrl,
  };
}

async function findOwnUser(institutionId: string, userId: string): Promise<SafeUser> {
  // passwordHash tiene `select: false`; el documento .lean() ya lo excluye.
  const user = await findByIdScoped(User, institutionId, userId).lean();
  if (!user) {
    throw new AppError('Usuario no encontrado.', 404);
  }
  return user as unknown as SafeUser;
}

async function toOwnProfile(institutionId: string, user: SafeUser): Promise<OwnProfile> {
  const school = await assertSchoolInTenant(institutionId, user.schoolId.toString());
  return mapOwnProfile(user, school);
}

export const getOwnProfile = async (institutionId: string, userId: string): Promise<OwnProfile> => {
  const user = await findOwnUser(institutionId, userId);
  return toOwnProfile(institutionId, user);
};

export const updateOwnProfile = async (
  institutionId: string,
  data: UpdateOwnProfileDTO,
  requestor: ProfileRequestor
): Promise<OwnProfile> => {
  const { userId, role } = requestor;

  if (role !== UserRole.JEFE_DE_AREA && (data.email !== undefined || data.schoolId !== undefined)) {
    throw new AppError('Solo el Jefe de Área puede cambiar su correo o su sede.', 403);
  }

  const existing = await findOwnUser(institutionId, userId);

  if (
    data.identificationNumber !== undefined &&
    data.identificationNumber !== existing.identificationNumber
  ) {
    await assertUniqueIdentification(institutionId, userId, data.identificationNumber);
  }

  // El login busca el correo en minúsculas (`useAuthStore.login`): se guarda igual o el usuario queda fuera.
  const email = data.email?.trim().toLowerCase();
  if (email !== undefined && email !== existing.email) {
    await assertUniqueEmail(userId, email);
  }

  const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (email !== undefined) {
    updatePayload.email = email;
  }
  if (data.schoolId !== undefined) {
    await assertSchoolInTenant(institutionId, data.schoolId);
    updatePayload.schoolId = new Types.ObjectId(data.schoolId);
  }

  const updated = await findOneAndUpdateScoped(
    User,
    institutionId,
    { _id: new Types.ObjectId(userId) },
    { $set: updatePayload },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  return toOwnProfile(institutionId, updated as unknown as SafeUser);
};

export const changeOwnPassword = async (
  institutionId: string,
  userId: string,
  data: ChangeOwnPasswordDTO
): Promise<void> => {
  const user = await findByIdScoped(User, institutionId, userId)
    .select('+passwordHash')
    .lean();

  if (!user) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  // 422 y no 401: el cliente cierra la sesión ante cualquier 401.
  const isValid = user.passwordHash ? await bcrypt.compare(data.currentPassword, user.passwordHash) : false;
  if (!isValid) {
    throw new AppError('La contraseña actual es incorrecta.', 422);
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 10);
  await findOneAndUpdateScoped(
    User,
    institutionId,
    { _id: new Types.ObjectId(userId) },
    { $set: { passwordHash, updatedAt: new Date() } }
  );
};

export const uploadOwnPhoto = async (
  institutionId: string,
  userId: string,
  file: Express.Multer.File
): Promise<OwnProfile> => {
  assertWebp(file.buffer);
  const existing = await findOwnUser(institutionId, userId);
  const updated = await replaceUserPhoto(institutionId, userId, file.buffer, existing.avatarUrl);
  return toOwnProfile(institutionId, updated);
};
