import { FilterQuery, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserDocument, User, SafeUser } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';
import { StudentValuationModel } from '../student-valuation/student-valuation.model';
import { UserWithValuations, School, Shift, ValuationSummary, CreateUserDTO, UpdateUserDTO } from './users.types';
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

export interface GetUsersFilters {
  institutionId: string;
  id?: string;
  role?: string;
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
  };
}

// Jornadas embebidas en Institution.settings (referencia no poblable): se
// resuelven en memoria con un Map en vez de un populate.
async function resolveShiftMap(institutionId: string): Promise<Map<string, Shift>> {
  const { shifts } = await getShiftSettings(institutionId);
  return new Map(shifts.map((s) => [s._id, s]));
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
    const targetRole = (filters.role as UserRole) ?? UserRole.ESTUDIANTE;

    if (targetRole !== UserRole.ESTUDIANTE && targetRole !== UserRole.DOCENTE) {
      return [];
    }

    // Solo Jefe de Área puede listar docentes; un Docente que las pida recibe [].
    if (targetRole === UserRole.DOCENTE && filters.requestorRole !== UserRole.JEFE_DE_AREA) {
      return [];
    }

    const filter: FilterQuery<IUserDocument> = { role: targetRole };

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

      const { schoolId, shiftId, ...userWithoutSchoolId } = user as any;
      const shift = shiftId ? shiftMap.get(shiftId.toString()) ?? null : null;

      return {
        ...userWithoutSchoolId,
        _id: (user as any)._id.toString(),
        school: schoolDTO!,
        gradesTaught: (user as any).gradesTaught || [],
        valuations: userValuations,
        shift,
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
): Promise<UserWithValuations> => {
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
    gradesTaught: data.gradesTaught,
  };

  let shift: Shift | null = null;
  if (data.shiftId !== undefined) {
    shift = await assertAssignableShift(institutionId, data.shiftId);
    userData.shiftId = new Types.ObjectId(data.shiftId);
  }

  if (data.role === UserRole.DOCENTE) {
    const existingEmail = await User.findOne({ email: data.email }).lean();
    if (existingEmail) {
      throw new AppError('Ya existe un usuario registrado con ese correo.', 409);
    }
    userData.email = data.email;
    userData.passwordHash = await bcrypt.hash(data.password as string, 10);
  }

  const created = await createScoped(User, institutionId, userData);

  return mapUserToDTO(created.toObject() as unknown as IUser & { _id: Types.ObjectId }, school, shift);
};

export const updateUser = async (
  institutionId: string,
  userId: string,
  data: UpdateUserDTO
): Promise<UserWithValuations> => {
  const existing = await findByIdScoped(User, institutionId, userId).lean();
  if (!existing) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  if (
    data.identificationNumber !== undefined &&
    data.identificationNumber !== existing.identificationNumber
  ) {
    const duplicate = await findOneScoped(User, institutionId, {
      identificationNumber: data.identificationNumber,
      _id: { $ne: new Types.ObjectId(userId) },
    }).lean();
    if (duplicate) {
      throw new AppError('Ya existe un usuario con esa identificación en la institución.', 409);
    }
  }

  let school: Pick<ISchoolDocument, '_id' | 'schoolNumber' | 'name'> | null = null;
  if (data.schoolId !== undefined) {
    school = await findByIdScoped(SchoolModel, institutionId, data.schoolId).lean();
    if (!school) {
      throw new AppError('La sede no existe o no pertenece a la institución.', 422);
    }
  }

  if (data.email !== undefined) {
    const existingEmail = await User.findOne({
      email: data.email,
      _id: { $ne: new Types.ObjectId(userId) },
    }).lean();
    if (existingEmail) {
      throw new AppError('Ya existe un usuario registrado con ese correo.', 409);
    }
  }

  const updatePayload: Record<string, unknown> = { ...data };
  delete updatePayload.password;
  delete updatePayload.shiftId;
  if (data.schoolId !== undefined) {
    updatePayload.schoolId = new Types.ObjectId(data.schoolId);
  }
  if (data.password) {
    updatePayload.passwordHash = await bcrypt.hash(data.password, 10);
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

  return mapUserToDTO(updated as unknown as IUser & { _id: Types.ObjectId }, resolvedSchool, resolvedShift);
};

export const deleteUser = async (institutionId: string, userId: string): Promise<void> => {
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

  const key = `institutions/${institutionId}/users/${userId}/photo-${Date.now()}.webp`;
  const avatarUrl = await uploadImage(key, file.buffer, 'image/webp');

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

  if (target.avatarUrl) {
    const previousKey = keyFromPublicUrl(target.avatarUrl);
    if (previousKey) {
      await deleteImage(previousKey);
    }
  }

  // passwordHash tiene `select: false`; el documento .lean() ya lo excluye.
  return updated as unknown as SafeUser;
};
